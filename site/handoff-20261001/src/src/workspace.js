import React, { useEffect, useRef, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Bell, Repeat2, Download, Upload, ExternalLink, Save, Trash2, Pencil, X, Users, ShieldCheck, Check, Settings, Mail, AlertTriangle, Building2, Eye, } from "lucide-react";
import { occurrences, cellDisplay, colName, deleteSheetAxis, insertSheetAxis, totals, MENUS, ACTIONS, DEFAULT_PERMISSIONS, } from "../shared/domain.mjs";
import { useApp, Button, IconButton, Badge, Field, Select, Empty, PageHead, Panel, Tabs, Modal, ErrorNote, ConfirmDialog, fmt, won, date, request, } from "./ui.js";
import { seoulDate } from "../shared/workflow.mjs";
import { DealDetail } from "./business.js";
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function CalendarPage() {
    const { state, open, allowed } = useApp();
    const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), [view, setView] = useState("month");
    const [selectedDay, setSelectedDay] = useState("");
    useEffect(() => setSelectedDay(""), [month]);
    const first = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay()), last = new Date(first.getFullYear(), first.getMonth(), first.getDate() + 41);
    const days = Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
    const events = state.events
        .flatMap((e) => occurrences(e, dateKey(first), dateKey(last)))
        .sort((a, b) => a.start.localeCompare(b.start));
    const today = seoulDate();
    const monthStart = dateKey(month), monthEnd = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    const listed = events.filter((e) => e.start.slice(0, 10) <= (selectedDay || monthEnd) &&
        e.end.slice(0, 10) >= (selectedDay || monthStart));
    const showEvent = (e) => open(React.createElement(EventDetail, { event: e }));
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uCE98\uB9B0\uB354", description: "\uC804\uC0AC \uACF5\uC720 \uC77C\uC815\uC785\uB2C8\uB2E4. \uCE98\uB9B0\uB354 \uAD8C\uD55C\uC774 \uC788\uB294 \uC9C1\uC6D0\uC740 \uBAA8\uB450 \uBCF4\uACE0, \uC120\uD0DD\uB41C \uC218\uC2E0\uC790\uB9CC \uC54C\uB9BC\uC744 \uBC1B\uC2B5\uB2C8\uB2E4." }, allowed("calendar", "create") && (React.createElement(Button, { primary: true, icon: Plus, onClick: () => open(React.createElement(EventForm, { initialDate: today })) }, "\uC77C\uC815 \uB4F1\uB85D"))),
        React.createElement(Panel, { className: "calendar-panel" },
            React.createElement("div", { className: "calendar-toolbar" },
                React.createElement("div", null,
                    React.createElement("h2", null,
                        month.getFullYear(),
                        "\uB144 ",
                        month.getMonth() + 1,
                        "\uC6D4"),
                    React.createElement(IconButton, { icon: ChevronLeft, label: "\uC774\uC804 \uB2EC", onClick: () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)) }),
                    React.createElement(IconButton, { icon: ChevronRight, label: "\uB2E4\uC74C \uB2EC", onClick: () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)) }),
                    React.createElement(Button, { small: true, onClick: () => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)) }, "\uC624\uB298")),
                React.createElement("div", { className: "segmented" },
                    React.createElement("button", { className: view === "month" ? "active" : "", onClick: () => setView("month") }, "\uC6D4\uAC04"),
                    React.createElement("button", { className: view === "list" ? "active" : "", onClick: () => {
                            setSelectedDay("");
                            setView("list");
                        } }, "\uBAA9\uB85D"))),
            view === "month" ? (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "calendar-week" }, "일월화수목금토".split("").map((d, i) => (React.createElement("div", { key: d, className: i === 0 ? "sunday" : i === 6 ? "saturday" : "" }, d)))),
                React.createElement("div", { className: "calendar-grid" }, days.map((d) => {
                    const key = dateKey(d), items = events.filter((e) => e.start.slice(0, 10) <= key && e.end.slice(0, 10) >= key);
                    return (React.createElement("div", { key: key, className: `calendar-day ${d.getMonth() !== month.getMonth() ? "outside" : ""} ${key === today ? "today" : ""}` },
                        React.createElement("div", { className: "day-heading" },
                            React.createElement("button", { "aria-label": `${key} 일정 등록`, onClick: () => allowed("calendar", "create") &&
                                    open(React.createElement(EventForm, { initialDate: key })) }, d.getDate()),
                            allowed("calendar", "create") && (React.createElement("button", { className: "day-add", "aria-label": `${key} 일정 추가`, onClick: () => open(React.createElement(EventForm, { initialDate: key })) },
                                React.createElement(Plus, { size: 12 })))),
                        items.slice(0, 3).map((e) => (React.createElement("button", { className: `calendar-event ${e.color}`, key: e.occurrenceId, onClick: () => showEvent(e) },
                            e.repeat.frequency !== "none" && React.createElement(Repeat2, { size: 10 }),
                            React.createElement("span", null,
                                !e.allDay && e.start.slice(11) + " ",
                                e.title)))),
                        items.length > 3 && (React.createElement("button", { className: "text-button", onClick: () => {
                                setSelectedDay(key);
                                setView("list");
                            } },
                            "+",
                            items.length - 3,
                            "\uAC1C \uC77C\uC815"))));
                })))) : (React.createElement("div", { className: "calendar-list" },
                selectedDay && (React.createElement(Button, { small: true, onClick: () => setSelectedDay("") },
                    selectedDay,
                    " \u00B7 \uC6D4 \uC804\uCCB4 \uBCF4\uAE30")),
                listed.map((e) => (React.createElement("button", { key: e.occurrenceId, onClick: () => showEvent(e) },
                    React.createElement("div", { className: "event-date" },
                        React.createElement("strong", null, Number(e.start.slice(8, 10))),
                        React.createElement("small", null, new Date(e.start).toLocaleDateString("ko-KR", {
                            weekday: "short",
                        }))),
                    React.createElement("span", { className: `event-color ${e.color}` }),
                    React.createElement("span", null,
                        React.createElement("strong", null, e.title),
                        React.createElement("small", null,
                            e.allDay
                                ? "종일"
                                : e.start.slice(11) + " – " + e.end.slice(11),
                            " ",
                            "\u00B7 ",
                            state.users.find((u) => u.id === e.createdBy)?.name)),
                    e.repeat.frequency !== "none" && React.createElement(Repeat2, { size: 15 }),
                    React.createElement(ChevronRight, { size: 16 })))),
                !listed.length && React.createElement(Empty, { title: "\uB4F1\uB85D\uB41C \uC77C\uC815\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" })))),
        React.createElement("div", { className: "calendar-legend" },
            React.createElement("span", null,
                React.createElement("i", { className: "blue" }),
                "\uBC29\uBB38 \u00B7 \uC5C5\uBB34"),
            React.createElement("span", null,
                React.createElement("i", { className: "green" }),
                "\uBB3C\uB958"),
            React.createElement("span", null,
                React.createElement("i", { className: "amber" }),
                "\uCD9C\uC7A5"),
            React.createElement("span", null,
                React.createElement("i", { className: "violet" }),
                "\uAE30\uD0C0"),
            React.createElement("small", null, "\uC2DC\uAC04 \uAE30\uC900: \uB300\uD55C\uBBFC\uAD6D (Asia/Seoul)"))));
}
function EventForm({ item, initialDate, occurrenceDate, occurrence }) {
    const { state, act, close } = useApp();
    const [form, set] = useState(item
        ? {
            ...structuredClone(item),
            start: occurrence?.start || item.start,
            end: occurrence?.end || item.end,
        }
        : {
            title: "",
            start: `${initialDate}T09:00`,
            end: `${initialDate}T10:00`,
            allDay: false,
            color: "blue",
            note: "",
            repeat: {
                frequency: "none",
                interval: 1,
                weekdays: [new Date(initialDate).getDay()],
            },
            recipients: [state.me.id],
            reminders: [60],
            channels: ["app", "email"],
        }), [endType, setEndType] = useState(item?.repeat?.count ? "count" : item?.repeat?.until ? "until" : "never"), [scope, setScope] = useState("one"), [error, setError] = useState(""), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
    const change = (k, v) => {
        set({ ...form, [k]: v });
        setDirty(true);
    };
    return (React.createElement(Modal, { title: item ? "일정 수정" : "일정 등록", wide: true, onClose: close, dirty: dirty },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    const repeat = {
                        ...form.repeat,
                        count: endType === "count" ? Number(form.repeat.count) : null,
                        until: endType === "until" ? form.repeat.until : null,
                    };
                    await act({
                        action: "save",
                        type: "events",
                        targetId: item?.id,
                        version: item?.version,
                        data: { ...form, repeat, scope, occurrenceDate },
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
                React.createElement(Field, { label: "\uC77C\uC815 \uC81C\uBAA9", required: true },
                    React.createElement("input", { autoFocus: true, required: true, value: form.title, onChange: (e) => change("title", e.target.value), placeholder: "\uC608: \uD55C\uC2E0\uAE08\uC18D \uD604\uC7A5 \uBC29\uBB38" })),
                React.createElement("div", { className: "form-grid" },
                    React.createElement(Field, { label: "\uC2DC\uC791", required: true },
                        React.createElement("input", { type: form.allDay ? "date" : "datetime-local", required: true, value: form.allDay ? form.start.slice(0, 10) : form.start, onChange: (e) => change("start", e.target.value) })),
                    React.createElement(Field, { label: "\uC885\uB8CC", required: true },
                        React.createElement("input", { type: form.allDay ? "date" : "datetime-local", required: true, value: form.allDay ? form.end.slice(0, 10) : form.end, min: form.start, onChange: (e) => change("end", e.target.value) }))),
                React.createElement("div", { className: "inline-fields" },
                    React.createElement("label", { className: "check-line" },
                        React.createElement("input", { type: "checkbox", checked: form.allDay, onChange: (e) => set({
                                ...form,
                                allDay: e.target.checked,
                                start: e.target.checked
                                    ? form.start.slice(0, 10)
                                    : form.start.slice(0, 10) + "T09:00",
                                end: e.target.checked
                                    ? form.end.slice(0, 10)
                                    : form.end.slice(0, 10) + "T10:00",
                            }) }),
                        "\uC885\uC77C \uC77C\uC815"),
                    React.createElement("select", { "aria-label": "\uC77C\uC815 \uBD84\uB958", value: form.color, onChange: (e) => change("color", e.target.value) },
                        React.createElement("option", { value: "blue" }, "\uBC29\uBB38 \u00B7 \uC5C5\uBB34"),
                        React.createElement("option", { value: "green" }, "\uBB3C\uB958"),
                        React.createElement("option", { value: "amber" }, "\uCD9C\uC7A5"),
                        React.createElement("option", { value: "violet" }, "\uAE30\uD0C0"))),
                React.createElement("div", { className: "form-section-title" },
                    React.createElement(Repeat2, { size: 15 }),
                    "\uBC18\uBCF5 \uC124\uC815"),
                React.createElement("div", { className: "form-grid three" },
                    React.createElement(Field, { label: "\uBC18\uBCF5 \uC8FC\uAE30" },
                        React.createElement("select", { value: form.repeat.frequency, onChange: (e) => change("repeat", {
                                ...form.repeat,
                                frequency: e.target.value,
                            }) }, [
                            ["none", "반복 없음"],
                            ["daily", "매일"],
                            ["weekly", "매주"],
                            ["monthly", "매월"],
                            ["yearly", "매년"],
                        ].map(([k, v]) => (React.createElement("option", { key: k, value: k }, v))))),
                    form.repeat.frequency !== "none" && (React.createElement(React.Fragment, null,
                        React.createElement(Field, { label: "\uBC18\uBCF5 \uAC04\uACA9" },
                            React.createElement("input", { type: "number", min: "1", max: "365", value: form.repeat.interval || 1, onChange: (e) => change("repeat", {
                                    ...form.repeat,
                                    interval: Number(e.target.value),
                                }) })),
                        React.createElement(Field, { label: "\uBC18\uBCF5 \uC885\uB8CC" },
                            React.createElement("select", { value: endType, onChange: (e) => setEndType(e.target.value) },
                                React.createElement("option", { value: "never" }, "\uC885\uB8CC \uC5C6\uC74C"),
                                React.createElement("option", { value: "until" }, "\uC885\uB8CC\uC77C \uC9C0\uC815"),
                                React.createElement("option", { value: "count" }, "\uD69F\uC218 \uC9C0\uC815")))))),
                form.repeat.frequency === "weekly" && (React.createElement("div", { className: "weekday-select" }, "일월화수목금토".split("").map((d, i) => (React.createElement("button", { type: "button", className: form.repeat.weekdays?.includes(i) ? "selected" : "", key: i, onClick: () => change("repeat", {
                        ...form.repeat,
                        weekdays: form.repeat.weekdays?.includes(i)
                            ? form.repeat.weekdays.filter((x) => x !== i)
                            : [...(form.repeat.weekdays || []), i],
                    }) }, d))))),
                form.repeat.frequency !== "none" && endType === "until" && (React.createElement(Field, { label: "\uB9C8\uC9C0\uB9C9 \uBC18\uBCF5\uC77C" },
                    React.createElement("input", { type: "date", required: true, min: form.start.slice(0, 10), value: form.repeat.until || "", onChange: (e) => change("repeat", { ...form.repeat, until: e.target.value }) }))),
                form.repeat.frequency !== "none" && endType === "count" && (React.createElement(Field, { label: "\uBC18\uBCF5 \uD69F\uC218" },
                    React.createElement("input", { type: "number", min: "1", max: "10000", required: true, value: form.repeat.count || "", onChange: (e) => change("repeat", { ...form.repeat, count: e.target.value }) }))),
                ["monthly", "yearly"].includes(form.repeat.frequency) && (React.createElement("p", { className: "hint" }, "\uD574\uB2F9 \uB0A0\uC9DC\uAC00 \uC5C6\uB294 \uB2EC\uC5D0\uB294 \uB9C8\uC9C0\uB9C9 \uB0A0\uC5D0 \uC2E4\uD589\uD569\uB2C8\uB2E4.")),
                React.createElement("div", { className: "form-section-title" },
                    React.createElement(Bell, { size: 15 }),
                    "\uC54C\uB9BC"),
                React.createElement("div", { className: "check-group" }, [
                    ["app", "앱 내 알림"],
                    ["email", "이메일"],
                ].map(([k, v]) => (React.createElement("label", { key: k },
                    React.createElement("input", { type: "checkbox", checked: form.channels.includes(k), onChange: (e) => change("channels", e.target.checked
                            ? [...form.channels, k]
                            : form.channels.filter((x) => x !== k)) }),
                    v)))),
                React.createElement("div", { className: "check-group" }, [
                    [0, "시작 시각"],
                    [10, "10분 전"],
                    [60, "1시간 전"],
                    [1440, "하루 전"],
                ].map(([k, v]) => (React.createElement("label", { key: k },
                    React.createElement("input", { type: "checkbox", checked: form.reminders.includes(k), onChange: (e) => change("reminders", e.target.checked
                            ? [...form.reminders, k]
                            : form.reminders.filter((x) => x !== k)) }),
                    v)))),
                React.createElement("p", { className: "hint" }, "\uBAA8\uB450 \uD574\uC81C\uD558\uBA74 \uC54C\uB9BC \uC5C6\uC74C \u00B7 \uC885\uC77C \uC77C\uC815\uC740 \uC624\uC804 9\uC2DC \uAE30\uC900"),
                React.createElement(Field, { label: "\uC54C\uB9BC\uC744 \uBC1B\uC744 \uC9C1\uC6D0" },
                    React.createElement("div", { className: "check-group" }, state.users
                        .filter((u) => u.active)
                        .map((u) => (React.createElement("label", { key: u.id },
                        React.createElement("input", { type: "checkbox", checked: form.recipients.includes(u.id), onChange: (e) => change("recipients", e.target.checked
                                ? [...form.recipients, u.id]
                                : form.recipients.filter((x) => x !== u.id)) }),
                        u.name))))),
                React.createElement(Field, { label: "\uC0C1\uC138 \uBA54\uBAA8" },
                    React.createElement("textarea", { rows: 3, value: form.note, onChange: (e) => change("note", e.target.value) })),
                item?.repeat.frequency !== "none" && item && (React.createElement(Field, { label: "\uBCC0\uACBD \uBC94\uC704" },
                    React.createElement("select", { value: scope, onChange: (e) => {
                            setScope(e.target.value);
                            set({
                                ...form,
                                start: e.target.value === "all"
                                    ? item.start
                                    : occurrence?.start || item.start,
                                end: e.target.value === "all"
                                    ? item.end
                                    : occurrence?.end || item.end,
                            });
                        } },
                        React.createElement("option", { value: "one" }, "\uC774\uBC88 \uC77C\uC815\uB9CC"),
                        React.createElement("option", { value: "future" }, "\uC774\uBC88\uBD80\uD130 \uC774\uD6C4 \uC77C\uC815"),
                        React.createElement("option", { value: "all" }, "\uC804\uCCB4 \uC77C\uC815")))),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uC77C\uC815 \uC800\uC7A5")))));
}
function EventDetail({ event }) {
    const { state, open, close, allowed } = useApp();
    const original = state.events.find((x) => x.id === event.id), editable = allowed("calendar", "edit") &&
        (state.me.role === "master" || original.createdBy === state.me.id);
    return (React.createElement(Modal, { title: event.title, subtitle: event.allDay
            ? "종일 일정"
            : `${event.start.replace("T", " ")} ~ ${event.end.replace("T", " ")}`, drawer: true, onClose: close },
        React.createElement("div", { className: "modal-body" },
            React.createElement("div", { className: "event-info" },
                React.createElement(CalendarDays, { size: 19 }),
                React.createElement("div", null,
                    React.createElement("strong", null,
                        event.start.slice(0, 10),
                        event.end.slice(0, 10) !== event.start.slice(0, 10) &&
                            " ~ " + event.end.slice(0, 10)),
                    React.createElement("small", null, event.allDay
                        ? "종일"
                        : event.start.slice(11) + " ~ " + event.end.slice(11)))),
            event.repeat.frequency !== "none" && (React.createElement("div", { className: "event-info" },
                React.createElement(Repeat2, { size: 19 }),
                React.createElement("span", null,
                    {
                        daily: "매일",
                        weekly: "매주",
                        monthly: "매월",
                        yearly: "매년",
                    }[event.repeat.frequency],
                    " ",
                    "\uBC18\uBCF5"))),
            React.createElement("div", { className: "event-info" },
                React.createElement(Users, { size: 19 }),
                React.createElement("span", null, event.recipients
                    .map((id) => state.users.find((u) => u.id === id)?.name)
                    .filter(Boolean)
                    .join(", "))),
            React.createElement("div", { className: "event-info" },
                React.createElement(Bell, { size: 19 }),
                React.createElement("span", null,
                    event.reminders.length
                        ? event.reminders
                            .map((m) => ({
                            0: "시작 시각",
                            10: "10분 전",
                            60: "1시간 전",
                            1440: "하루 전",
                        })[m])
                            .join(", ")
                        : "알림 없음",
                    " ",
                    "\u00B7",
                    " ",
                    event.channels
                        .map((c) => (c === "app" ? "앱" : "이메일"))
                        .join(" / "))),
            event.note && React.createElement("div", { className: "plain-note" }, event.note)),
        React.createElement("footer", { className: "modal-foot" }, editable && (React.createElement(React.Fragment, null,
            React.createElement(Button, { danger: true, disabled: !allowed("calendar", "delete"), icon: Trash2, onClick: () => open(React.createElement(EventDelete, { event: original, occurrenceDate: event.occurrenceDate })) }, "\uC0AD\uC81C"),
            React.createElement(Button, { primary: true, icon: Pencil, onClick: () => open(React.createElement(EventForm, { item: original, occurrence: event, occurrenceDate: event.occurrenceDate })) }, "\uC218\uC815"))))));
}
function EventDelete({ event, occurrenceDate }) {
    const { act, close } = useApp();
    const [scope, set] = useState("one"), [error, setError] = useState("");
    return (React.createElement(Modal, { title: "\uC77C\uC815 \uC0AD\uC81C", onClose: close },
        React.createElement("div", { className: "modal-body" },
            React.createElement("p", null, event.title),
            event.repeat.frequency !== "none" && (React.createElement(Field, { label: "\uC0AD\uC81C \uBC94\uC704" },
                React.createElement("select", { value: scope, onChange: (e) => set(e.target.value) },
                    React.createElement("option", { value: "one" }, "\uC774\uBC88 \uC77C\uC815\uB9CC"),
                    React.createElement("option", { value: "future" }, "\uC774\uBC88\uBD80\uD130 \uC774\uD6C4 \uC77C\uC815"),
                    React.createElement("option", { value: "all" }, "\uC804\uCCB4 \uC77C\uC815")))),
            React.createElement(ErrorNote, { error: error })),
        React.createElement("footer", { className: "modal-foot" },
            React.createElement(Button, { danger: true, onClick: async () => {
                    try {
                        await act({
                            action: "delete",
                            type: "events",
                            targetId: event.id,
                            version: event.version,
                            data: { scope, occurrenceDate },
                        });
                        close();
                    }
                    catch (e) {
                        setError(e.message);
                    }
                } }, "\uC77C\uC815 \uC0AD\uC81C"))));
}
export function AccountingPage({ embedded = false, section = "all", year: fixedYear, }) {
    const { state, open, allowed } = useApp();
    const [tab, setTab] = useState("auto"), [year, setYear] = useState(String(fixedYear || new Date().getFullYear()));
    const deals = state.deals.filter((d) => ["확정", "취소"].includes(d.status) && d.confirmedAt?.startsWith(year));
    const t = deals.reduce((a, d) => {
        const t = totals(d);
        return {
            buy: a.buy + t.buy,
            sell: a.sell + t.sell,
            profit: a.profit + t.profit,
        };
    }, { buy: 0, sell: 0, profit: 0 });
    const sheets = state.sheets.filter((s) => String(s.year) === year);
    const selected = state.sheets.find((s) => s.id === tab);
    useEffect(() => {
        if (fixedYear)
            setYear(String(fixedYear));
    }, [fixedYear]);
    useEffect(() => {
        if (section === "auto")
            setTab("auto");
        if (section === "sheets" && !sheets.some((sheet) => sheet.id === tab))
            setTab(sheets[0]?.id || "");
    }, [section, year, sheets.length]);
    const tabItems = [
        ...(section === "sheets" ? [] : [["auto", "자동 판매 내역"]]),
        ...(section === "auto" ? [] : sheets.map((s) => [s.id, s.name])),
    ];
    return (React.createElement(React.Fragment, null,
        !embedded && (React.createElement(PageHead, { title: "\uD68C\uACC4 \uAD00\uB9AC", description: "\uD310\uB9E4 \uB0B4\uC5ED\uC740 \uC790\uB3D9\uC73C\uB85C \uBC18\uC601\uD558\uACE0, \uC6B4\uC601 \uC7A5\uBD80\uB294 \uC790\uC720\uB86D\uAC8C \uC791\uC131\uD569\uB2C8\uB2E4." },
            React.createElement("a", { className: "btn", href: "?page=accounting", target: "_blank", rel: "noreferrer" },
                React.createElement(ExternalLink, { size: 14 }),
                "\uBCC4\uB3C4 \uCC3D"),
            React.createElement(Select, { "aria-label": "\uD68C\uACC4 \uC5F0\uB3C4", value: year, onChange: (e) => {
                    setYear(e.target.value);
                    setTab(section === "sheets" ? "" : "auto");
                } }, [
                ...new Set([
                    new Date().getFullYear() - 1,
                    new Date().getFullYear(),
                    new Date().getFullYear() + 1,
                    ...state.sheets.map((s) => s.year),
                ]),
            ]
                .sort((a, b) => b - a)
                .map((y) => (React.createElement("option", { key: y }, y)))))),
        section !== "sheets" && (React.createElement("div", { className: "account-summary" },
            React.createElement("div", null,
                React.createElement("small", null, "\uB9E4\uC785 \uACF5\uAE09\uAC00\uC561"),
                React.createElement("strong", null, won(t.buy))),
            React.createElement("div", null,
                React.createElement("small", null, "\uD310\uB9E4 \uACF5\uAE09\uAC00\uC561"),
                React.createElement("strong", null, won(t.sell))),
            React.createElement("div", null,
                React.createElement("small", null, "\uD655\uC815 \uC218\uC775"),
                React.createElement("strong", { className: "positive" }, won(t.profit))),
            React.createElement(Badge, { tone: "violet" }, "\uB300\uD45C \uC804\uC6A9"))),
        React.createElement(Panel, null,
            React.createElement("div", { className: "sheet-top" },
                tabItems.length > 0 && (React.createElement(Tabs, { value: tab, onChange: setTab, items: tabItems })),
                allowed("accounting", "edit") && (React.createElement("div", { className: "actions" }, section !== "auto" && (React.createElement(React.Fragment, null,
                    React.createElement(Button, { small: true, icon: Plus, onClick: () => open(React.createElement(SheetCreate, { year: year })) }, "\uD15C\uD50C\uB9BF\u00B7\uC0C8 \uC7A5\uBD80"),
                    React.createElement(AccountingImportButton, { year: year, small: true })))))),
            tab === "auto" ? (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "sheet-note" },
                    React.createElement(ShieldCheck, { size: 15 }),
                    React.createElement("span", null, "\uC601\uC5C5 \uAC74\uB2F9 \uD55C \uD589\uC73C\uB85C \uC790\uB3D9 \uBC18\uC601\uB429\uB2C8\uB2E4. \uAE08\uC561 \uC815\uC815\uC740 \uC6D0\uCC9C \uC601\uC5C5\uC5D0\uC11C \uCC98\uB9AC\uD558\uC138\uC694."),
                    React.createElement("a", { className: "btn sm", href: `/api/accounting/export?auto=1&year=${year}` },
                        React.createElement(Download, { size: 14 }),
                        "\uC5D1\uC140 \uB2E4\uC6B4\uB85C\uB4DC")),
                React.createElement("div", { className: "table-scroll" },
                    React.createElement("table", null,
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", null, "\uD655\uC815\uC77C"),
                                React.createElement("th", null, "\uC601\uC5C5\uBA85 / \uACE0\uAC1D\uC0AC"),
                                React.createElement("th", null, "\uC124\uBE44"),
                                React.createElement("th", { className: "num" }, "\uB9E4\uC785 \uACF5\uAE09\uAC00"),
                                React.createElement("th", { className: "num" }, "\uD310\uB9E4 \uACF5\uAE09\uAC00"),
                                React.createElement("th", { className: "num" }, "\uC218\uC775"),
                                React.createElement("th", null, "\uC0C1\uD0DC"))),
                        React.createElement("tbody", null, deals.map((d) => {
                            const v = totals(d);
                            return (React.createElement("tr", { key: d.id, className: "clickable", tabIndex: 0, onKeyDown: (e) => {
                                    if (e.target === e.currentTarget &&
                                        (e.key === "Enter" || e.key === " ")) {
                                        e.preventDefault();
                                        e.currentTarget.click();
                                    }
                                }, onClick: () => open(React.createElement(DealDetail, { id: d.id })) },
                                React.createElement("td", null, date(d.confirmedAt)),
                                React.createElement("td", null,
                                    React.createElement("strong", null, d.name),
                                    React.createElement("small", null, state.customers.find((c) => c.id === d.customerId)
                                        ?.name)),
                                React.createElement("td", null,
                                    v.count,
                                    "\uB300"),
                                React.createElement("td", { className: "num" }, fmt(v.buy)),
                                React.createElement("td", { className: "num" }, fmt(v.sell)),
                                React.createElement("td", { className: "num positive" }, fmt(v.profit)),
                                React.createElement("td", null,
                                    React.createElement(Badge, null, d.status))));
                        })),
                        React.createElement("tfoot", null,
                            React.createElement("tr", null,
                                React.createElement("td", { colSpan: 3 }, "\uD569\uACC4 (\uC6D0)"),
                                React.createElement("td", { className: "num" }, fmt(t.buy)),
                                React.createElement("td", { className: "num" }, fmt(t.sell)),
                                React.createElement("td", { className: "num positive" }, fmt(t.profit)),
                                React.createElement("td", null))))),
                !deals.length && React.createElement(Empty, { title: "\uD655\uC815\uB41C \uAC70\uB798\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4" }))) : selected ? (React.createElement(SheetEditor, { key: selected.id, sheet: selected })) : (React.createElement(Empty, { title: `${year}년 자유 장부가 없습니다` })))));
}
function SheetEditor({ sheet }) {
    const { act, allowed, notify } = useApp();
    const [baseVersion, setBaseVersion] = useState(sheet.version);
    const [name, setName] = useState(sheet.name), [cells, setCells] = useState(structuredClone(sheet.cells)), [active, setActive] = useState([0, 0]), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
    const editable = allowed("accounting", "edit");
    const edit = (r, c, value) => {
        setCells(cells.map((row, i) => i === r ? row.map((x, j) => (j === c ? value : x)) : row));
        setDirty(true);
    };
    useEffect(() => {
        const h = (e) => {
            if (dirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);
    const remove = (axis) => {
        if (confirm(`${axis === "row" ? active[0] + 1 + "행" : colName(active[1]) + "열"}을 삭제할까요? 이 위치를 참조하는 수식은 #REF!로 표시됩니다.`)) {
            if ((axis === "row" && cells.length === 1) ||
                (axis === "column" && cells[0].length === 1))
                return;
            setCells(deleteSheetAxis(cells, axis, axis === "row" ? active[0] : active[1]));
            setActive([0, 0]);
            setDirty(true);
        }
    };
    const insert = (axis) => {
        setCells(insertSheetAxis(cells, axis, axis === "row" ? active[0] : active[1]));
        setDirty(true);
    };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "sheet-toolbar", "data-unsaved": dirty },
            React.createElement("div", { className: "actions" }, editable && (React.createElement(React.Fragment, null,
                React.createElement("input", { className: "sheet-name-input", "aria-label": "\uC7A5\uBD80 \uC774\uB984", value: name, maxLength: 120, onChange: (event) => {
                        setName(event.target.value);
                        setDirty(true);
                    } }),
                React.createElement(Button, { small: true, icon: Plus, onClick: () => {
                        setCells([...cells, Array(cells[0]?.length || 5).fill("")]);
                        setDirty(true);
                    } }, "\uB9C8\uC9C0\uB9C9 \uD589 \uCD94\uAC00"),
                React.createElement(Button, { small: true, icon: Plus, onClick: () => {
                        setCells(cells.map((r) => [...r, ""]));
                        setDirty(true);
                    } }, "\uB9C8\uC9C0\uB9C9 \uC5F4 \uCD94\uAC00"),
                React.createElement(Button, { small: true, onClick: () => insert("row") }, "\uC120\uD0DD \uD589 \uC704 \uCD94\uAC00"),
                React.createElement(Button, { small: true, onClick: () => insert("column") }, "\uC120\uD0DD \uC5F4 \uC67C\uCABD \uCD94\uAC00"),
                React.createElement(Button, { small: true, onClick: () => remove("row") }, "\uC120\uD0DD \uD589 \uC0AD\uC81C"),
                React.createElement(Button, { small: true, onClick: () => remove("column") }, "\uC120\uD0DD \uC5F4 \uC0AD\uC81C")))),
            React.createElement("div", { className: "actions" },
                dirty && React.createElement("span", { className: "text-amber" }, "\uC800\uC7A5 \uC804 \uBCC0\uACBD \uC788\uC74C"),
                React.createElement("a", { className: "btn sm", href: `/api/accounting/export?sheetId=${sheet.id}`, onClick: (e) => {
                        if (dirty) {
                            e.preventDefault();
                            notify("먼저 변경 내용을 저장해 주세요.", "warning");
                        }
                    } },
                    React.createElement(Download, { size: 14 }),
                    "\uC5D1\uC140 \uB2E4\uC6B4\uB85C\uB4DC"),
                editable && (React.createElement(Button, { primary: true, small: true, icon: Save, loading: busy, disabled: !dirty, onClick: async () => {
                        setBusy(true);
                        try {
                            await act({
                                action: "save",
                                type: "sheets",
                                targetId: sheet.id,
                                version: baseVersion,
                                data: { ...sheet, name, cells },
                            });
                            setBaseVersion((v) => v + 1);
                            setDirty(false);
                        }
                        catch (e) {
                            setError(e.message);
                        }
                        finally {
                            setBusy(false);
                        }
                    } }, "\uC800\uC7A5")))),
        React.createElement("div", { className: "formula-bar" },
            React.createElement("span", null,
                colName(active[1]),
                active[0] + 1),
            React.createElement("b", null, "\u0192x"),
            React.createElement("input", { "aria-label": "\uC120\uD0DD \uC140 \uC218\uC2DD", readOnly: !editable, value: cells[active[0]]?.[active[1]] ?? "", onChange: (e) => edit(active[0], active[1], e.target.value) })),
        React.createElement(ErrorNote, { error: error }),
        React.createElement("div", { className: "sheet-scroll" },
            React.createElement("table", { className: "spreadsheet" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null),
                        cells[0]?.map((_, c) => (React.createElement("th", { key: c }, colName(c)))))),
                React.createElement("tbody", null, cells.map((row, r) => (React.createElement("tr", { key: r },
                    React.createElement("th", null, r + 1),
                    row.map((v, c) => {
                        const val = cellDisplay(cells, r, c);
                        const style = sheet.styles?.[`${r},${c}`];
                        return (React.createElement("td", { key: c, className: `${r === active[0] && c === active[1] ? "active" : ""} ${String(val).startsWith("#") ? "cell-error" : ""}`, style: {
                                fontWeight: style?.font?.bold ? "bold" : undefined,
                                textAlign: style?.alignment?.horizontal,
                                background: style?.fill?.fgColor?.argb
                                    ? "#" + style.fill.fgColor.argb.slice(-6)
                                    : undefined,
                            } },
                            React.createElement("input", { "aria-label": `${colName(c)}${r + 1}`, readOnly: !editable, value: r === active[0] && c === active[1] ? v : val, onFocus: () => setActive([r, c]), onChange: (e) => edit(r, c, e.target.value), onKeyDown: (e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        const next = document.querySelector(`input[aria-label="${colName(c)}${Math.min(cells.length, r + 2)}"]`);
                                        next?.focus();
                                    }
                                } })));
                    }))))))),
        React.createElement("div", { className: "sheet-bottom" }, "\uC140\uC744 \uC120\uD0DD\uD574 \uC785\uB825\uD558\uC138\uC694. \uC218\uC2DD \uC608: =B2+C2 \u00B7 \uC0AC\uCE59\uC5F0\uC0B0\uACFC \uAC19\uC740 \uC2DC\uD2B8\uC758 \uC140 \uCC38\uC870 \uC9C0\uC6D0")));
}
function SheetCreate({ year }) {
    const { act, close } = useApp();
    const [name, set] = useState("운영 장부"), [template, setTemplate] = useState("cost"), [error, setError] = useState("");
    const templates = {
        cost: [
            ["항목", "예상 비용", "실제 비용", "차액", "비고"],
            ["운송·통관", "", "", "=B2-C2", ""],
            ["수리·정비", "", "", "=B3-C3", ""],
            ["보관·창고", "", "", "=B4-C4", ""],
            ["합계", "=B2+B3+B4", "=C2+C3+C4", "=B5-C5", ""],
        ],
        monthly: [
            [
                "항목",
                ...Array.from({ length: 12 }, (_, index) => `${index + 1}월`),
                "연간 합계",
            ],
            ["수입", ...Array(12).fill(""), "=B2+C2+D2+E2+F2+G2+H2+I2+J2+K2+L2+M2"],
            ["지출", ...Array(12).fill(""), "=B3+C3+D3+E3+F3+G3+H3+I3+J3+K3+L3+M3"],
            [
                "차액",
                ...Array.from({ length: 12 }, (_, index) => `=${colName(index + 1)}2-${colName(index + 1)}3`),
                "=N2-N3",
            ],
        ],
        blank: Array.from({ length: 10 }, () => Array(8).fill("")),
    };
    return (React.createElement(Modal, { title: "\uC0C8 \uC7A5\uBD80", onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                try {
                    await act({
                        action: "save",
                        type: "sheets",
                        data: {
                            name,
                            year: Number(year),
                            cells: templates[template],
                        },
                    });
                    close();
                }
                catch (e) {
                    setError(e.message);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement(Field, { label: "\uC7A5\uBD80 \uC774\uB984" },
                    React.createElement("input", { required: true, value: name, onChange: (e) => set(e.target.value) })),
                React.createElement(Field, { label: "\uD15C\uD50C\uB9BF" },
                    React.createElement("select", { value: template, onChange: (event) => setTemplate(event.target.value) },
                        React.createElement("option", { value: "cost" }, "\uC608\uC0C1\u00B7\uC2E4\uC81C \uBE44\uC6A9 \uAD00\uB9AC"),
                        React.createElement("option", { value: "monthly" }, "\uC6D4\uBCC4 \uC218\uC785\u00B7\uC9C0\uCD9C"),
                        React.createElement("option", { value: "blank" }, "\uBE48 \uC7A5\uBD80 (10\uD589 \u00D7 8\uC5F4)"))),
                React.createElement("p", { className: "hint" },
                    year,
                    "\uB144 \uC7A5\uBD80\uB85C \uB9CC\uB4ED\uB2C8\uB2E4. \uC0DD\uC131 \uD6C4 \uD589\u00B7\uC5F4\uACFC \uC140 \uC218\uC2DD\uC744 \uC790\uC720\uB86D\uAC8C \uBCC0\uACBD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { primary: true }, "\uC7A5\uBD80 \uB9CC\uB4E4\uAE30")))));
}
export function AccountingImportButton({ year, small = false }) {
    const { open, allowed, notify } = useApp();
    const input = useRef();
    if (!allowed("accounting", "edit"))
        return null;
    return (React.createElement(React.Fragment, null,
        React.createElement(Button, { small: small, icon: Upload, onClick: () => input.current.click() }, "\uC5D1\uC140 \uAC00\uC838\uC624\uAE30"),
        React.createElement("input", { className: "sr-only", ref: input, type: "file", accept: ".xlsx", onChange: async (event) => {
                const file = event.target.files[0];
                if (!file)
                    return;
                try {
                    const body = new FormData();
                    body.append("file", file);
                    const parsed = await request("/api/accounting/import", {
                        method: "POST",
                        body,
                    });
                    open(React.createElement(ImportDialog, { parsed: parsed, year: year, file: file }));
                }
                catch (error) {
                    notify(error.message, "warning");
                }
                input.current.value = "";
            } })));
}
function ImportDialog({ parsed, year, file }) {
    const { act, close, reload, notify } = useApp();
    const [error, setError] = useState(""), [busy, setBusy] = useState(false);
    const cash = parsed.cashImport;
    const importCash = async () => {
        setBusy(true);
        setError("");
        try {
            const body = new FormData();
            body.append("file", file);
            const result = await request("/api/cash/import", {
                method: "POST",
                body,
            });
            await reload();
            close();
            notify(result.duplicate
                ? "이미 반영된 같은 파일입니다. 중복 등록하지 않았습니다."
                : `${result.label} ${result.imported}건을 회계에 반영했습니다.${result.skipped ? ` ${result.skipped}건은 중복 방지를 위해 제외했습니다.` : ""}`);
        }
        catch (error) {
            setError(error.message);
        }
        finally {
            setBusy(false);
        }
    };
    const importSheets = async () => {
        setBusy(true);
        setError("");
        try {
            for (const sheet of parsed.sheets)
                await act({
                    action: "save",
                    type: "sheets",
                    silent: true,
                    data: { ...sheet, year: Number(year) },
                });
            close();
            notify("자유 장부로 가져왔습니다.");
        }
        catch (error) {
            setError(error.message);
        }
        finally {
            setBusy(false);
        }
    };
    return (React.createElement(Modal, { title: "\uC5D1\uC140 \uAC00\uC838\uC624\uAE30 \uD655\uC778", onClose: close },
        React.createElement("div", { className: "modal-body" },
            cash ? (React.createElement(React.Fragment, null,
                React.createElement("p", null,
                    React.createElement("strong", null, cash.label),
                    "\uB85C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4. ",
                    cash.year,
                    "\uB144 \uD68C\uACC4 \uB370\uC774\uD130 ",
                    cash.entryCount,
                    "\uAC74\uC744 \uBC18\uC601\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."),
                React.createElement("div", { className: "account-summary" },
                    React.createElement("div", null,
                        React.createElement("small", null, "\uC218\uC785"),
                        React.createElement("strong", null, won(cash.income))),
                    React.createElement("div", null,
                        React.createElement("small", null, "\uC9C0\uCD9C"),
                        React.createElement("strong", null, won(cash.expense))),
                    React.createElement("div", null,
                        React.createElement("small", null, "\uCC28\uC561"),
                        React.createElement("strong", null, won(cash.net)))),
                React.createElement("p", { className: "hint" }, "\uD68C\uACC4 \uB370\uC774\uD130\uB85C \uBC18\uC601\uD558\uBA74 \uC6D4\uBCC4 \uC218\uC785\u00B7\uC9C0\uCD9C, \uC77C\uC77C \uACBD\uBE44, \uC785\uCD9C\uAE08\u00B7\uC794\uC561\uACFC \uD648\uD398\uC774\uC9C0 \uB300\uC2DC\uBCF4\uB4DC\uAC00 \uD568\uAED8 \uAC31\uC2E0\uB429\uB2C8\uB2E4. \uAC19\uC740 \uAE30\uAC04\uC758 \uD30C\uC77C\uC740 \uC6D0\uC7A5 \u2192 \uC77C\uC77C \uACBD\uBE44 \u2192 \uC6D4\uAC04 \uD569\uACC4 \uC21C\uC73C\uB85C \uC6B0\uC120 \uC801\uC6A9\uD574 \uC911\uBCF5\uC744 \uB9C9\uC2B5\uB2C8\uB2E4."))) : (React.createElement("p", null, "\uC9C0\uC6D0\uD558\uB294 \uD68C\uACC4 \uC591\uC2DD\uC774 \uC544\uB2C8\uBBC0\uB85C \uC790\uC720 \uC7A5\uBD80\uB85C\uB9CC \uAC00\uC838\uC62C \uC218 \uC788\uC2B5\uB2C8\uB2E4.")),
            React.createElement("p", null,
                React.createElement("strong", null,
                    parsed.sheets.length,
                    "\uAC1C \uC2DC\uD2B8"),
                " \u00B7 \uC790\uC720 \uC7A5\uBD80\uB85C\uB3C4 \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."),
            parsed.sheets.map((s, i) => (React.createElement("div", { className: "import-row", key: i },
                React.createElement("strong", null, s.name),
                React.createElement("span", null,
                    s.cells.length,
                    "\uD589 \u00B7 ",
                    s.cells[0]?.length || 0,
                    "\uC5F4")))),
            parsed.warnings.length > 0 && (React.createElement("div", { className: "import-warnings" },
                React.createElement("strong", null, "\uBCC0\uD658 \uB0B4\uC6A9 \uD655\uC778"),
                parsed.warnings.map((w, i) => (React.createElement("p", { key: i }, w))))),
            React.createElement("p", { className: "hint" }, "\uC140 \uAC12\u00B7\uC9C0\uC6D0 \uC218\uC2DD\u00B7\uAE30\uBCF8 \uC11C\uC2DD\uC744 \uAC00\uC838\uC635\uB2C8\uB2E4. \uC790\uB3D9 \uD310\uB9E4 \uB0B4\uC5ED\uC740 \uBCC0\uACBD\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."),
            React.createElement(ErrorNote, { error: error })),
        React.createElement("footer", { className: "modal-foot" },
            React.createElement(Button, { disabled: busy, onClick: close }, "\uCDE8\uC18C"),
            React.createElement(Button, { loading: busy, onClick: importSheets }, "\uC790\uC720 \uC7A5\uBD80\uB85C \uAC00\uC838\uC624\uAE30"),
            cash && (React.createElement(Button, { primary: true, loading: busy, onClick: importCash }, "\uD68C\uACC4 \uB370\uC774\uD130\uB85C \uBC18\uC601")))));
}
export function SettingsPage() {
    const { state, config, open, allowed } = useApp();
    const [tab, setTab] = useState("users");
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uACC4\uC815 \uBC0F \uC124\uC815", description: "\uC9C1\uC6D0\uBCC4 \uC5C5\uBB34 \uAD8C\uD55C\uACFC \uD68C\uC0AC \uC815\uBCF4\uB97C \uAD00\uB9AC\uD569\uB2C8\uB2E4." },
            React.createElement(Badge, { tone: "violet" }, "\uB300\uD45C \uC804\uC6A9")),
        React.createElement(Tabs, { value: tab, onChange: setTab, items: [
                ["users", "직원 계정"],
                ["company", "회사 정보"],
                ["categories", "카테고리"],
                ["operations", "운영 상태"],
            ] }),
        tab === "users" && (React.createElement(Panel, { title: "\uC9C1\uC6D0 \uACC4\uC815", extra: React.createElement(Button, { disabled: !allowed("accounts", "edit"), primary: true, small: true, icon: Plus, onClick: () => open(React.createElement(InviteForm, null)) }, "\uC9C1\uC6D0 \uCD08\uB300") },
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "\uC774\uB984"),
                            React.createElement("th", null, "\uC774\uBA54\uC77C"),
                            React.createElement("th", null, "\uACC4\uC815 \uC720\uD615"),
                            React.createElement("th", null, "\uC0C1\uD0DC"),
                            React.createElement("th", null))),
                    React.createElement("tbody", null, state.users.map((u) => (React.createElement("tr", { key: u.id },
                        React.createElement("td", null,
                            React.createElement("strong", null, u.name),
                            u.id === state.me.id && React.createElement("small", null, "\uB0B4 \uACC4\uC815")),
                        React.createElement("td", null, u.email),
                        React.createElement("td", null, u.role === "master" ? "마스터" : "일반 직원"),
                        React.createElement("td", null,
                            React.createElement(Badge, { tone: u.active ? "green" : "gray" }, u.active ? "활성" : "비활성")),
                        React.createElement("td", null, u.role !== "master" && allowed("accounts", "edit") && (React.createElement(Button, { small: true, icon: Settings, onClick: () => open(React.createElement(PermissionsDialog, { user: u })) }, "\uAD8C\uD55C \uC124\uC815"))))))))))),
        tab === "company" && React.createElement(CompanyForm, null),
        tab === "categories" && (React.createElement(Panel, { title: "\uC5C5\uBB34 \uCE74\uD14C\uACE0\uB9AC", extra: state.categories.length < 4 &&
                allowed("categories", "manage") && (React.createElement(Button, { small: true, icon: Plus, onClick: () => open(React.createElement(CategoryForm, null)) }, "\uCD94\uAC00")) }, state.categories.map((c) => (React.createElement("div", { className: "category-setting", key: c.id },
            React.createElement("div", null,
                React.createElement("strong", null, c.name),
                React.createElement("small", null,
                    c.type === "business"
                        ? "설비 · 영업 업무형"
                        : "폴더 · 제품 자료형",
                    c.fixed ? " · 고정 카테고리" : "")),
            !c.fixed && allowed("categories", "edit") && (React.createElement(Button, { small: true, onClick: () => open(React.createElement(CategoryForm, { item: c })) }, "\uC218\uC815"))))))),
        tab === "operations" && React.createElement(Operations, null)));
}
const menuLabels = {
    mail: "메일 발송",
    equipment: "상품 관리",
    deals: "영업 관리",
    quotes: "견적 관리",
    customers: "고객 관리",
    files: "자료실",
    calendar: "캘린더",
    tags: "태그 관리",
    categories: "카테고리",
};
const actionLabels = {
    send: "메일 발송",
    view: "조회",
    create: "등록",
    edit: "수정",
    delete: "삭제",
    upload: "업로드",
    download: "다운로드",
    confirm: "판매 확정",
    correct: "확정 정정·취소",
    manage: "관리",
};
function PermissionsDialog({ user }) {
    const { act, close } = useApp();
    const [permissions, set] = useState(structuredClone(user.permissions)), [active, setActive] = useState(user.active), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    return (React.createElement(Modal, { title: `${user.name} · 권한 설정`, subtitle: "\uD68C\uACC4\u00B7\uC811\uADFC \uC7A0\uAE08\u00B7\uACC4\uC815 \uAD00\uB9AC\uB294 \uB300\uD45C\uB9CC \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", wide: true, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await act({
                        action: "permissions",
                        type: "users",
                        targetId: user.id,
                        version: user.version,
                        data: { permissions, active },
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
                React.createElement("label", { className: "check-line" },
                    React.createElement("input", { type: "checkbox", checked: active, onChange: (e) => setActive(e.target.checked) }),
                    "\uACC4\uC815 \uD65C\uC131\uD654"),
                React.createElement("div", { className: "table-scroll permissions-table" },
                    React.createElement("table", null,
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", null, "\uBA54\uB274"),
                                ACTIONS.map((a) => (React.createElement("th", { key: a }, actionLabels[a]))))),
                        React.createElement("tbody", null, [...MENUS, "categories"].map((m) => (React.createElement("tr", { key: m },
                            React.createElement("td", null,
                                React.createElement("strong", null, menuLabels[m])),
                            ACTIONS.map((a) => (React.createElement("td", { key: a },
                                React.createElement("input", { type: "checkbox", "aria-label": `${menuLabels[m]} ${actionLabels[a]}`, checked: permissions[m]?.includes(a) || false, onChange: (e) => set({
                                        ...permissions,
                                        [m]: e.target.checked
                                            ? [...(permissions[m] || []), a]
                                            : (permissions[m] || []).filter((x) => x !== a),
                                    }) })))))))))),
                React.createElement("p", { className: "hint" }, "\uBA54\uBAA8\uC640 \uC77C\uC815\uC740 \uBCF8\uC778\uC774 \uC791\uC131\uD55C \uD56D\uBAA9\uB9CC \uC218\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC790\uB8CC\uBCC4 \uC7A0\uAE08\uB3C4 \uD568\uAED8 \uC801\uC6A9\uB429\uB2C8\uB2E4."),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uAD8C\uD55C \uC800\uC7A5")))));
}
function InviteForm() {
    const { close, reload, notify, config } = useApp();
    const [name, setName] = useState(""), [email, setEmail] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    return (React.createElement(Modal, { title: "\uC9C1\uC6D0 \uCD08\uB300", onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await request("/api/invite", {
                        method: "POST",
                        body: JSON.stringify({ name, email }),
                    });
                    await reload();
                    notify("초대 이메일을 보냈습니다.");
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
                config.demo && (React.createElement("div", { className: "notice" }, "\uC2E4\uC81C \uC9C1\uC6D0 \uCD08\uB300\uB294 \uC6B4\uC601\uC6A9 Supabase \uC5F0\uACB0 \uD6C4 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")),
                React.createElement(Field, { label: "\uC774\uB984" },
                    React.createElement("input", { required: true, value: name, onChange: (e) => setName(e.target.value) })),
                React.createElement(Field, { label: "\uD68C\uC0AC \uC774\uBA54\uC77C" },
                    React.createElement("input", { required: true, type: "email", value: email, onChange: (e) => setEmail(e.target.value) })),
                React.createElement("p", { className: "hint" }, "\uC77C\uBC18 \uC9C1\uC6D0 \uAE30\uBCF8 \uAD8C\uD55C\uC73C\uB85C \uCD08\uB300\uD569\uB2C8\uB2E4. \uC774\uD6C4 \uAD8C\uD55C \uC124\uC815\uC5D0\uC11C \uBCC0\uACBD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { primary: true, disabled: config.demo, loading: busy, icon: Mail }, "\uCD08\uB300 \uBA54\uC77C \uBCF4\uB0B4\uAE30")))));
}
function CompanyForm() {
    const { state, act, allowed } = useApp();
    const [form, set] = useState(state.company), [busy, setBusy] = useState(false), [error, setError] = useState("");
    return (React.createElement(Panel, { title: "\uACAC\uC801\uC11C\uC5D0 \uD45C\uC2DC\uD560 \uD68C\uC0AC \uC815\uBCF4" },
        React.createElement("form", { className: "company-form", onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await act({ action: "company", data: form });
                }
                catch (e) {
                    setError(e.message);
                }
                finally {
                    setBusy(false);
                }
            } },
            React.createElement("div", { className: "form-grid" }, [
                ["name", "국문 상호"],
                ["englishName", "영문 상호"],
                ["address", "주소"],
                ["phone", "전화번호"],
                ["email", "이메일"],
            ].map(([k, label]) => (React.createElement(Field, { label: label, key: k },
                React.createElement("input", { value: form[k] || "", readOnly: !allowed("accounts", "edit"), onChange: (e) => set({ ...form, [k]: e.target.value }) }))))),
            React.createElement("p", { className: "hint" }, "\uC0C8 \uACAC\uC801\uC11C\uBD80\uD130 \uC801\uC6A9\uB429\uB2C8\uB2E4. \uC774\uBBF8 \uBC1C\uD589\uD55C PDF\uB294 \uBCC0\uACBD\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."),
            React.createElement(ErrorNote, { error: error }),
            React.createElement(Button, { primary: true, loading: busy, icon: Save, disabled: !allowed("accounts", "edit") }, "\uD68C\uC0AC \uC815\uBCF4 \uC800\uC7A5"))));
}
export function CategoryForm({ item }) {
    const { act, close } = useApp();
    const [name, setName] = useState(item?.name || ""), [type, setType] = useState(item?.type || "business"), [error, setError] = useState("");
    return (React.createElement(Modal, { title: item ? "카테고리 수정" : "새 카테고리", onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                try {
                    await act({
                        action: "save",
                        type: "categories",
                        targetId: item?.id,
                        version: item?.version,
                        data: { name, type },
                    });
                    close();
                }
                catch (e) {
                    setError(e.message);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement(Field, { label: "\uCE74\uD14C\uACE0\uB9AC \uC774\uB984", required: true },
                    React.createElement("input", { autoFocus: true, required: true, value: name, onChange: (e) => setName(e.target.value) })),
                React.createElement("div", { className: "choice-list" }, [
                    [
                        "business",
                        "설비 · 영업 업무형",
                        "상품, 고객, 영업, 견적을 함께 관리합니다.",
                    ],
                    [
                        "drive",
                        "제품 · 자료형",
                        "폴더와 파일 중심으로 자료를 관리합니다.",
                    ],
                ].map(([k, t, d]) => (React.createElement("label", { key: k, className: type === k ? "selected" : "" },
                    React.createElement("input", { type: "radio", disabled: !!item, checked: type === k, onChange: () => setType(k) }),
                    React.createElement("span", null,
                        React.createElement("strong", null, t),
                        React.createElement("small", null, d)))))),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { primary: true }, "\uCE74\uD14C\uACE0\uB9AC \uC800\uC7A5")))));
}
function Operations() {
    const { config } = useApp();
    const [jobs, setJobs] = useState(null);
    useEffect(() => {
        request("/api/jobs")
            .then(setJobs)
            .catch(() => { });
    }, []);
    return (React.createElement(Panel, { title: "\uC6B4\uC601 \uC5F0\uACB0 \uC0C1\uD0DC" },
        React.createElement("div", { className: "operations" },
            React.createElement("div", null,
                React.createElement("strong", null, "\uB370\uC774\uD130 \uC800\uC7A5"),
                React.createElement(Badge, { tone: config.demo ? "amber" : "green" }, config.demo ? "로컬 검토용 SQLite" : "Supabase 연결"),
                React.createElement("p", null, config.demo
                    ? "샘플 데이터와 변경 사항은 이 컴퓨터에 보관됩니다."
                    : "운영 데이터는 비공개 업무 공간에 저장됩니다.")),
            React.createElement("div", null,
                React.createElement("strong", null, "\uC774\uBA54\uC77C \uC54C\uB9BC"),
                React.createElement(Badge, { tone: jobs?.emailConfigured ? "green" : "amber" }, jobs?.emailConfigured ? "발신 설정 있음" : "운영 연결 필요"),
                React.createElement("p", null, "\uBC1C\uC2E0 \uB3C4\uBA54\uC778 \uC778\uC99D\uACFC \uBA54\uC77C \uC11C\uBE44\uC2A4 \uC124\uC815 \uD6C4 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")),
            React.createElement("div", null,
                React.createElement("strong", null, "\uC608\uC57D \uC2E4\uD589 \u00B7 \uBC31\uC5C5"),
                React.createElement(Badge, { tone: "amber" }, "\uC6B4\uC601 \uAC80\uC99D \uD544\uC694"),
                React.createElement("p", null, "\uC6B4\uC601 \uC11C\uBC84\uC5D0\uC11C \uC608\uC57D \uD638\uCD9C, \uBCC4\uB3C4 \uBC31\uC5C5 \uC800\uC7A5\uC18C \uC5F0\uACB0 \uBC0F \uBCF5\uAD6C \uAC80\uC218\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."))),
        jobs?.jobs.some((j) => j.status === "failed") && (React.createElement("div", { className: "import-warnings" }, jobs.jobs
            .filter((j) => j.status === "failed")
            .map((j) => (React.createElement("p", { key: j.id },
            j.error,
            " \u00B7 \uC7AC\uC2DC\uB3C4 ",
            j.attempts,
            "/3")))))));
}
