import React, { useState } from "react";
import { useApp, AppContext, PageHead, Button, Panel, Modal, Field, SearchField, Select, SortableTh, sortTableRows, ErrorNote, Empty, won, } from "./ui.js";
import { DrivePage } from "./drive.js";
import { DealDetail } from "./business.js";
import { TAX_CATEGORY, pendingSales, sumMoney } from "../shared/missions.mjs";
export function TaxPage() {
    const app = useApp();
    const context = {
        ...app,
        category: {
            id: TAX_CATEGORY,
            name: "전사 공통 세금계산서",
            type: "business",
        },
    };
    context.open = (content) => app.open(React.createElement(AppContext.Provider, { value: context }, content));
    return (React.createElement(AppContext.Provider, { value: context },
        React.createElement(DrivePage, null)));
}
export function PurchaseForm({ item }) {
    const { state, category, act, close, allowed } = useApp();
    const [v, setV] = useState(item || {
        name: "",
        categoryId: category.type === "business"
            ? category.id
            : state.categories.find((c) => c.type === "business")?.id,
        customerId: "",
        equipmentIds: [],
        amount: "",
        status: "진행중",
        notes: "",
    }), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    const set = (k, value) => setV({ ...v, [k]: value });
    return (React.createElement(Modal, { title: item ? "매입 거래 수정" : "매입 협의 등록", onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await act({
                        action: "mission-save",
                        type: "purchases",
                        targetId: item?.id,
                        version: item?.version,
                        data: v,
                    });
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
                React.createElement(Field, { label: "\uAC70\uB798\uBA85" },
                    React.createElement("input", { required: true, value: v.name, onChange: (e) => set("name", e.target.value) })),
                React.createElement(Field, { label: "\uB9E4\uC785\uCC98" },
                    React.createElement("select", { value: v.customerId, onChange: (e) => set("customerId", e.target.value) },
                        React.createElement("option", { value: "" }, "\uC120\uD0DD\uD558\uC9C0 \uC54A\uC74C"),
                        state.customers
                            .filter((c) => !c.locked)
                            .map((c) => (React.createElement("option", { key: c.id, value: c.id }, c.name))))),
                React.createElement(Field, { label: "\uC124\uBE44 \uC120\uD0DD" },
                    React.createElement("div", { className: "mission-checklist" }, state.equipment
                        .filter((e) => !e.locked && e.categoryId === v.categoryId)
                        .map((e) => (React.createElement("label", { key: e.id },
                        React.createElement("input", { type: "checkbox", checked: v.equipmentIds.includes(e.id), onChange: (ev) => set("equipmentIds", ev.target.checked
                                ? [...v.equipmentIds, e.id]
                                : v.equipmentIds.filter((id) => id !== e.id)) }),
                        e.model,
                        " \u00B7 ",
                        e.number))))),
                React.createElement(Field, { label: "\uB9E4\uC785 \uD569\uACC4 (\uC6D0 \u00B7 \uBD80\uAC00\uC138 \uC81C\uC678, \uBBF8\uC815\uC774\uBA74 \uBE44\uC6CC\uB450\uC138\uC694)" },
                    React.createElement("input", { type: "number", min: "0", step: "1", value: v.amount ?? "", onChange: (e) => set("amount", e.target.value) })),
                React.createElement(Field, { label: "\uC0C1\uD0DC" },
                    React.createElement("select", { value: v.status, onChange: (e) => set("status", e.target.value) },
                        React.createElement("option", null, "\uC9C4\uD589\uC911"),
                        (allowed("deals", "confirm") || v.status === "확정") && (React.createElement("option", null, "\uD655\uC815")),
                        React.createElement("option", null, "\uBB34\uC0B0"))),
                React.createElement(Field, { label: "\uBA54\uBAA8" },
                    React.createElement("textarea", { value: v.notes, onChange: (e) => set("notes", e.target.value) })),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uC800\uC7A5")))));
}
export function PurchasesPage() {
    const { state, category, open, allowed } = useApp();
    const [status, setStatus] = useState("진행중"), [q, setQ] = useState(""), [customerId, setCustomerId] = useState("all"), [sort, setSort] = useState({ key: "name", direction: "asc" });
    const categoryPurchases = state.purchases.filter((purchase) => purchase.categoryId === category.id);
    const purchaseMatches = categoryPurchases.filter((purchase) => {
        const customer = state.customers.find((item) => item.id === purchase.customerId);
        const equipment = purchase.equipmentIds
            .map((id) => state.equipment.find((item) => item.id === id))
            .filter(Boolean)
            .map((item) => `${item.model} ${item.number}`)
            .join(" ");
        return (`${purchase.name} ${customer?.name || ""} ${equipment}`
            .toLowerCase()
            .includes(q.toLowerCase()) &&
            (!status || purchase.status === status) &&
            (customerId === "all" || purchase.customerId === customerId));
    });
    const rows = sortTableRows(purchaseMatches, (purchase) => ({
        name: purchase.name || "",
        equipment: purchase.equipmentIds
            .map((id) => state.equipment.find((item) => item.id === id)?.number || "")
            .join(" "),
        customer: state.customers.find((item) => item.id === purchase.customerId)
            ?.name || "",
        status: purchase.status || "",
        amount: purchase.amount,
        updated: purchase.updatedAt || purchase.createdAt || "",
    })[sort.key], sort.direction);
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uB9E4\uC785 \uAC70\uB798", description: "\uC5EC\uB7EC \uC124\uBE44\uB97C \uBB36\uC740 \uB9E4\uC785 \uD611\uC758\uB3C4 \uAC70\uB798 1\uAC74\uC73C\uB85C \uC9D1\uACC4\uD569\uB2C8\uB2E4." }, allowed("deals", "create") && (React.createElement(Button, { primary: true, onClick: () => open(React.createElement(PurchaseForm, null)) }, "\uB9E4\uC785 \uD611\uC758 \uB4F1\uB85D"))),
        React.createElement("div", { className: "filters" },
            React.createElement(SearchField, { value: q, onChange: setQ, placeholder: "\uAC70\uB798\uBA85, \uB9E4\uC785\uCC98, \uC124\uBE44 \uAC80\uC0C9" }),
            React.createElement(Select, { "aria-label": "\uB9E4\uC785 \uC0C1\uD0DC", value: status, onChange: (e) => setStatus(e.target.value) },
                React.createElement("option", { value: "" }, "\uC804\uCCB4"),
                React.createElement("option", null, "\uC9C4\uD589\uC911"),
                React.createElement("option", null, "\uD655\uC815"),
                React.createElement("option", null, "\uBB34\uC0B0")),
            React.createElement(Select, { "aria-label": "\uB9E4\uC785\uCC98", value: customerId, onChange: (e) => setCustomerId(e.target.value) },
                React.createElement("option", { value: "all" }, "\uC804\uCCB4 \uB9E4\uC785\uCC98"),
                [...new Set(categoryPurchases.map((item) => item.customerId))]
                    .filter(Boolean)
                    .map((id) => (React.createElement("option", { key: id, value: id }, state.customers.find((item) => item.id === id)?.name || id))))),
        React.createElement(Panel, null,
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement(SortableTh, { column: "name", sort: sort, onSort: setSort }, "\uAC70\uB798\uBA85"),
                            React.createElement(SortableTh, { column: "equipment", sort: sort, onSort: setSort }, "\uC124\uBE44"),
                            React.createElement(SortableTh, { column: "customer", sort: sort, onSort: setSort }, "\uB9E4\uC785\uCC98"),
                            React.createElement(SortableTh, { column: "status", sort: sort, onSort: setSort }, "\uC0C1\uD0DC"),
                            React.createElement(SortableTh, { column: "amount", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uB9E4\uC785 \uD569\uACC4 (\uACF5\uAE09\uAC00\uC561)"),
                            React.createElement("th", null))),
                    React.createElement("tbody", null, rows.map((p) => (React.createElement("tr", { key: p.id },
                        React.createElement("td", null, p.name),
                        React.createElement("td", null, p.equipmentIds
                            .map((id) => state.equipment.find((e) => e.id === id)?.number)
                            .join(", ")),
                        React.createElement("td", null, state.customers.find((c) => c.id === p.customerId)?.name ||
                            "—"),
                        React.createElement("td", null, p.status),
                        React.createElement("td", null, p.amount === null ? "금액 미정" : won(p.amount)),
                        React.createElement("td", null, allowed("deals", "edit") &&
                            (p.status !== "확정" || allowed("deals", "correct")) && (React.createElement(Button, { small: true, onClick: () => open(React.createElement(PurchaseForm, { item: p })) }, "\uC218\uC815"))))))))),
            !rows.length && React.createElement(Empty, { title: "\uD574\uB2F9 \uC0C1\uD0DC\uC758 \uB9E4\uC785 \uAC70\uB798\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4" }))));
}
function PendingSaleList() {
    const { state, category, close, open } = useApp();
    const rows = pendingSales(state.deals.filter((d) => d.categoryId === category.id));
    return (React.createElement(Modal, { title: "\uD310\uB9E4\uC9C4\uD589\uC911 \uAC70\uB798", onClose: close, wide: true },
        React.createElement("div", { className: "modal-body" },
            React.createElement("p", { className: "hint" }, "\uC911\uBCF5 \uC81C\uC548 \uD3EC\uD568 \u00B7 \uD310\uB9E4 \uAC00\uB2A5\uD55C \uC124\uBE44\uC758 \uC81C\uC548 \uACF5\uAE09\uAC00\uC561\uC744 \uC6D0\uD654\uB85C \uD658\uC0B0\uD569\uB2C8\uB2E4."),
            React.createElement("table", null,
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "\uC601\uC5C5\uBA85"),
                        React.createElement("th", null, "\uC124\uBE44"),
                        React.createElement("th", null, "\uC81C\uC548\uC561"),
                        React.createElement("th", null))),
                React.createElement("tbody", null, rows.map((d) => (React.createElement("tr", { key: d.id },
                    React.createElement("td", null, d.name),
                    React.createElement("td", null,
                        d.availableLines.length,
                        "\uB300"),
                    React.createElement("td", null, won(d.pendingAmount)),
                    React.createElement("td", null,
                        React.createElement(Button, { small: true, onClick: () => open(React.createElement(DealDetail, { id: d.id })) }, "\uC0C1\uC138"))))))),
            !rows.length && React.createElement(Empty, { title: "\uC9C4\uD589\uC911 \uD310\uB9E4 \uAC70\uB798\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4" }))));
}
export function PendingCards() {
    const { state, category, navigate, open } = useApp();
    const buys = state.purchases.filter((p) => p.categoryId === category.id && p.status === "진행중"), sales = pendingSales(state.deals.filter((d) => d.categoryId === category.id));
    return (React.createElement("div", { className: "mission-pending" },
        React.createElement("button", { onClick: () => navigate("purchases") },
            React.createElement("span", null, "\uB9E4\uC785\uC9C4\uD589\uC911"),
            React.createElement("strong", null,
                buys.length,
                "\uAC74 \u00B7 ",
                won(sumMoney(buys.map((p) => p.amount)))),
            React.createElement("small", null,
                "\uD604\uC7AC \uD611\uC758\uC911 \u00B7 \uACF5\uAE09\uAC00\uC561",
                buys.some((p) => p.amount === null) &&
                    ` · 금액 미정 ${buys.filter((p) => p.amount === null).length}건`)),
        React.createElement("button", { onClick: () => open(React.createElement(PendingSaleList, null)) },
            React.createElement("span", null, "\uD310\uB9E4\uC9C4\uD589\uC911"),
            React.createElement("strong", null,
                sales.length,
                "\uAC74 \u00B7 ",
                won(sumMoney(sales.map((d) => d.pendingAmount)))),
            React.createElement("small", null, "\uD604\uC7AC \uC81C\uC548\uC911 \u00B7 \uACF5\uAE09\uAC00\uC561 \u00B7 \uC911\uBCF5 \uC81C\uC548 \uD3EC\uD568"))));
}
