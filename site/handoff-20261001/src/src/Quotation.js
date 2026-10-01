import React, { useState } from "react";
import { FileText, Check, ExternalLink, ArrowRightLeft } from "lucide-react";
import { moneyParts } from "../shared/domain.mjs";
import { CurrencyFields } from "./business.js";
import { useApp, Button, Field, Modal, ErrorNote, fmt, request, } from "./ui.js";
const digits = (c) => (c === "USD" ? 2 : 0);
export function QuoteForm({ deal, previous }) {
    const { state, close, reload, notify } = useApp();
    const [dealId, setDealId] = useState(deal?.id || ""), [language, setLanguage] = useState(previous?.language || "ko"), [terms, setTerms] = useState(previous?.terms || deal?.terms || ""), [valid, setValid] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)), [error, setError] = useState(""), [busy, setBusy] = useState(false), [issued, setIssued] = useState(null);
    const makeLines = (d) => (d?.lines || [])
        .filter((x) => !x.cancelled)
        .map((l) => ({
        ...l,
        model: state.equipment.find((e) => e.id === l.equipmentId)?.model || l.model,
    }));
    const [settings, setSettings] = useState(previous ||
        deal || {
        currency: "KRW",
        vat: "excluded",
        taxRate: 10,
        fx: 1,
        fxDate: "",
        fxSource: "직접 입력",
    }), [lines, setLines] = useState(previous?.lines || makeLines(deal)), [source, setSource] = useState(null);
    const d = state.deals.find((x) => x.id === dealId);
    const total = lines.reduce((a, l) => {
        try {
            return (a +
                moneyParts(l.amount, settings.currency, settings.vat, settings.taxRate)
                    .total);
        }
        catch {
            return a;
        }
    }, 0);
    const changeSettings = (value) => {
        if (value.currency !== settings.currency) {
            setSource({
                currency: settings.currency,
                fx: settings.fx,
                lines: structuredClone(lines),
            });
            setLines(lines.map((l) => ({ ...l, amount: "" })));
        }
        setSettings(value);
    };
    return (React.createElement(Modal, { title: previous ? "새 견적 버전 발행" : "견적서 만들기", subtitle: "\uC77C\uBC18 \uD68C\uC0AC \uC591\uC2DD \u00B7 \uBC1C\uD589\uD55C PDF\uB294 \uBC84\uC804\uBCC4\uB85C \uBCF4\uAD00\uD569\uB2C8\uB2E4.", wide: true, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                if (!d)
                    return;
                setBusy(true);
                try {
                    const r = await request("/api/quotes", {
                        method: "POST",
                        body: JSON.stringify({
                            dealId,
                            language,
                            terms,
                            validUntil: valid,
                            version: d.version,
                            settings,
                            lines,
                        }),
                    });
                    await reload();
                    setIssued(r.id);
                    notify("견적 PDF를 발행했습니다.");
                }
                catch (e) {
                    setError(e.message);
                }
                finally {
                    setBusy(false);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                issued ? (React.createElement("div", { className: "success-block" },
                    React.createElement(Check, { size: 35 }),
                    React.createElement("h3", null, "\uACAC\uC801\uC11C\uAC00 \uBC1C\uD589\uB418\uC5C8\uC2B5\uB2C8\uB2E4"),
                    React.createElement("p", null, "\uB2F9\uC2DC \uACE0\uAC1D\u00B7\uC124\uBE44\u00B7\uAE08\uC561\u00B7\uD658\uC728\uC744 \uD568\uAED8 \uBCF4\uAD00\uD588\uC2B5\uB2C8\uB2E4."),
                    React.createElement("a", { className: "btn primary", target: "_blank", rel: "noreferrer", href: `/api/quotes/${issued}/pdf` },
                        "\uACAC\uC801 PDF \uC5F4\uAE30 ",
                        React.createElement(ExternalLink, { size: 15 })))) : (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "form-grid" },
                        React.createElement(Field, { label: "\uC5F0\uACB0 \uC601\uC5C5", required: true },
                            React.createElement("select", { required: true, value: dealId, onChange: (e) => {
                                    const next = state.deals.find((x) => x.id === e.target.value);
                                    setDealId(e.target.value);
                                    if (next) {
                                        setSettings(next);
                                        setLines(makeLines(next));
                                        setSource(null);
                                    }
                                } },
                                React.createElement("option", { value: "" }, "\uC601\uC5C5 \uC120\uD0DD"),
                                state.deals
                                    .filter((d) => ["진행중", "확정"].includes(d.status))
                                    .map((d) => (React.createElement("option", { key: d.id, value: d.id }, d.name))))),
                        React.createElement(Field, { label: "\uC5B8\uC5B4" },
                            React.createElement("select", { value: language, onChange: (e) => setLanguage(e.target.value) },
                                React.createElement("option", { value: "ko" }, "\uAD6D\uBB38"),
                                React.createElement("option", { value: "en" }, "English")))),
                    d && (React.createElement(React.Fragment, null,
                        React.createElement(CurrencyFields, { value: settings, onChange: changeSettings, hideAmount: true }),
                        previous && settings.currency === previous.currency && (React.createElement(Button, { type: "button", small: true, onClick: () => setSettings({
                                ...settings,
                                fx: previous.fx,
                                fxDate: previous.fxDate,
                                fxSource: previous.fxSource,
                            }) }, "\uC774\uC804 \uBC84\uC804 \uD658\uC728 \uC0AC\uC6A9")),
                        source && (React.createElement("div", { className: "exchange-box" },
                            React.createElement("span", null,
                                source.currency,
                                " \u2192 ",
                                settings.currency),
                            React.createElement(Button, { type: "button", small: true, icon: ArrowRightLeft, disabled: !settings.fx || !source.fx, onClick: () => setLines(lines.map((l) => ({
                                    ...l,
                                    amount: Number(((Number(source.lines.find((x) => x.equipmentId === l.equipmentId)?.amount || 0) *
                                        Number(source.fx)) /
                                        Number(settings.fx)).toFixed(digits(settings.currency))),
                                }))) }, "\uD658\uC728\uB85C \uAE08\uC561 \uD658\uC0B0"),
                            React.createElement("small", null, "\uBC18\uC62C\uB9BC\uB41C \uC124\uBE44\uBCC4 \uAE08\uC561\uC744 \uD655\uC778\uD55C \uB4A4 \uBC1C\uD589\uD558\uC138\uC694."))),
                        React.createElement("table", null,
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, language === "ko"
                                        ? "모델 / 설명"
                                        : "Equipment / Description"),
                                    React.createElement("th", { className: "num" },
                                        "\uAE08\uC561 (",
                                        settings.currency,
                                        ")"))),
                            React.createElement("tbody", null, lines.map((l, i) => (React.createElement("tr", { key: l.equipmentId },
                                React.createElement("td", null,
                                    React.createElement("input", { "aria-label": `${i + 1}번 설비 설명`, value: l.model, required: true, onChange: (e) => setLines(lines.map((x, j) => j === i
                                            ? { ...x, model: e.target.value }
                                            : x)) })),
                                React.createElement("td", null,
                                    React.createElement("input", { "aria-label": `${i + 1}번 설비 견적 금액`, type: "number", required: true, min: "0", step: settings.currency === "USD" ? ".01" : "1", value: l.amount, onChange: (e) => setLines(lines.map((x, j) => j === i
                                            ? { ...x, amount: e.target.value }
                                            : x)) }))))))),
                        React.createElement("div", { className: "quote-summary" },
                            React.createElement("span", null,
                                state.customers.find((c) => c.id === d.customerId)?.name,
                                " ",
                                "\u00B7 \uC124\uBE44 ",
                                lines.length,
                                "\uB300"),
                            React.createElement("strong", null,
                                fmt(total, settings.currency),
                                " ",
                                settings.currency),
                            React.createElement("small", null,
                                "\uBD80\uAC00\uC138\uB97C \uBC18\uC601\uD55C \uCD1D\uC561 \u00B7 \uD658\uC728 ",
                                settings.fx,
                                " \u00B7",
                                " ",
                                settings.fxDate,
                                " / ",
                                settings.fxSource)))),
                    React.createElement("div", { className: "form-grid" },
                        React.createElement(Field, { label: "\uC720\uD6A8\uAE30\uAC04" },
                            React.createElement("input", { type: "date", required: true, value: valid, onChange: (e) => setValid(e.target.value) }))),
                    React.createElement(Field, { label: language === "ko" ? "거래조건 및 비고" : "Terms & notes", hint: "\uC124\uBE44 \uC124\uBA85\uACFC \uC870\uAC74\uC740 \uC120\uD0DD\uD55C \uC5B8\uC5B4\uB85C \uC9C1\uC811 \uC791\uC131\uD574 \uC8FC\uC138\uC694." },
                        React.createElement("textarea", { rows: 4, value: terms, onChange: (e) => setTerms(e.target.value) })))),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, issued ? "닫기" : "취소"),
                !issued && (React.createElement(Button, { primary: true, icon: FileText, loading: busy, disabled: !d || !lines.length }, "PDF \uBC1C\uD589 \u00B7 \uC800\uC7A5"))))));
}
export function SalesConfirmation({ deal }) {
    const { state, act, close } = useApp();
    const quotes = state.quotes.filter((q) => q.dealId === deal.id);
    const [quoteId, setQuoteId] = useState(quotes.at(-1)?.id || ""), [busy, setBusy] = useState(false), [error, setError] = useState("");
    const selected = quotes.find((q) => q.id === quoteId) || deal;
    return (React.createElement(Modal, { title: "\uD310\uB9E4 \uD655\uC815", subtitle: "\uD655\uC815\uD55C \uB9E4\uC785\uAC00\u00B7\uD310\uB9E4\uAC00\u00B7\uD658\uC728\uC744 \uBCF4\uC874\uD558\uACE0 \uC2E4\uC801\uACFC \uD68C\uACC4\uC5D0 \uBC18\uC601\uD569\uB2C8\uB2E4.", onClose: close },
        React.createElement("div", { className: "modal-body" },
            React.createElement(Field, { label: "\uD655\uC815 \uAE30\uC900" },
                React.createElement("select", { value: quoteId, onChange: (e) => setQuoteId(e.target.value) },
                    React.createElement("option", { value: "" }, "\uACAC\uC801 \uC5C6\uC774 \u00B7 \uD604\uC7AC \uC601\uC5C5 \uAE08\uC561\uC73C\uB85C \uD655\uC815"),
                    quotes.map((q) => (React.createElement("option", { key: q.id, value: q.id },
                        q.number,
                        " \u00B7 v",
                        q.revision,
                        " \u00B7 ",
                        q.currency))))),
            React.createElement("div", { className: "quote-summary" },
                React.createElement("span", null,
                    deal.name,
                    " \u00B7 \uC124\uBE44 ",
                    selected.lines.length,
                    "\uB300"),
                React.createElement("strong", null,
                    fmt(selected.lines.reduce((a, l) => a + Number(l.amount), 0), selected.currency),
                    " ",
                    selected.currency),
                React.createElement("small", null,
                    "\uD658\uC728 ",
                    selected.fx,
                    " \u00B7 ",
                    selected.fxDate,
                    " \u00B7 ",
                    selected.fxSource)),
            React.createElement("p", { className: "hint" }, "\uC124\uBE44\uBCC4 \uAE08\uC561\uC744 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uAC70\uB798\uC5D0\uC11C \uC774\uBBF8 \uD310\uB9E4\uB41C \uC124\uBE44\uB294 \uD655\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."),
            React.createElement(ErrorNote, { error: error })),
        React.createElement("footer", { className: "modal-foot" },
            React.createElement(Button, { onClick: close }, "\uB3CC\uC544\uAC00\uAE30"),
            React.createElement(Button, { primary: true, loading: busy, onClick: async () => {
                    setBusy(true);
                    try {
                        await act({
                            action: "confirm",
                            type: "deals",
                            targetId: deal.id,
                            version: deal.version,
                            data: {
                                quoteId: quoteId || undefined,
                                total: selected.lines.reduce((a, l) => a + Number(l.amount), 0),
                            },
                        });
                        close();
                    }
                    catch (e) {
                        setError(e.message);
                    }
                    finally {
                        setBusy(false);
                    }
                } }, "\uD310\uB9E4 \uD655\uC815"))));
}
