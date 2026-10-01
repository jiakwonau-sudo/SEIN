import Decimal from "decimal.js";
import { krwNet } from "./domain.mjs";
export const TAX_CATEGORY = "tax-documents";
export const CASH_GROUPS = {
    income: "수입",
    import: "수입무역비",
    export: "수출무역비",
    expense: "일반경비",
    other: "기타경비",
};
export const mailDefaults = [
    [
        "ko",
        "상품 안내 (구버전 뉴스레터형)",
        "보유 설비 안내 · {{product_summary}}",
        "안녕하세요.\n아래 설비를 안내드립니다.\n\n{{products}}\n\n상세 자료와 견적이 필요하시면 회신 부탁드립니다.\n\n감사합니다.\n{{company}}",
    ],
    [
        "en",
        "Used equipment offer (newsletter)",
        "Used equipment available · {{product_summary}}",
        "Dear Sir or Madam,\n\nPlease review the available equipment below.\n\n{{products}}\n\nPlease reply to this email for further specifications and a quotation.\n\nBest regards,\n{{company}}",
    ],
    [
        "ja",
        "中古設備のご案内（ニュースレター型）",
        "中古設備のご案内 · {{product_summary}}",
        "お世話になっております。\n下記の中古設備をご案内いたします。\n\n{{products}}\n\n詳細仕様およびお見積りにつきましては、本メールにご返信ください。\n\nよろしくお願いいたします。\n{{company}}",
    ],
    [
        "zh",
        "二手设备介绍（简报样式）",
        "现有二手设备 · {{product_summary}}",
        "您好！\n以下是我们现有的二手设备信息。\n\n{{products}}\n\n如需详细规格或报价，请直接回复本邮件。\n\n谢谢！\n{{company}}",
    ],
].map(([language, name, subject, body]) => ({
    id: `default-${language}`,
    language,
    name,
    subject,
    body,
    version: 1,
    lock: "none",
}));
export function localDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}
export const sumMoney = (values) => values.reduce((a, v) => a.plus(v || 0), new Decimal(0)).toNumber();
export function cashSummary(entries, from, to) {
    const rows = entries.filter((e) => !e.cancelled && e.date >= from && e.date <= to && e.kind !== "transfer");
    const income = sumMoney(rows.filter((e) => e.kind === "income").map((e) => e.amount));
    const expense = sumMoney(rows.filter((e) => e.kind === "expense").map((e) => e.amount));
    return {
        income,
        expense,
        net: new Decimal(income).minus(expense).toNumber(),
        count: rows.length,
    };
}
export function cashBalance(account, entries, to) {
    if (to < account.openingDate)
        return null;
    return entries
        .filter((e) => !e.cancelled && e.date >= account.openingDate && e.date <= to)
        .reduce((balance, e) => {
        if (e.accountId === account.id)
            balance = balance.plus(e.kind === "income" ? e.amount : -e.amount);
        if (e.kind === "transfer" && e.toAccountId === account.id)
            balance = balance.plus(e.amount);
        return balance;
    }, new Decimal(account.openingBalance))
        .toNumber();
}
export function orderedEntries(entries) {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date) ||
        a.order - b.order ||
        a.id.localeCompare(b.id));
}
export function runningBalances(accounts, entries) {
    const balances = Object.fromEntries(accounts.map((a) => [a.id, a.openingBalance]));
    return orderedEntries(entries.filter((e) => !e.cancelled)).map((e) => {
        balances[e.accountId] = sumMoney([
            balances[e.accountId],
            e.kind === "income" ? e.amount : -e.amount,
        ]);
        if (e.kind === "transfer")
            balances[e.toAccountId] = sumMoney([balances[e.toAccountId], e.amount]);
        return {
            ...e,
            balance: balances[e.accountId],
            toBalance: e.kind === "transfer" ? balances[e.toAccountId] : null,
        };
    });
}
export function priorYearDate(date) {
    const [y, m, d] = date.split("-").map(Number);
    return `${y - 1}-${String(m).padStart(2, "0")}-${String(Math.min(d, new Date(y - 1, m, 0).getDate())).padStart(2, "0")}`;
}
export function growth(current, previous) {
    return previous.count && previous.income > 0
        ? new Decimal(current.income)
            .minus(previous.income)
            .div(previous.income)
            .times(100)
            .toNumber()
        : null;
}
export function pendingSales(deals) {
    const sold = new Set(deals
        .filter((d) => d.status === "확정")
        .flatMap((d) => d.lines.filter((l) => !l.cancelled).map((l) => l.equipmentId)));
    return deals
        .filter((d) => d.status === "진행중")
        .map((d) => ({
        ...d,
        availableLines: d.lines.filter((l) => !l.cancelled && !sold.has(l.equipmentId)),
    }))
        .filter((d) => d.availableLines.length)
        .map((d) => ({
        ...d,
        pendingAmount: sumMoney(d.availableLines.map((l) => krwNet(l.amount, d.currency, d.vat, d.taxRate, d.fx))),
    }));
}
export function renderMail(template, products, company) {
    const productText = renderMailProducts(products, template.language);
    const summary = products
        .slice(0, 2)
        .map(mailProductName)
        .join(", ") + (products.length > 2 ? ` 외 ${products.length - 2}건` : "");
    const replace = (value) => String(value || "")
        .replaceAll("{{products}}", productText)
        .replaceAll("{{product_count}}", String(products.length))
        .replaceAll("{{product_summary}}", summary)
        .replaceAll("{{company}}", company);
    return {
        subject: replace(template.subject),
        body: replace(template.body),
    };
}
const mailProductName = (p) => p.maker && !String(p.model).toLowerCase().includes(p.maker.toLowerCase())
    ? `${p.maker} ${p.model}`
    : p.model;
export function renderMailProducts(products, language = "ko") {
    const labels = {
        ko: ["메이커", "모델명", "설비번호"],
        en: ["Maker", "Model", "Equipment no."],
        ja: ["メーカー", "モデル", "設備番号"],
        zh: ["制造商", "型号", "设备编号"],
    }[language] || ["Maker", "Model", "No."];
    return products
        .map((p) => [
        p.maker && `${labels[0]}: ${p.maker}`,
        `${labels[1]}: ${p.model}`,
        `${labels[2]}: ${p.number}`,
        p.spec || "",
    ]
        .filter(Boolean)
        .join("\n"))
        .join("\n\n");
}
const escapeMailHtml = (value) => String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const textBlock = (value) => value?.trim()
    ? `<div style="white-space:pre-wrap;line-height:1.75;color:#27364a">${escapeMailHtml(value.trim())}</div>`
    : "";
export function renderMailHtml({ body, products = [], language = "ko" }) {
    const productText = renderMailProducts(products, language);
    const at = productText ? body.indexOf(productText) : -1;
    const before = at >= 0 ? body.slice(0, at) : body;
    const after = at >= 0 ? body.slice(at + productText.length) : "";
    const names = {
        ko: ["상품 정보", "메이커", "모델", "설비번호"],
        en: ["PRODUCT INFO", "Maker", "Model", "Equipment No."],
        ja: ["商品情報", "メーカー", "モデル", "設備番号"],
        zh: ["产品信息", "制造商", "型号", "设备编号"],
    }[language] || ["PRODUCT INFO", "Maker", "Model", "Equipment No."];
    const cards = products
        .map((p) => {
        const productName = mailProductName(p);
        const rows = [
            p.maker && [names[1], p.maker],
            [names[2], p.model],
            [names[3], p.number],
            ...(p.spec || "")
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                const match = line.match(/^([^:：]{1,45})[:：]\s*(.+)$/);
                return match ? [match[1], match[2]] : ["", line];
            }),
        ].filter(Boolean);
        const photoIds = p.photoIds?.length
            ? p.photoIds
            : p.photoId
                ? [p.photoId]
                : [];
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border:1px solid #dce3ec;border-collapse:separate;border-spacing:0;background:#ffffff">
        <tr><td style="padding:10px 16px;background:#173f70;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:.08em">${names[0]}</td></tr>
        <tr><td style="padding:18px 18px 8px;font-size:21px;font-weight:700;color:#132b49">${escapeMailHtml(productName || p.model)}</td></tr>
        ${photoIds.length ? `<tr><td style="padding:8px 14px 18px"><table role="presentation" width="100%" cellpadding="4" cellspacing="0"><tr>${photoIds.map((_, index) => `<td width="${Math.floor(100 / photoIds.length)}%" align="center" valign="middle"><img src="cid:photo-${escapeMailHtml(p.id)}-${index}" alt="${escapeMailHtml(productName || p.model)}" style="display:block;max-width:100%;width:auto;height:auto;margin:0 auto;border:0"></td>`).join("")}</tr></table></td></tr>` : ""}
        <tr><td style="padding:0 18px 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows
            .map(([label, value]) => `<tr>${label ? `<td width="32%" style="padding:8px 10px;border:1px solid #dce3ec;background:#f2f5f8;font-weight:700;color:#35465b">${escapeMailHtml(label)}</td>` : ""}<td${label ? "" : ' colspan="2"'} style="padding:8px 10px;border:1px solid #dce3ec;color:#27364a;white-space:pre-wrap">${escapeMailHtml(value)}</td></tr>`)
            .join("")}</table></td></tr>
      </table>`;
    })
        .join("");
    return `<!doctype html><html><body style="margin:0;padding:0;background:#eef2f6;font-family:Arial,'Noto Sans KR',sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 10px"><table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:#ffffff"><tr><td style="padding:22px 28px;background:#0f3159;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:.08em">SEIN CORPORATION</td></tr><tr><td style="padding:28px">${textBlock(before)}${cards}${textBlock(after)}</td></tr></table></td></tr></table></body></html>`;
}
