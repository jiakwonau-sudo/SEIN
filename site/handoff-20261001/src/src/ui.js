import React, { createContext, useContext, useEffect, useRef, useState, } from "react";
import { X, Search, Plus, Check, LoaderCircle, ChevronDown, Folder, FolderOpen, FileText, LockKeyhole, ShieldCheck, AlertCircle, Inbox, ArrowUp, ArrowDown, ArrowUpDown, } from "lucide-react";
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
export const fmt = (v, currency = "KRW") => Number(v || 0).toLocaleString("ko-KR", {
    maximumFractionDigits: currency === "USD" ? 2 : 0,
});
export const won = (v) => `${fmt(v)}원`;
export const shortMoney = (v) => `${fmt(Math.round((v || 0) / 10000))}`;
export const date = (v) => v
    ? new Date(v).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
    : "—";
export const bytes = (n) => n >= 1e9
    ? `${(n / 1e9).toFixed(2)} GB`
    : n >= 1e6
        ? `${(n / 1e6).toFixed(1)} MB`
        : n >= 1000
            ? `${(n / 1000).toFixed(0)} KB`
            : `${n || 0} B`;
export async function request(url, options = {}) {
    let r;
    try {
        r = await fetch(url, {
            signal: AbortSignal.timeout(30000),
            ...options,
            headers: options.body instanceof FormData
                ? options.headers
                : { "Content-Type": "application/json", ...options.headers },
        });
    }
    catch (error) {
        if (error.name === "TimeoutError" || error.name === "AbortError")
            throw Error("응답이 지연되었습니다. 저장·발송 요청은 결과를 확인한 후 다시 시도해 주세요.");
        throw error;
    }
    let body;
    try {
        body = await r.json();
    }
    catch {
        throw Error("서버 응답을 확인할 수 없습니다.");
    }
    if (!r.ok) {
        const e = Error(body.error || "요청을 처리하지 못했습니다.");
        e.status = r.status;
        throw e;
    }
    return body;
}
export function Button({ children, icon: Icon, primary = false, danger = false, small = false, loading = false, className = "", ...props }) {
    return (React.createElement("button", { ...props, disabled: props.disabled || loading, className: `btn ${primary ? "primary" : ""} ${danger ? "danger" : ""} ${small ? "sm" : ""} ${className}` },
        loading ? (React.createElement(LoaderCircle, { className: "spin", size: 15 })) : (Icon && React.createElement(Icon, { size: 15 })),
        React.createElement("span", null, children)));
}
export function IconButton({ icon: Icon, label, ...props }) {
    return (React.createElement("button", { className: "icon-btn", type: "button", "aria-label": label, title: label, ...props },
        React.createElement(Icon, { size: 17 })));
}
export function Badge({ children, tone }) {
    const map = {
        판매확정: "green",
        확정: "green",
        진행중: "blue",
        영업중: "blue",
        재고: "gray",
        취소: "red",
        무산: "gray",
        "선적 전": "amber",
        "선적 후": "violet",
        공장: "gray",
        "항구 이동": "blue",
        "수입 완료": "teal",
        "창고 입고": "green",
    };
    return (React.createElement("span", { className: `badge ${tone || map[children] || "gray"}` },
        React.createElement("span", { className: "badge-dot" }),
        children));
}
export function Field({ label, required = false, hint, children, className = "", }) {
    return (React.createElement("label", { className: `form-field ${className}` },
        React.createElement("span", null,
            label,
            required && React.createElement("b", { className: "required" }, " *")),
        children,
        hint && React.createElement("small", null, hint)));
}
export function SearchField({ value, onChange, placeholder = "검색", ...props }) {
    return (React.createElement("div", { className: "search-field" },
        React.createElement(Search, { size: 17 }),
        React.createElement("input", { "aria-label": placeholder, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, ...props }),
        value && (React.createElement("button", { "aria-label": "\uAC80\uC0C9 \uC9C0\uC6B0\uAE30", onClick: () => onChange("") },
            React.createElement(X, { size: 14 })))));
}
export function Select({ children, ...props }) {
    return (React.createElement("div", { className: "select-wrap" },
        React.createElement("select", { ...props }, children),
        React.createElement(ChevronDown, { size: 14 })));
}
const tableCollator = new Intl.Collator("ko", {
    numeric: true,
    sensitivity: "base",
});
export function sortTableRows(rows, getValue, direction = "asc") {
    return rows
        .map((item, index) => ({ item, index }))
        .sort((left, right) => {
        const a = getValue(left.item);
        const b = getValue(right.item);
        const aEmpty = a === null || a === undefined || a === "";
        const bEmpty = b === null || b === undefined || b === "";
        if (aEmpty !== bEmpty)
            return aEmpty ? 1 : -1;
        if (aEmpty)
            return left.index - right.index;
        const result = typeof a === "number" && typeof b === "number"
            ? a - b
            : tableCollator.compare(String(a), String(b));
        return ((direction === "desc" ? -result : result) || left.index - right.index);
    })
        .map(({ item }) => item);
}
export function SortableTh({ column, sort, onSort, children, className = "", defaultDirection = "asc", }) {
    const active = sort.key === column;
    const direction = active ? sort.direction : null;
    const Icon = direction === "asc"
        ? ArrowUp
        : direction === "desc"
            ? ArrowDown
            : ArrowUpDown;
    const nextDirection = active
        ? direction === "asc"
            ? "desc"
            : "asc"
        : defaultDirection;
    return (React.createElement("th", { className: `${className} sortable-th ${active ? "sorted" : ""}`.trim(), "aria-sort": direction === "asc"
            ? "ascending"
            : direction === "desc"
                ? "descending"
                : "none" },
        React.createElement("button", { type: "button", onClick: () => onSort({ key: column, direction: nextDirection }), title: `${children} ${nextDirection === "asc" ? "오름차순" : "내림차순"} 정렬` },
            React.createElement("span", null, children),
            React.createElement(Icon, { size: 13, "aria-hidden": "true" }))));
}
export function Empty({ title = "등록된 자료가 없습니다", description = "새 자료를 등록하면 이곳에서 확인할 수 있습니다.", action, }) {
    return (React.createElement("div", { className: "empty" },
        React.createElement(Inbox, { size: 32 }),
        React.createElement("strong", null, title),
        React.createElement("p", null, description),
        action));
}
export function ErrorNote({ error }) {
    return error ? (React.createElement("div", { className: "error-note", role: "alert" },
        React.createElement(AlertCircle, { size: 16 }),
        error)) : null;
}
export function PageHead({ title, description, children, eyebrow }) {
    return (React.createElement("div", { className: "page-head" },
        React.createElement("div", null,
            eyebrow && React.createElement("div", { className: "eyebrow" }, eyebrow),
            React.createElement("h1", null, title),
            React.createElement("p", null, description)),
        React.createElement("div", { className: "actions" }, children)));
}
export function Panel({ title, extra, children, className = "" }) {
    return (React.createElement("section", { className: `panel ${className}` },
        title && (React.createElement("div", { className: "panel-head" },
            React.createElement("h2", null, title),
            extra)),
        children));
}
export function Tabs({ items, value, onChange }) {
    return (React.createElement("div", { className: "tabs", role: "tablist" }, items.map((item) => {
        const [key, label, count] = Array.isArray(item) ? item : [item, item];
        return (React.createElement("button", { role: "tab", "aria-selected": value === key, className: value === key ? "active" : "", key: key, onClick: (event) => {
                if (key !== value &&
                    event.currentTarget
                        .closest("dialog")
                        ?.querySelector('[data-unsaved="true"]') &&
                    !confirm("저장하지 않은 변경 사항이 있습니다. 탭을 바꿀까요?"))
                    return;
                onChange(key);
            } },
            label,
            count !== undefined && React.createElement("span", null, count)));
    })));
}
export function LockMark({ item }) {
    return item.lock === "master" ? (React.createElement(ShieldCheck, { size: 14, className: "text-violet", "aria-label": "\uB300\uD45C \uC804\uC6A9" })) : item.lock === "password" ? (React.createElement(LockKeyhole, { size: 14, className: "text-amber", "aria-label": "\uBE44\uBC00\uBC88\uD638 \uC7A0\uAE08" })) : null;
}
export function Modal({ title, subtitle, children, wide = false, drawer = false, onClose, dirty = false, }) {
    const ref = useRef(null);
    const [changed, setChanged] = useState(false);
    const titleId = React.useId();
    const close = () => {
        if (!(dirty ||
            changed ||
            ref.current?.querySelector('[data-unsaved="true"]')) ||
            confirm("저장하지 않은 변경 사항이 있습니다. 닫을까요?"))
            onClose();
    };
    useEffect(() => {
        const d = ref.current;
        d.showModal();
        const old = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            d.close();
            document.body.style.overflow = old;
        };
    }, []);
    return (React.createElement("dialog", { ref: ref, "aria-labelledby": titleId, className: `modal ${wide ? "wide" : ""} ${drawer ? "drawer" : ""}`, onChangeCapture: (e) => {
            if (e.target.closest("form"))
                setChanged(true);
        }, onInputCapture: (e) => {
            if (e.target.closest("form"))
                setChanged(true);
        }, onClickCapture: (e) => {
            const button = e.target.closest("button");
            if (button &&
                ["취소", "돌아가기"].includes(button.textContent.trim()) &&
                (dirty || changed) &&
                !confirm("저장하지 않은 변경 사항이 있습니다. 닫을까요?")) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, onCancel: (e) => {
            e.preventDefault();
            close();
        }, onClick: (e) => {
            if (e.target === ref.current)
                close();
        } },
        React.createElement("div", { className: "modal-inner" },
            React.createElement("header", { className: "modal-head" },
                React.createElement("div", null,
                    React.createElement("h2", { id: titleId }, title),
                    subtitle && React.createElement("p", null, subtitle)),
                React.createElement(IconButton, { icon: X, label: "\uB2EB\uAE30", onClick: close })),
            children)));
}
export function ConfirmDialog({ title, description, label = "확인", danger = false, onConfirm, children, }) {
    const { close } = useApp();
    const [busy, setBusy] = useState(false), [error, setError] = useState("");
    return (React.createElement(Modal, { title: title, onClose: close },
        React.createElement("div", { className: "modal-body" },
            React.createElement("p", { className: "confirm-description" }, description),
            children,
            React.createElement(ErrorNote, { error: error })),
        React.createElement("footer", { className: "modal-foot" },
            React.createElement(Button, { onClick: close }, "\uB3CC\uC544\uAC00\uAE30"),
            React.createElement(Button, { primary: !danger, danger: danger, loading: busy, onClick: async () => {
                    setBusy(true);
                    try {
                        await onConfirm();
                        close();
                    }
                    catch (e) {
                        setError(e.message);
                    }
                    finally {
                        setBusy(false);
                    }
                } }, label))));
}
export function LockDialog({ type, item }) {
    const { act, close, state } = useApp();
    const [lock, setLock] = useState(item.lock || "none"), [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    return (React.createElement(Modal, { title: "\uC790\uB8CC \uC811\uADFC \uC124\uC815", subtitle: item.name || item.model, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await act({
                        action: "lock",
                        type,
                        targetId: item.id,
                        version: item.version,
                        data: { lock, password },
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
            React.createElement("div", { className: "modal-body" },
                React.createElement("div", { className: "choice-list" }, [
                    ["none", "일반 공개", "메뉴 권한이 있는 직원이 볼 수 있습니다."],
                    [
                        "password",
                        "비밀번호 잠금",
                        "이름은 표시하고, 비밀번호 입력 후 내용을 볼 수 있습니다.",
                    ],
                    [
                        "master",
                        "대표 전용",
                        "직원 화면과 검색 결과에 나타나지 않습니다.",
                    ],
                ].map(([k, t, d]) => (React.createElement("label", { key: k, className: lock === k ? "selected" : "" },
                    React.createElement("input", { type: "radio", name: "lock", checked: lock === k, onChange: () => setLock(k) }),
                    React.createElement("span", null,
                        React.createElement("strong", null, t),
                        React.createElement("small", null, d)))))),
                lock === "password" && (React.createElement(Field, { label: "\uC0C8 \uBE44\uBC00\uBC88\uD638", required: true, hint: "6\uC790 \uC774\uC0C1 \u00B7 \uAC19\uC740 \uB85C\uADF8\uC778 \uC138\uC158 \uB3D9\uC548 \uD574\uC81C\uB429\uB2C8\uB2E4." },
                    React.createElement("input", { type: "password", minLength: 6, required: true, value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "new-password" }))),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uC124\uC815 \uC800\uC7A5")))));
}
export function UnlockDialog({ type, item, onUnlocked }) {
    const { close, reload } = useApp();
    const [p, setP] = useState(""), [error, setError] = useState("");
    return (React.createElement(Modal, { title: "\uC7A0\uAE34 \uC790\uB8CC", subtitle: item.name || item.model, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                try {
                    await request("/api/unlock", {
                        method: "POST",
                        body: JSON.stringify({ type, targetId: item.id, password: p }),
                    });
                    await reload();
                    close();
                    onUnlocked?.();
                }
                catch (e) {
                    setError(e.message);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement(Field, { label: "\uBE44\uBC00\uBC88\uD638" },
                    React.createElement("input", { type: "password", autoFocus: true, value: p, onChange: (e) => setP(e.target.value), required: true })),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { primary: true }, "\uC7A0\uAE08 \uD574\uC81C")))));
}
export function Pagination({ total, page, onChange, size = 20 }) {
    const last = Math.max(1, Math.ceil(total / size));
    useEffect(() => {
        if (page > last)
            onChange(last);
    }, [page, last]);
    return (React.createElement("div", { className: "table-foot" },
        React.createElement("span", null,
            "\uC804\uCCB4 ",
            React.createElement("b", null, total),
            "\uAC74",
            total > 0 &&
                ` · ${(page - 1) * size + 1}–${Math.min(page * size, total)} 표시`),
        React.createElement("div", null,
            React.createElement(Button, { small: true, disabled: page <= 1, onClick: () => onChange(page - 1) }, "\uC774\uC804"),
            React.createElement("span", { className: "page-number" },
                page,
                " / ",
                last),
            React.createElement(Button, { small: true, disabled: page >= last, onClick: () => onChange(page + 1) }, "\uB2E4\uC74C"))));
}
