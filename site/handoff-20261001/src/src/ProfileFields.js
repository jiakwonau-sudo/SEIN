import React from "react";
import { Field, Button, useApp, SearchField } from "./ui.js";
import { productCategories } from "../shared/catalog.mjs";
import { rangeMatches } from "../shared/profiles.mjs";
import { searchScore, rankSearch } from "../shared/search.mjs";
function RangeNumberInput({ value, onChange, options }) {
    const text = String(value ?? "");
    const isPreset = options.includes(text);
    const [custom, setCustom] = React.useState(Boolean(text && !isPreset));
    React.useEffect(() => {
        if (isPreset)
            setCustom(false);
    }, [isPreset, text]);
    const mode = custom || (text && !isPreset) ? "__custom__" : text;
    return (React.createElement("div", { className: "range-number-input" },
        React.createElement("select", { value: mode, onChange: (event) => {
                const next = event.target.value;
                if (next === "__custom__") {
                    setCustom(true);
                    if (isPreset)
                        onChange("");
                }
                else {
                    setCustom(false);
                    onChange(next);
                }
            } },
            React.createElement("option", { value: "" }, "\uC120\uD0DD \uC548 \uD568"),
            options.map((option) => (React.createElement("option", { key: option, value: option }, option))),
            React.createElement("option", { value: "__custom__" }, "\uC9C1\uC811 \uC785\uB825")),
        mode === "__custom__" && (React.createElement("input", { type: "number", min: "0", step: "any", value: isPreset ? "" : text, onChange: (event) => onChange(event.target.value), placeholder: "\uC815\uD655\uD55C \uAC12", "aria-label": "\uC815\uD655\uD55C \uAC12 \uC9C1\uC811 \uC785\uB825" }))));
}
export function ProfileFields({ fields, value, onChange }) {
    const { state } = useApp();
    const uid = React.useId();
    return (React.createElement("div", { className: "form-grid" }, fields.map(([key, label, type = "text", options = []]) => {
        const parent = {
            productSubclass: "productClass",
            interestSubclass: "interestClass",
            wantedSubclass: "wantedClass",
        }[key];
        if (type === "subclass")
            options = productCategories[value[parent]] || [];
        const change = (v) => onChange({
            ...value,
            [key]: v,
            ...(key === "productClass"
                ? { productSubclass: "" }
                : key === "interestClass"
                    ? { interestSubclass: "" }
                    : key === "wantedClass"
                        ? { wantedSubclass: "" }
                        : {}),
        });
        return (React.createElement(Field, { key: key, label: label, hint: key === "visibility"
                ? "공개 상태 기록용입니다. 저장해도 기존 홈페이지에 게시되지 않습니다."
                : key === "listingStatus"
                    ? "판매완료 표시는 관리용이며 매출은 영업의 판매 확정으로 집계합니다."
                    : undefined }, type === "stars" ? (React.createElement("select", { value: value[key] || "0", onChange: (e) => change(e.target.value) },
            React.createElement("option", { value: "0" }, "\uBBF8\uC9C0\uC815"),
            [1, 2, 3].map((n) => (React.createElement("option", { key: n, value: n },
                "★".repeat(n),
                "☆".repeat(3 - n)))))) : type === "number-range" ? (React.createElement(RangeNumberInput, { value: value[key], options: options, onChange: change })) : type === "select" ||
            type === "subclass" ||
            type === "customer" ? (React.createElement("select", { value: value[key] || "", onChange: (e) => change(e.target.value) },
            React.createElement("option", { value: "" }, "\uC120\uD0DD \uC548 \uD568"),
            type === "customer"
                ? state.customers.map((c) => (React.createElement("option", { key: c.id, value: c.id }, c.name)))
                : options.map((o) => (React.createElement("option", { key: o, value: o }, o))))) : type === "textarea" ? (React.createElement("textarea", { rows: 3, value: value[key] || "", onChange: (e) => change(e.target.value), placeholder: key === "advertisingNumbers"
                ? "사이트명: 등록번호 (한 줄에 하나)"
                : "" })) : (React.createElement(React.Fragment, null,
            React.createElement("input", { type: type === "suggest" ? "text" : type, list: type === "suggest" ? uid + key : undefined, min: type === "number" ? "0" : undefined, step: type === "number" ? "any" : undefined, value: value[key] ?? "", onChange: (e) => change(e.target.value) }),
            type === "suggest" && (React.createElement("datalist", { id: uid + key }, options.map((o) => (React.createElement("option", { key: o, value: o })))))))));
    })));
}
export function ProfileSummary({ fields, value, state }) {
    return (React.createElement("div", { className: "info-grid" }, fields
        .filter(([k]) => value[k] !== "" && value[k] != null)
        .map(([key, label, type]) => (React.createElement("div", { key: key },
        React.createElement("small", null, label),
        React.createElement("strong", null, type === "customer"
            ? state.customers.find((c) => c.id === value[key])?.name || "—"
            : type === "stars"
                ? "★".repeat(Number(value[key])) || "미지정"
                : value[key]))))));
}
export function SmartSearch({ value, onChange, items, placeholder }) {
    const [focused, setFocused] = React.useState(false);
    const matches = value.trim() ? rankSearch(value, items, 6) : [];
    return (React.createElement("div", { className: "list-smart-search", onFocus: () => setFocused(true), onBlur: (e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
                setFocused(false);
        } },
        React.createElement(SearchField, { value: value, onChange: onChange, placeholder: placeholder }),
        focused && matches.length > 0 && (React.createElement("div", { className: "list-search-suggestions" }, matches.map((x) => (React.createElement("button", { type: "button", key: x.id, onClick: () => {
                onChange(x.title);
                setFocused(false);
            } }, x.title)))))));
}
export function matchesFilters(record, filters) {
    return Object.entries(filters).every(([key, term]) => {
        if (term === "")
            return true;
        if (["capacityTons", "strokeMm", "dieHeightMm"].includes(key))
            return rangeMatches(record[key], term);
        if ([
            "productClass",
            "productSubclass",
            "maker",
            "askingCurrency",
            "listingStatus",
            "visibility",
            "kind",
            "country",
            "importance",
            "interestClass",
            "interestSubclass",
            "wantedClass",
            "wantedSubclass",
        ].includes(key))
            return String(record[key] ?? (key === "importance" ? "0" : "")) === term;
        if (key.endsWith("Min") || key.endsWith("Max")) {
            const field = key.slice(0, -3);
            const v = record[field];
            if (v == null || v === "")
                return false;
            return key.endsWith("Min")
                ? Number(v) >= Number(term)
                : Number(v) <= Number(term);
        }
        if (key === "dateFrom" || key === "dateTo") {
            const d = (record.registeredOn || record.createdAt || "").slice(0, 10);
            return !!d && (key === "dateFrom" ? d >= term : d <= term);
        }
        return searchScore(term, String(record[key] ?? "")) >= 0;
    });
}
export function DetailFilters({ fields, value, onChange, compact = false }) {
    return (React.createElement("details", { className: `detail-filters${compact ? " compact" : ""}` },
        React.createElement("summary", null,
            "\uC0C1\uC138 \uAC80\uC0C9 \uC870\uAC74",
            Object.values(value).filter(Boolean).length
                ? ` · ${Object.values(value).filter(Boolean).length}개 적용`
                : ""),
        React.createElement("div", { className: "form-grid three" }, fields.map(([key, label, type = "text", options]) => (React.createElement(Field, { key: key, label: label }, options ? (React.createElement("select", { value: value[key] || "", onChange: (e) => onChange({
                ...value,
                [key]: e.target.value,
                ...(key === "productClass" ? { productSubclass: "" } : {}),
                ...(key === "interestClass"
                    ? { interestSubclass: "" }
                    : {}),
                ...(key === "wantedClass" ? { wantedSubclass: "" } : {}),
            }) },
            React.createElement("option", { value: "" }, "\uC804\uCCB4"),
            options.map((option) => {
                const [optionValue, optionLabel] = Array.isArray(option)
                    ? option
                    : [option, option];
                return (React.createElement("option", { key: optionValue, value: optionValue },
                    optionLabel,
                    optionValue === optionLabel ? "" : ` (${optionValue})`));
            }))) : (React.createElement("input", { type: type, min: type === "number" ? 0 : undefined, value: value[key] || "", onChange: (e) => onChange({ ...value, [key]: e.target.value }) })))))),
        React.createElement(Button, { small: true, onClick: () => onChange({}) }, "\uC870\uAC74 \uCD08\uAE30\uD654")));
}
