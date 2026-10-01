import React, { useMemo, useState } from "react";
import { useApp, Button, Field, Modal, ErrorNote, PageHead, Panel, Tabs, Empty, won, fmt, SortableTh, sortTableRows, } from "./ui.js";
import { AccountingImportButton, AccountingPage as WorkbookAccounting, } from "./workspace.js";
import { CASH_GROUPS, cashSummary, cashBalance, runningBalances, priorYearDate, growth, localDate, sumMoney, } from "../shared/missions.mjs";
const kindNames = { income: "입금", expense: "출금", transfer: "이체" };
function Editor({ title, children, onSave }) {
    const { close } = useApp();
    const [error, setError] = useState(""), [busy, setBusy] = useState(false);
    return (React.createElement(Modal, { title: title, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await onSave();
                    close();
                }
                catch (e) {
                    setError(e.message);
                }
                finally {
                    setBusy(false);
                }
            } },
            React.createElement("div", { className: "modal-body mission-form" },
                children,
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uC800\uC7A5")))));
}
export function CashEntryForm({ item, before, date = localDate(), kind = "expense", dealId = "", purchaseId = "", }) {
    const { state, act } = useApp();
    const [v, setV] = useState(item || {
        date: before?.date || date,
        kind,
        accountId: state.cashAccounts.find((a) => a.active)?.id || "",
        toAccountId: "",
        amount: "",
        categoryId: "",
        description: "",
        fileIds: [],
        dealId,
        purchaseId,
    });
    const set = (key, value) => setV({ ...v, [key]: value });
    const cats = state.cashCategories
        .filter((c) => (c.active || c.id === v.categoryId) &&
        (c.group === "income") === (v.kind === "income"))
        .sort((a, b) => a.order - b.order);
    return (React.createElement(Editor, { title: item ? "입출금 수정" : before ? "선택 내역 앞에 삽입" : "입출금 기록", onSave: () => act({
            action: "mission-save",
            type: "cashEntries",
            targetId: item?.id,
            version: item?.version,
            data: { ...v, beforeId: before?.id },
        }) },
        React.createElement("div", { className: "form-grid" },
            React.createElement(Field, { label: "\uC2E4\uC81C \uAC70\uB798\uC77C" },
                React.createElement("input", { required: true, type: "date", value: v.date, onChange: (e) => set("date", e.target.value) })),
            React.createElement(Field, { label: "\uAD6C\uBD84" },
                React.createElement("select", { value: v.kind, onChange: (e) => setV({ ...v, kind: e.target.value, categoryId: "" }) }, Object.entries(kindNames).map(([k, n]) => (React.createElement("option", { key: k, value: k }, n)))))),
        React.createElement(Field, { label: v.kind === "transfer" ? "보내는 계좌" : "계좌" },
            React.createElement("select", { required: true, value: v.accountId, onChange: (e) => set("accountId", e.target.value) },
                React.createElement("option", { value: "" }, "\uACC4\uC88C \uC120\uD0DD"),
                state.cashAccounts
                    .filter((a) => a.active || a.id === v.accountId)
                    .map((a) => (React.createElement("option", { key: a.id, value: a.id }, a.name))))),
        v.kind === "transfer" ? (React.createElement(Field, { label: "\uBC1B\uB294 \uACC4\uC88C" },
            React.createElement("select", { required: true, value: v.toAccountId, onChange: (e) => set("toAccountId", e.target.value) },
                React.createElement("option", { value: "" }, "\uACC4\uC88C \uC120\uD0DD"),
                state.cashAccounts
                    .filter((a) => a.id !== v.accountId && (a.active || a.id === v.toAccountId))
                    .map((a) => (React.createElement("option", { key: a.id, value: a.id }, a.name)))))) : (React.createElement(Field, { label: "\uC6D4\uBCC4 \uBD84\uB958 \uD56D\uBAA9" },
            React.createElement("select", { required: true, value: v.categoryId, onChange: (e) => set("categoryId", e.target.value) },
                React.createElement("option", { value: "" }, "\uBD84\uB958 \uC120\uD0DD"),
                cats.map((c) => (React.createElement("option", { key: c.id, value: c.id },
                    CASH_GROUPS[c.group],
                    " \u00B7 ",
                    c.name)))))),
        React.createElement(Field, { label: "\uAE08\uC561 (\uC6D0)" },
            React.createElement("input", { required: true, type: "number", min: "1", step: "1", max: "100000000000000", value: v.amount, onChange: (e) => set("amount", e.target.value) })),
        React.createElement(Field, { label: "\uC801\uC694" },
            React.createElement("input", { required: true, maxLength: 2000, value: v.description, onChange: (e) => set("description", e.target.value) })),
        React.createElement(Field, { label: "\uC5F0\uACB0 \uD310\uB9E4 \uAC70\uB798 (\uC120\uD0DD)" },
            React.createElement("select", { value: v.dealId || "", onChange: (e) => set("dealId", e.target.value) },
                React.createElement("option", { value: "" }, "\uC5F0\uACB0 \uC5C6\uC74C"),
                state.deals
                    .filter((d) => d.status === "확정" || d.id === v.dealId)
                    .map((d) => (React.createElement("option", { key: d.id, value: d.id }, d.name))))),
        React.createElement(Field, { label: "\uC5F0\uACB0 \uB9E4\uC785 \uAC70\uB798 (\uC120\uD0DD)" },
            React.createElement("select", { value: v.purchaseId || "", onChange: (e) => set("purchaseId", e.target.value) },
                React.createElement("option", { value: "" }, "\uC5F0\uACB0 \uC5C6\uC74C"),
                state.purchases
                    .filter((d) => d.status === "확정" || d.id === v.purchaseId)
                    .map((d) => (React.createElement("option", { key: d.id, value: d.id }, d.name))))),
        React.createElement(Field, { label: "\uC790\uB8CC\uC2E4 \uC99D\uBE59 \uC5F0\uACB0 (Ctrl\uB85C \uC5EC\uB7EC \uAC1C \uC120\uD0DD)" },
            React.createElement("select", { multiple: true, value: v.fileIds, onChange: (e) => set("fileIds", [...e.target.selectedOptions].map((o) => o.value)) }, state.files
                .filter((f) => !f.locked && f.status === "ready")
                .map((f) => (React.createElement("option", { key: f.id, value: f.id }, f.name))))),
        React.createElement("p", { className: "hint" }, "\uD55C \uBC88 \uC800\uC7A5\uD558\uBA74 \uC77C\uC77C \uACBD\uBE44\u00B7\uC785\uCD9C\uAE08 \uC7A5\uBD80\u00B7\uC6D4\uBCC4\uD45C\uC5D0 \uD568\uAED8 \uBC18\uC601\uB429\uB2C8\uB2E4. \uC774\uCCB4\uB294 \uC218\uC785\u00B7\uC9C0\uCD9C\uC5D0\uC11C \uC81C\uC678\uB429\uB2C8\uB2E4.")));
}
function AccountForm({ item }) {
    const { act } = useApp();
    const [v, set] = useState(item || {
        name: "",
        kind: "bank",
        openingDate: `${localDate().slice(0, 4)}-01-01`,
        openingBalance: 0,
        active: true,
    });
    return (React.createElement(Editor, { title: "\uC790\uAE08 \uACC4\uC88C", onSave: () => act({
            action: "mission-save",
            type: "cashAccounts",
            targetId: item?.id,
            version: item?.version,
            data: v,
        }) },
        React.createElement(Field, { label: "\uACC4\uC88C \uC774\uB984" },
            React.createElement("input", { required: true, value: v.name, onChange: (e) => set({ ...v, name: e.target.value }) })),
        React.createElement(Field, { label: "\uC885\uB958" },
            React.createElement("select", { value: v.kind, onChange: (e) => set({ ...v, kind: e.target.value }) },
                React.createElement("option", { value: "bank" }, "\uC740\uD589"),
                React.createElement("option", { value: "cash" }, "\uD604\uAE08"))),
        React.createElement(Field, { label: "\uC2DC\uC791\uC77C" },
            React.createElement("input", { required: true, type: "date", value: v.openingDate, onChange: (e) => set({ ...v, openingDate: e.target.value }) })),
        React.createElement(Field, { label: "\uC2DC\uC791 \uC794\uC561 (\uC6D0)" },
            React.createElement("input", { required: true, type: "number", step: "1", value: v.openingBalance, onChange: (e) => set({ ...v, openingBalance: e.target.value }) })),
        React.createElement("label", null,
            React.createElement("input", { type: "checkbox", checked: v.active, onChange: (e) => set({ ...v, active: e.target.checked }) }),
            " ",
            "\uC0AC\uC6A9"),
        React.createElement("p", { className: "hint" }, "\uC2DC\uC791 \uC794\uC561\uC740 \uC218\uC785\uC5D0 \uD3EC\uD568\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC2DC\uC791 \uC794\uC561 \uC218\uC815 \uC2DC \uC774\uD6C4 \uC794\uC561\uB3C4 \uB2E4\uC2DC \uACC4\uC0B0\uB429\uB2C8\uB2E4.")));
}
function CategoryForm({ item, before }) {
    const { act } = useApp();
    const [v, set] = useState(item || { name: "", group: before?.group || "expense", active: true });
    return (React.createElement(Editor, { title: before ? "선택 항목 앞에 삽입" : "수입·지출 분류", onSave: () => act({
            action: "mission-save",
            type: "cashCategories",
            targetId: item?.id,
            version: item?.version,
            data: { ...v, beforeId: before?.id },
        }) },
        React.createElement(Field, { label: "\uD56D\uBAA9\uBA85" },
            React.createElement("input", { required: true, value: v.name, onChange: (e) => set({ ...v, name: e.target.value }) })),
        React.createElement(Field, { label: "\uAD6C\uBD84" },
            React.createElement("select", { value: v.group, onChange: (e) => set({ ...v, group: e.target.value }) }, Object.entries(CASH_GROUPS).map(([k, n]) => (React.createElement("option", { key: k, value: k }, n))))),
        React.createElement("label", null,
            React.createElement("input", { type: "checkbox", checked: v.active, onChange: (e) => set({ ...v, active: e.target.checked }) }),
            " ",
            "\uC2E0\uADDC \uC785\uB825\uC5D0 \uC0AC\uC6A9"),
        React.createElement("p", { className: "hint" }, "\uC0AC\uC6A9\uC744 \uC911\uC9C0\uD574\uB3C4 \uACFC\uAC70 \uAE30\uB85D\uACFC \uD569\uACC4\uB294 \uBCF4\uC874\uD569\uB2C8\uB2E4.")));
}
export function Accounting() {
    const { state, open, allowed, act, notify } = useApp();
    const [tab, setTab] = useState("monthly"), [month, setMonth] = useState(localDate().slice(0, 7)), [day, setDay] = useState(localDate()), [account, setAccount] = useState(""), [categoryFilter, setCategoryFilter] = useState(""), [showCancelled, setShowCancelled] = useState(false), [accountSort, setAccountSort] = useState({ key: "name", direction: "asc" }), [entrySort, setEntrySort] = useState({ key: "date", direction: "desc" });
    const [showZero, setShowZero] = useState(false);
    const year = month.slice(0, 4), end = month === localDate().slice(0, 7)
        ? localDate()
        : `${month}-${new Date(Number(year), Number(month.slice(5)), 0).getDate()}`;
    const current = cashSummary(state.cashEntries, month + "-01", end), annual = cashSummary(state.cashEntries, year + "-01-01", end), previous = cashSummary(state.cashEntries, priorYearDate(month + "-01"), priorYearDate(end)), previousAnnual = cashSummary(state.cashEntries, priorYearDate(year + "-01-01"), priorYearDate(end));
    const editable = allowed("accounting", "edit"), accounts = state.cashAccounts, categories = state.cashCategories;
    const balances = runningBalances(accounts, state.cashEntries);
    const monthlyValues = useMemo(() => {
        const rows = new Map();
        for (const e of state.cashEntries) {
            if (e.cancelled ||
                e.kind === "transfer" ||
                !e.date.startsWith(year + "-"))
                continue;
            if (!rows.has(e.categoryId))
                rows.set(e.categoryId, Array.from({ length: 12 }, () => []));
            rows.get(e.categoryId)[Number(e.date.slice(5, 7)) - 1].push(e.amount);
        }
        return new Map([...rows].map(([id, months]) => [id, months.map(sumMoney)]));
    }, [state.cashEntries, year]);
    let entries = (showCancelled
        ? state.cashEntries.map((e) => balances.find((b) => b.id === e.id) || e)
        : balances).filter((e) => (tab === "daily"
        ? e.date === day && e.kind === "expense"
        : e.date.startsWith(month)) &&
        (!account || e.accountId === account || e.toAccountId === account) &&
        (!categoryFilter || e.categoryId === categoryFilter));
    const sortedAccounts = sortTableRows(accounts, (item) => ({
        name: item.name || "",
        openingDate: item.openingDate || "",
        openingBalance: Number(item.openingBalance || 0),
        balance: cashBalance(item, state.cashEntries, end),
        status: item.active ? 1 : 0,
    })[accountSort.key], accountSort.direction);
    const sortedEntries = sortTableRows(entries, (item) => ({
        date: item.date || "",
        account: accounts.find((value) => value.id === item.accountId)?.name || "",
        kind: item.cancelled ? "취소" : kindNames[item.kind] || "",
        description: `${item.description || ""} ${categories.find((value) => value.id === item.categoryId)?.name || ""}`,
        amount: Number(item.amount || 0),
        balance: account && item.toAccountId === account
            ? item.toBalance
            : item.balance,
        files: item.fileIds?.length || 0,
    })[entrySort.key], entrySort.direction);
    const openDetail = (c, m) => {
        setMonth(`${year}-${String(m).padStart(2, "0")}`);
        setCategoryFilter(c);
        setTab("ledger");
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uD68C\uACC4 \uAD00\uB9AC \u00B7 \uD55C\uAD6D", description: "\uC2E4\uC81C \uC785\uCD9C\uAE08\uC744 \uD55C \uBC88 \uAE30\uB85D\uD558\uACE0 \uC6D4\u00B7\uC5F0 \uD569\uACC4\uC640 \uACC4\uC88C \uC794\uC561\uC744 \uD655\uC778\uD569\uB2C8\uB2E4." },
            React.createElement("a", { className: "btn", href: "?page=accounting", target: "_blank", rel: "noreferrer" }, "\uBCC4\uB3C4 \uCC3D"),
            React.createElement("input", { "aria-label": "\uD68C\uACC4 \uC870\uD68C \uC6D4", type: "month", value: month, onChange: (e) => {
                    if (e.target.value) {
                        setMonth(e.target.value);
                        if (!day.startsWith(e.target.value))
                            setDay(e.target.value + "-01");
                    }
                } }),
            React.createElement("span", { className: "badge violet" }, "\uB300\uD45C \uC804\uC6A9")),
        !accounts.some((a) => a.active) && editable && (React.createElement(Panel, { title: "\uC785\uCD9C\uAE08 \uAE30\uB85D\uC744 \uC2DC\uC791\uD558\uC138\uC694" },
            React.createElement("p", null, "\uD604\uAE08 \uB610\uB294 \uC740\uD589 \uACC4\uC88C\uB97C \uB9CC\uB4E4\uACE0 \uAE30\uC900\uC77C\uACFC \uC2DC\uC791 \uC794\uC561\uC744 \uC785\uB825\uD558\uC138\uC694. \uACFC\uAC70 \uB0B4\uC5ED\uC774 \uC788\uB2E4\uBA74 \uAC00\uC7A5 \uC774\uB978 \uAC70\uB798\uC77C\uC744 \uAE30\uC900\uC77C\uB85C \uC124\uC815\uD558\uC138\uC694."),
            React.createElement(Button, { primary: true, onClick: () => open(React.createElement(AccountForm, null)) }, "\uCCAB \uACC4\uC88C \uB4F1\uB85D"))),
        React.createElement("div", { className: "mission-kpis" }, [
            ["월 수입", current.income],
            ["월 지출", current.expense],
            ["월 차액", current.net],
            ["연 누적 수입", annual.income],
            ["연 누적 지출", annual.expense],
            ["연 누적 차액", annual.net],
        ].map(([n, v]) => (React.createElement("div", { key: n },
            React.createElement("small", null, n),
            React.createElement("strong", null, won(v)))))),
        React.createElement("p", { className: "hint" },
            end,
            "\uAE4C\uC9C0 \uC785\uB825\uBD84 \u00B7 \uC804\uB144 \uB3D9\uC6D4 \uC218\uC785 \uC99D\uAC10\uB960",
            " ",
            growth(current, previous) === null
                ? "비교 불가"
                : fmt(growth(current, previous), "USD") + "%",
            " ",
            "\u00B7 \uC804\uB144 \uB3D9\uAE30 \uB204\uC801",
            " ",
            growth(annual, previousAnnual) === null
                ? "비교 불가"
                : fmt(growth(annual, previousAnnual), "USD") + "%",
            " ",
            "\u00B7 \uB300\uCD9C\u00B7\uD658\uAE09\uC744 \uD3EC\uD568\uD55C \uCD1D\uC218\uC785 \uAE30\uC900"),
        React.createElement(Tabs, { value: tab, onChange: setTab, items: [
                ["monthly", "월별 수입·지출"],
                ["daily", "일일 경비"],
                ["ledger", "입출금·잔액"],
                ["auto", "자동 판매 내역"],
                ["sheets", "자유 장부"],
                ["accounts", "자금 계좌"],
            ] }),
        tab === "auto" ? (React.createElement(WorkbookAccounting, { embedded: true, section: "auto", year: year })) : tab === "sheets" ? (React.createElement(WorkbookAccounting, { embedded: true, section: "sheets", year: year })) : tab === "accounts" ? (React.createElement(Panel, null,
            React.createElement("div", { className: "mission-toolbar" }, editable && (React.createElement(Button, { primary: true, onClick: () => open(React.createElement(AccountForm, null)) }, "\uACC4\uC88C \uB4F1\uB85D"))),
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement(SortableTh, { column: "name", sort: accountSort, onSort: setAccountSort }, "\uACC4\uC88C"),
                            React.createElement(SortableTh, { column: "openingDate", sort: accountSort, onSort: setAccountSort, defaultDirection: "desc" }, "\uC2DC\uC791\uC77C"),
                            React.createElement(SortableTh, { column: "openingBalance", sort: accountSort, onSort: setAccountSort, defaultDirection: "desc" }, "\uC2DC\uC791 \uC794\uC561"),
                            React.createElement(SortableTh, { column: "balance", sort: accountSort, onSort: setAccountSort, defaultDirection: "desc" },
                                end,
                                " \uC794\uC561"),
                            React.createElement(SortableTh, { column: "status", sort: accountSort, onSort: setAccountSort, defaultDirection: "desc" }, "\uC0C1\uD0DC"),
                            React.createElement("th", null))),
                    React.createElement("tbody", null, sortedAccounts.map((a) => (React.createElement("tr", { key: a.id },
                        React.createElement("td", null, a.name),
                        React.createElement("td", null, a.openingDate),
                        React.createElement("td", null, won(a.openingBalance)),
                        React.createElement("td", null, cashBalance(a, state.cashEntries, end) === null
                            ? "시작 전"
                            : won(cashBalance(a, state.cashEntries, end))),
                        React.createElement("td", null, a.active ? "사용" : "중지"),
                        React.createElement("td", null, editable && (React.createElement(Button, { small: true, onClick: () => open(React.createElement(AccountForm, { item: a })) }, "\uC218\uC815"))))))))),
            !accounts.length && (React.createElement(Empty, { title: "\uACC4\uC88C \uC774\uB984\uACFC \uC2DC\uC791 \uC794\uC561\uC744 \uBA3C\uC800 \uB4F1\uB85D\uD558\uC138\uC694" })))) : (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "mission-toolbar" },
                editable && (React.createElement(React.Fragment, null,
                    React.createElement(Button, { primary: true, disabled: !accounts.some((a) => a.active), onClick: () => open(React.createElement(CashEntryForm, { date: tab === "daily"
                                ? day
                                : month === localDate().slice(0, 7)
                                    ? localDate()
                                    : month + "-01" })) }, "\uC785\uCD9C\uAE08 \uAE30\uB85D"),
                    tab === "monthly" && (React.createElement(Button, { onClick: () => open(React.createElement(CategoryForm, null)) }, "\uBD84\uB958 \uD56D\uBAA9 \uCD94\uAC00")))),
                React.createElement("a", { className: "btn", href: `/api/cash/export?year=${year}` }, "\uC5F0\uAC04 \uC5D1\uC140 \uB2E4\uC6B4\uB85C\uB4DC"),
                React.createElement(AccountingImportButton, { year: year }),
                !accounts.length && (React.createElement(Button, { onClick: () => setTab("accounts") }, "\uACC4\uC88C \uC124\uC815"))),
            tab === "monthly" ? (React.createElement(Panel, null,
                React.createElement("label", { className: "zero-row-toggle" },
                    React.createElement("input", { type: "checkbox", checked: showZero, onChange: (e) => setShowZero(e.target.checked) }),
                    "\uAE08\uC561\uC774 \uC5C6\uB294 \uD56D\uBAA9\uB3C4 \uD45C\uC2DC"),
                React.createElement("div", { className: "table-scroll" },
                    React.createElement("table", { className: "cash-monthly" },
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", null, "\uD56D\uBAA9"),
                                Array.from({ length: 12 }, (_, i) => (React.createElement("th", { key: i },
                                    i + 1,
                                    "\uC6D4"))),
                                React.createElement("th", null, "\uC5F0\uAC04 \uD569\uACC4"),
                                React.createElement("th", null))),
                        React.createElement("tbody", null, Object.entries(CASH_GROUPS).map(([group, label]) => {
                            const cats = categories
                                .filter((c) => c.group === group &&
                                (c.active ||
                                    state.cashEntries.some((e) => e.categoryId === c.id)))
                                .sort((a, b) => a.order - b.order);
                            const values = (c) => monthlyValues.get(c.id) || Array(12).fill(0);
                            const sums = Array.from({ length: 12 }, (_, i) => sumMoney(cats.map((c) => values(c)[i])));
                            return (React.createElement(React.Fragment, { key: group },
                                React.createElement("tr", { className: "cash-group" },
                                    React.createElement("th", null,
                                        label,
                                        " \uD569\uACC4"),
                                    sums.map((v, i) => (React.createElement("td", { key: i }, fmt(v)))),
                                    React.createElement("td", null, fmt(sumMoney(sums))),
                                    React.createElement("td", null)),
                                cats
                                    .filter((c) => showZero || values(c).some((v) => v !== 0))
                                    .map((c) => {
                                    const vs = values(c);
                                    return (React.createElement("tr", { key: c.id },
                                        React.createElement("th", null,
                                            c.name,
                                            !c.active && " (중지)"),
                                        vs.map((v, i) => (React.createElement("td", { key: i },
                                            React.createElement("button", { className: "cash-value", onClick: () => openDetail(c.id, i + 1) }, fmt(v))))),
                                        React.createElement("td", null, fmt(sumMoney(vs))),
                                        React.createElement("td", null, editable && (React.createElement("div", { className: "actions" },
                                            React.createElement(Button, { small: true, onClick: () => open(React.createElement(CategoryForm, { item: c })) }, "\uC218\uC815"),
                                            React.createElement(Button, { small: true, onClick: () => open(React.createElement(CategoryForm, { before: c })) }, "\uC55E\uC5D0 \uC0BD\uC785"))))));
                                })));
                        })))))) : (React.createElement(Panel, null,
                React.createElement("div", { className: "mission-toolbar" },
                    tab === "daily" && (React.createElement("input", { "aria-label": "\uACBD\uBE44 \uB0A0\uC9DC", type: "date", value: day, onChange: (e) => {
                            if (e.target.value) {
                                setDay(e.target.value);
                                setMonth(e.target.value.slice(0, 7));
                            }
                        } })),
                    React.createElement("select", { "aria-label": "\uACC4\uC88C \uD544\uD130", value: account, onChange: (e) => setAccount(e.target.value) },
                        React.createElement("option", { value: "" }, "\uC804\uCCB4 \uACC4\uC88C"),
                        accounts.map((a) => (React.createElement("option", { key: a.id, value: a.id }, a.name)))),
                    React.createElement("select", { "aria-label": "\uBD84\uB958 \uD544\uD130", value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value) },
                        React.createElement("option", { value: "" }, "\uC804\uCCB4 \uD56D\uBAA9"),
                        categories.map((c) => (React.createElement("option", { key: c.id, value: c.id }, c.name)))),
                    React.createElement("label", null,
                        React.createElement("input", { type: "checkbox", checked: showCancelled, onChange: (e) => setShowCancelled(e.target.checked) }),
                        " ",
                        "\uCDE8\uC18C \uD3EC\uD568")),
                React.createElement("div", { className: "table-scroll" },
                    React.createElement("table", null,
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement(SortableTh, { column: "date", sort: entrySort, onSort: setEntrySort, defaultDirection: "desc" }, "\uB0A0\uC9DC"),
                                React.createElement(SortableTh, { column: "account", sort: entrySort, onSort: setEntrySort }, "\uACC4\uC88C"),
                                React.createElement(SortableTh, { column: "kind", sort: entrySort, onSort: setEntrySort }, "\uAD6C\uBD84"),
                                React.createElement(SortableTh, { column: "description", sort: entrySort, onSort: setEntrySort }, "\uC801\uC694 / \uD56D\uBAA9"),
                                React.createElement(SortableTh, { column: "amount", sort: entrySort, onSort: setEntrySort, defaultDirection: "desc" }, "\uAE08\uC561"),
                                React.createElement(SortableTh, { column: "balance", sort: entrySort, onSort: setEntrySort, defaultDirection: "desc" }, "\uAC70\uB798 \uD6C4 \uC794\uC561"),
                                React.createElement(SortableTh, { column: "files", sort: entrySort, onSort: setEntrySort, defaultDirection: "desc" }, "\uC99D\uBE59"),
                                React.createElement("th", null))),
                        React.createElement("tbody", null, sortedEntries.map((e) => (React.createElement("tr", { key: e.id, className: e.cancelled ? "muted" : "" },
                            React.createElement("td", null, e.date),
                            React.createElement("td", null,
                                accounts.find((a) => a.id === e.accountId)?.name,
                                e.kind === "transfer" &&
                                    ` → ${accounts.find((a) => a.id === e.toAccountId)?.name}`),
                            React.createElement("td", null, e.cancelled ? "취소" : kindNames[e.kind]),
                            React.createElement("td", null,
                                e.description,
                                React.createElement("small", null,
                                    categories.find((c) => c.id === e.categoryId)
                                        ?.name,
                                    e.cancelled && e.cancelReason)),
                            React.createElement("td", null, won(e.amount)),
                            React.createElement("td", null, e.balance === undefined
                                ? "—"
                                : won(account && e.toAccountId === account
                                    ? e.toBalance
                                    : e.balance)),
                            React.createElement("td", null, e.fileIds.map((id) => (React.createElement("a", { key: id, href: `/api/files/${id}`, className: "btn sm" }, state.files.find((f) => f.id === id)?.name ||
                                "증빙")))),
                            React.createElement("td", null, editable && !e.cancelled && (React.createElement("div", { className: "actions" },
                                React.createElement(Button, { small: true, onClick: () => open(React.createElement(CashEntryForm, { item: e })) }, "\uC218\uC815"),
                                React.createElement(Button, { small: true, onClick: () => open(React.createElement(CashEntryForm, { before: e })) }, "\uC55E\uC5D0 \uC0BD\uC785"),
                                React.createElement(Button, { small: true, danger: true, onClick: async () => {
                                        const reason = prompt("취소 사유를 입력하세요. 내역과 이력은 보존됩니다.");
                                        if (!reason)
                                            return;
                                        try {
                                            await act({
                                                action: "mission-cancel",
                                                type: "cashEntries",
                                                targetId: e.id,
                                                version: e.version,
                                                data: { reason },
                                            });
                                        }
                                        catch (err) {
                                            notify(err.message, "warning");
                                        }
                                    } }, "\uCDE8\uC18C")))))))))),
                !entries.length && React.createElement(Empty, { title: "\uD574\uB2F9 \uAE30\uAC04\uC758 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" })))))));
}
