import Decimal from "decimal.js";
export const STAGES = [
    "공장",
    "항구 이동",
    "선적 전",
    "선적 후",
    "수입 완료",
    "창고 입고",
    "확인 필요",
];
export const MENUS = [
    "mail",
    "equipment",
    "deals",
    "quotes",
    "customers",
    "files",
    "calendar",
    "tags",
];
export const ACTIONS = [
    "send",
    "view",
    "create",
    "edit",
    "delete",
    "upload",
    "download",
    "confirm",
    "correct",
    "manage",
];
export const DEFAULT_PERMISSIONS = Object.fromEntries(MENUS.map((m) => [
    m,
    [
        "view",
        "create",
        "edit",
        "upload",
        "download",
        ...(m === "deals" ? ["confirm"] : []),
        ...(m === "tags" ? ["manage"] : []),
    ],
]));
export function can(user, menu, action = "view") {
    if (!user?.active)
        return false;
    if (user.role === "master")
        return true;
    if (["accounts", "accounting", "locks"].includes(menu))
        return false;
    return (!!user.permissions?.[menu]?.includes("view") &&
        !!user.permissions?.[menu]?.includes(action));
}
export function moneyParts(amount, currency = "KRW", vat = "excluded", rate = 10) {
    if (!["KRW", "USD", "JPY"].includes(currency) ||
        !["excluded", "included", "none"].includes(vat))
        throw Error("통화 또는 부가세 설정을 확인해 주세요.");
    const a = new Decimal(amount ?? 0), r = new Decimal(rate);
    if (!a.isFinite() || a.isNegative() || !r.isFinite() || r.lt(0) || r.gt(100))
        throw Error("금액과 세율을 확인해 주세요.");
    const dp = currency === "USD" ? 2 : 0;
    if (a.decimalPlaces() > dp || a.gt("9999999999999"))
        throw Error(`${currency} 금액의 자릿수를 확인해 주세요.`);
    const round = (n) => n.toDecimalPlaces(dp, Decimal.ROUND_HALF_UP);
    const net = vat === "included" ? round(a.div(r.div(100).plus(1))) : a;
    const tax = vat === "none"
        ? new Decimal(0)
        : vat === "included"
            ? a.minus(net)
            : round(net.mul(r).div(100));
    return {
        net: net.toNumber(),
        tax: tax.toNumber(),
        total: net.plus(tax).toNumber(),
    };
}
export function krwNet(amount, currency, vat, taxRate, fx) {
    if (currency !== "KRW" &&
        (!fx || !new Decimal(fx).isFinite() || new Decimal(fx).lte(0)))
        throw Error("유효한 환율이 필요합니다.");
    return new Decimal(moneyParts(amount, currency, vat, taxRate).net)
        .mul(currency === "KRW" ? 1 : fx)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber();
}
export function totals(deal) {
    const rows = deal.lines.filter((x) => !x.cancelled);
    const buy = rows.reduce((a, x) => a + (x.buyKrw || 0), 0);
    const sell = rows.reduce((a, x) => a +
        (x.sellKrw ??
            krwNet(x.amount, deal.currency, deal.vat, deal.taxRate, deal.fx)), 0);
    return { buy, sell, profit: sell - buy, count: rows.length };
}
export function equipmentStatus(id, deals, equipment) {
    if (deals.some((d) => d.status === "확정" &&
        d.lines.some((l) => l.equipmentId === id && !l.cancelled)))
        return "판매확정";
    if (deals.some((d) => d.status === "진행중" && d.lines.some((l) => l.equipmentId === id)))
        return "영업중";
    if (equipment?.legacySourceId && equipment.listingStatus === "판매완료")
        return "이전 판매완료";
    return "재고";
}
export function emailList(customers) {
    let blocked = 0, invalid = 0, duplicate = 0;
    const found = new Set();
    for (const c of customers)
        for (const p of c.contacts || []) {
            if (c.blocked) {
                blocked++;
                continue;
            }
            const email = p.email?.trim().toLowerCase();
            if (!email || !/^[^\s@;<>]+@[^\s@;<>]+\.[^\s@;<>]+$/.test(email)) {
                invalid++;
                continue;
            }
            if (found.has(email))
                duplicate++;
            else
                found.add(email);
        }
    return {
        text: [...found].join("; "),
        count: found.size,
        blocked,
        invalid,
        duplicate,
    };
}
export function colName(n) {
    let s = "";
    for (n++; n; n = Math.floor((n - 1) / 26))
        s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
}
export function cellAddress(a) {
    const m = /^([A-Z]+)([1-9]\d*)$/i.exec(a);
    if (!m)
        throw Error("#REF!");
    return [
        Number(m[2]) - 1,
        [...m[1].toUpperCase()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) -
            1,
    ];
}
// Small recursive-descent parser: no eval, Function, or executable input.
export function evaluateCell(cells, row, col, visiting = new Set()) {
    const key = `${row},${col}`;
    if (visiting.has(key))
        throw Error("#CYCLE!");
    if (row < 0 ||
        col < 0 ||
        row >= cells.length ||
        col >= (cells[row]?.length || 0))
        throw Error("#REF!");
    const raw = String(cells[row][col] ?? "").trim();
    if (!raw.startsWith("=")) {
        if (raw.startsWith("#"))
            throw Error(raw);
        if (raw === "")
            return 0;
        const n = Number(raw.replaceAll(",", ""));
        if (!Number.isFinite(n))
            throw Error("#VALUE!");
        return n;
    }
    const source = raw.slice(1).replace(/\s/g, "").toUpperCase();
    const tokens = source.match(/[A-Z]+[1-9]\d*|(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/]/g) || [];
    if (tokens.join("") !== source || !tokens.length || tokens.length > 1000)
        throw Error("#FORMULA!");
    const nextVisited = new Set(visiting).add(key);
    let i = 0;
    const atom = () => {
        const t = tokens[i++];
        if (t === "+")
            return atom();
        if (t === "-")
            return -atom();
        if (t === "(") {
            const n = sum();
            if (tokens[i++] !== ")")
                throw Error("#FORMULA!");
            return n;
        }
        if (/^[A-Z]/.test(t || "")) {
            const [r, c] = cellAddress(t);
            return evaluateCell(cells, r, c, nextVisited);
        }
        if (!t || !/^[\d.]/.test(t))
            throw Error("#FORMULA!");
        return Number(t);
    };
    const product = () => {
        let n = atom();
        while (["*", "/"].includes(tokens[i])) {
            const op = tokens[i++], v = atom();
            if (op === "/" && v === 0)
                throw Error("#DIV/0!");
            n = op === "*" ? n * v : n / v;
        }
        return n;
    };
    const sum = () => {
        let n = product();
        while (["+", "-"].includes(tokens[i])) {
            const op = tokens[i++], v = product();
            n = op === "+" ? n + v : n - v;
        }
        return n;
    };
    const result = sum();
    if (i !== tokens.length || !Number.isFinite(result))
        throw Error("#FORMULA!");
    return Math.round(result * 1e10) / 1e10;
}
export function cellDisplay(cells, r, c) {
    if (!String(cells[r]?.[c] ?? "").startsWith("="))
        return cells[r]?.[c] ?? "";
    try {
        return evaluateCell(cells, r, c);
    }
    catch (e) {
        return e.message;
    }
}
export function deleteSheetAxis(cells, axis, at) {
    const next = cells
        .map((row, r) => row.filter((_, c) => axis !== "column" || c !== at))
        .filter((_, r) => axis !== "row" || r !== at);
    return next.map((row) => row.map((raw) => typeof raw === "string" && raw.startsWith("=")
        ? raw.replace(/[A-Z]+[1-9]\d*/g, (ref) => {
            let [r, c] = cellAddress(ref);
            const n = axis === "row" ? r : c;
            if (n === at)
                return "#REF!";
            if (n > at) {
                if (axis === "row")
                    r--;
                else
                    c--;
            }
            return colName(c) + (r + 1);
        })
        : raw));
}
export function insertSheetAxis(cells, axis, at) {
    const rows = cells.map((row) => [...row]);
    if (axis === "row")
        rows.splice(at, 0, Array(rows[0]?.length || 1).fill(""));
    else
        for (const row of rows)
            row.splice(at, 0, "");
    return rows.map((row) => row.map((raw) => typeof raw === "string" && raw.startsWith("=")
        ? raw.replace(/[A-Z]+[1-9]\d*/g, (ref) => {
            let [r, c] = cellAddress(ref);
            if (axis === "row" && r >= at)
                r++;
            if (axis === "column" && c >= at)
                c++;
            return colName(c) + (r + 1);
        })
        : raw));
}
const parseDate = (s) => new Date(`${s.slice(0, 10)}T00:00:00Z`);
const dateKey = (d) => d.toISOString().slice(0, 10);
const DAY = 86400000;
export function occurrences(event, from, to) {
    const start = parseDate(event.start), end = parseDate(event.end || event.start), lo = parseDate(from), hi = parseDate(to), repeat = event.repeat || {};
    const every = Math.max(1, Number(repeat.interval || 1)), out = [];
    if (![start, end, lo, hi].every((d) => Number.isFinite(d.getTime())))
        return out;
    const add = (d, index) => {
        const key = dateKey(d);
        if ((repeat.until && key > repeat.until) ||
            (event.untilBefore && key >= event.untilBefore) ||
            (repeat.count && index >= repeat.count))
            return false;
        const ex = event.exceptions?.[key];
        const duration = end - start;
        if (d <= hi && d.getTime() + duration >= lo.getTime() && !ex?.deleted)
            out.push({
                ...event,
                ...(ex || {}),
                occurrenceDate: key,
                start: ex?.start || key + event.start.slice(10),
                end: ex?.end ||
                    dateKey(new Date(d.getTime() + duration)) +
                        (event.end || event.start).slice(10),
                occurrenceId: `${event.id}:${key}`,
            });
        return true;
    };
    if (!repeat.frequency || repeat.frequency === "none") {
        add(start, 0);
        return out;
    }
    // Iterate by candidate dates, keeping the original month/year anchor.
    let count = 0;
    for (let d = new Date(start), step = 0; d <= hi && step < 50000; step++) {
        let match = false;
        const days = Math.round((d - start) / DAY);
        if (repeat.frequency === "daily")
            match = days % every === 0;
        if (repeat.frequency === "weekly")
            match =
                Math.floor(days / 7) % every === 0 &&
                    (repeat.weekdays?.length
                        ? repeat.weekdays
                        : [start.getUTCDay()]).includes(d.getUTCDay());
        if (repeat.frequency === "monthly") {
            const months = (d.getUTCFullYear() - start.getUTCFullYear()) * 12 +
                d.getUTCMonth() -
                start.getUTCMonth();
            match =
                months % every === 0 &&
                    d.getUTCDate() ===
                        Math.min(start.getUTCDate(), new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate());
        }
        if (repeat.frequency === "yearly")
            match =
                (d.getUTCFullYear() - start.getUTCFullYear()) % every === 0 &&
                    d.getUTCMonth() === start.getUTCMonth() &&
                    d.getUTCDate() ===
                        Math.min(start.getUTCDate(), new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate());
        if (match && !add(d, count++))
            break;
        d = new Date(d.getTime() + DAY);
    }
    return out;
}
export function safeEmbed(url) {
    try {
        const u = new URL(url);
        if (u.protocol !== "https:")
            return null;
        let id;
        if (["www.youtube.com", "youtube.com"].includes(u.hostname))
            id =
                u.searchParams.get("v") ||
                    u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
        if (u.hostname === "youtu.be")
            id = u.pathname.slice(1);
        if (id && /^[\w-]{11}$/.test(id))
            return `https://www.youtube-nocookie.com/embed/${id}`;
        if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(u.hostname)) {
            id = u.pathname.match(/(?:\/video)?\/(\d+)/)?.[1];
            if (id)
                return `https://player.vimeo.com/video/${id}`;
        }
    }
    catch { }
    return null;
}
