import { QuoteForm, SalesConfirmation } from "./Quotation.js";
import { eventsOn, seoulDate, validEmail, quoteSummary, } from "../shared/workflow.mjs";
import { useViewState, useResetOnChange, useUnsaved } from "./hooks.js";
import { PendingCards } from "./Missions.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, ArrowUpRight, ArrowRight, Package, Handshake, FileText, TrendingUp, ChevronRight, MoreHorizontal, LayoutGrid, List, Pencil, Trash2, LockKeyhole, Copy, Download, Check, Send, ExternalLink, CalendarDays, Bold, Italic, List as ListIcon, Link, Save, AlertTriangle, CircleDollarSign, RotateCw, Tags, X, Star, } from "lucide-react";
import { STAGES, equipmentStatus, totals, moneyParts, krwNet, emailList, evaluateCell, safeEmbed, } from "../shared/domain.mjs";
import { useApp, Button, IconButton, Badge, Field, SearchField, Select, Empty, PageHead, Panel, Tabs, Modal, ErrorNote, Pagination, SortableTh, sortTableRows, ConfirmDialog, LockDialog, UnlockDialog, LockMark, fmt, won, shortMoney, date, request, } from "./ui.js";
import { FilesPanel } from "./drive.js";
import { equipmentFields, customerFields, searchableText, TONNAGE_RANGES, STROKE_RANGES, DIE_HEIGHT_RANGES, customerGroupSummary, } from "../shared/profiles.mjs";
import { rankSearch } from "../shared/search.mjs";
import { makers, productCategories, tradeTerms } from "../shared/catalog.mjs";
import { countryOptionsFromCustomers } from "../shared/countries.mjs";
import { ProfileFields, ProfileSummary, SmartSearch, DetailFilters, matchesFilters, } from "./ProfileFields.js";
function ExchangeFlag({ country }) {
    if (country === "US") {
        return (React.createElement("svg", { className: "exchange-flag", viewBox: "0 0 28 20", role: "img", "aria-label": "\uBBF8\uAD6D \uAD6D\uAE30" },
            React.createElement("rect", { width: "28", height: "20", fill: "#fff" }),
            [0, 3.08, 6.16, 9.24, 12.32, 15.4, 18.48].map((y) => (React.createElement("rect", { key: y, y: y, width: "28", height: "1.54", fill: "#b22234" }))),
            React.createElement("rect", { width: "12", height: "10.77", fill: "#3c3b6e" }),
            [2, 6, 10].flatMap((x) => [2, 5.35, 8.7].map((y) => (React.createElement("circle", { key: `${x}-${y}`, cx: x, cy: y, r: "0.65", fill: "#fff" }))))));
    }
    return (React.createElement("svg", { className: "exchange-flag", viewBox: "0 0 28 20", role: "img", "aria-label": "\uC77C\uBCF8 \uAD6D\uAE30" },
        React.createElement("rect", { width: "28", height: "20", fill: "#fff" }),
        React.createElement("circle", { cx: "14", cy: "10", r: "6", fill: "#bc002d" })));
}
const koreaDateTime = (value) => new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
}).format(new Date(value));
const catEquipment = (state, category) => state.equipment.filter((x) => x.categoryId === category.id);
const companyName = (s, id) => s.customers.find((c) => c.id === id)?.name || "—";
const displayModel = (equipment) => {
    const model = equipment.model || "";
    const maker = equipment.maker || "";
    if (!maker || !model.toLowerCase().startsWith(maker.toLowerCase()))
        return model;
    return model.slice(maker.length).replace(/^[\s·/_-]+/, "") || model;
};
const personName = (s, id) => s.users.find((c) => c.id === id)?.name || "—";
const ACTIVITY_TYPE_LABELS = {
    equipment: "설비",
    customers: "고객사",
    deals: "영업",
    quotes: "견적",
    folders: "폴더",
    files: "파일",
    memos: "업무 메모",
    events: "일정",
    sheets: "회계 장부",
    dashboardNotes: "특이사항 메모",
    categories: "카테고리",
};
const activityTarget = (state, log) => {
    const item = state[log.targetType]?.find((entry) => entry.id === log.targetId);
    if (!item)
        return "";
    if (log.targetType === "equipment")
        return [item.model, item.number].filter(Boolean).join(" · ");
    if (log.targetType === "memos") {
        const target = state[item.targetType]?.find((entry) => entry.id === item.targetId);
        return [
            ACTIVITY_TYPE_LABELS[item.targetType],
            target?.name || target?.model || target?.title,
            item.text?.slice(0, 80),
        ]
            .filter(Boolean)
            .join(" · ");
    }
    if (log.targetType === "dashboardNotes") {
        const categoryName = state.categories.find((entry) => entry.id === item.categoryId)?.name;
        return [categoryName, item.text?.slice(0, 100)].filter(Boolean).join(" · ");
    }
    return item.name || item.title || item.number || "";
};
const activityPresentation = (state, log) => {
    const label = ACTIVITY_TYPE_LABELS[log.targetType];
    const genericAction = [
        "등록",
        "수정",
        "휴지통 이동",
        "복구",
        "잠금 변경",
    ].includes(log.action);
    return {
        action: genericAction && label ? `${label} ${log.action}` : log.action,
        detail: log.detail || activityTarget(state, log),
    };
};
function ActivityList({ state, logs, expanded = false }) {
    return (React.createElement("div", { className: `dashboard-activity ${expanded ? "dashboard-activity-all" : ""}` },
        logs.map((log) => {
            const presentation = activityPresentation(state, log);
            return (React.createElement("div", { className: "dashboard-activity-item", key: log.id },
                React.createElement("div", { className: "dashboard-activity-meta" },
                    React.createElement("i", { "aria-hidden": "true" }),
                    React.createElement("small", null,
                        new Date(log.at).toLocaleString("ko-KR", {
                            year: expanded ? "numeric" : undefined,
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        " ",
                        "\u00B7 ",
                        personName(state, log.userId))),
                React.createElement("div", { className: "dashboard-activity-card" },
                    React.createElement("strong", null, presentation.action),
                    presentation.detail && (React.createElement("span", null,
                        React.createElement("b", { "aria-hidden": "true" }, "\u2014"),
                        " ",
                        presentation.detail)))));
        }),
        !logs.length && React.createElement("p", { className: "quiet-empty" }, "\uCD5C\uADFC \uD65C\uB3D9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.")));
}
export function Dashboard() {
    const { state, category, navigate, open, allowed, act, notify } = useApp();
    const [exchangeRates, setExchangeRates] = useState(null);
    const [exchangeError, setExchangeError] = useState("");
    const [exchangeBusy, setExchangeBusy] = useState(false);
    const now = new Date(), month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, year = now.getFullYear().toString();
    const [selectedYear, setSelectedYear] = useState(year);
    const [period, setPeriod] = useState(month.slice(-2));
    const savedDashboardNote = (state.dashboardNotes || []).find((note) => note.categoryId === category.id);
    const [dashboardNote, setDashboardNote] = useState(savedDashboardNote?.text || "");
    const noteDirty = dashboardNote !== (savedDashboardNote?.text || "");
    useUnsaved(noteDirty);
    const todayEvents = eventsOn(state.events, seoulDate());
    const [noteBusy, setNoteBusy] = useState(false);
    const [showAllActivity, setShowAllActivity] = useState(false);
    useEffect(() => {
        setDashboardNote(savedDashboardNote?.text || "");
    }, [category.id, savedDashboardNote?.id, savedDashboardNote?.text]);
    const equipment = catEquipment(state, category);
    const allDeals = state.deals.filter((d) => d.categoryId === category.id);
    const availableYears = [
        ...new Set([
            year,
            "2025",
            ...allDeals.map((deal) => deal.confirmedAt?.slice(0, 4)).filter(Boolean),
        ]),
    ].sort((a, b) => b.localeCompare(a));
    const loadExchangeRates = async () => {
        setExchangeBusy(true);
        setExchangeError("");
        try {
            setExchangeRates(await request("/api/rates"));
        }
        catch (serverError) {
            try {
                const response = await fetch("https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,JPY");
                if (!response.ok)
                    throw Error();
                const body = await response.json();
                if (!(body.rates?.USD > 0 && body.rates?.JPY > 0))
                    throw Error();
                setExchangeRates({
                    date: body.date,
                    rates: {
                        KRW: 1,
                        USD: 1 / body.rates.USD,
                        JPY: 1 / body.rates.JPY,
                    },
                    source: "Frankfurter",
                    fetchedAt: Date.now(),
                });
            }
            catch {
                setExchangeError(serverError.message);
            }
        }
        finally {
            setExchangeBusy(false);
        }
    };
    useEffect(() => {
        loadExchangeRates();
    }, []);
    const deals = allDeals.filter((d) => {
        if (d.status !== "확정")
            return false;
        const confirmedMonth = d.confirmedAt?.slice(0, 7);
        if (!confirmedMonth?.startsWith(selectedYear))
            return false;
        if (period === "year")
            return true;
        if (period === "ytd")
            return confirmedMonth <= `${selectedYear}-${month.slice(-2)}`;
        return confirmedMonth === `${selectedYear}-${period}`;
    });
    const t = deals.reduce((r, d) => {
        const a = totals(d);
        return {
            buy: r.buy + a.buy,
            sell: r.sell + a.sell,
            profit: r.profit + a.profit,
        };
    }, { buy: 0, sell: 0, profit: 0 });
    const periodLabel = period === "year"
        ? `${selectedYear}년 연간`
        : period === "ytd"
            ? `${selectedYear}년 1월~${Number(month.slice(-2))}월`
            : `${selectedYear}년 ${Number(period)}월`;
    const profitRate = t.sell ? (t.profit / t.sell) * 100 : 0;
    const avgProfit = deals.length ? t.profit / deals.length : 0;
    const maxProfit = deals.length
        ? Math.max(...deals.map((deal) => totals(deal).profit))
        : 0;
    const leadDays = deals
        .map((deal) => {
        const start = Date.parse(deal.createdAt || "");
        const end = Date.parse(deal.confirmedAt || "");
        return Number.isFinite(start) && Number.isFinite(end)
            ? Math.max(0, Math.round((end - start) / 86400000))
            : null;
    })
        .filter((value) => value !== null);
    const avgLeadDays = leadDays.length
        ? Math.round(leadDays.reduce((sum, value) => sum + value, 0) / leadDays.length)
        : 0;
    const pendingDeals = allDeals.filter((deal) => deal.status === "진행중");
    const salesRows = [
        ...deals,
        ...pendingDeals.filter((deal) => !deals.includes(deal)),
    ]
        .sort((a, b) => String(b.confirmedAt || b.updatedAt || b.createdAt || "").localeCompare(String(a.confirmedAt || a.updatedAt || a.createdAt || "")))
        .slice(0, 8);
    const stages = STAGES.map((x) => ({
        name: x,
        count: equipment.filter((e) => e.stage === x).length,
    }));
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uB300\uC2DC\uBCF4\uB4DC", description: "\uC124\uBE44 \uD604\uD669\uACFC \uC601\uC5C5 \uC2E4\uC801\uC744 \uD55C\uB208\uC5D0 \uD655\uC778\uD558\uC138\uC694." },
            React.createElement(Select, { "aria-label": "\uC2E4\uC801 \uC870\uD68C \uC5F0\uB3C4", value: selectedYear, onChange: (e) => setSelectedYear(e.target.value) }, availableYears.map((optionYear) => (React.createElement("option", { key: optionYear, value: optionYear },
                optionYear,
                "\uB144")))),
            React.createElement(Select, { "aria-label": "\uC2E4\uC801 \uC870\uD68C \uAE30\uAC04", value: period, onChange: (e) => setPeriod(e.target.value) },
                React.createElement("option", { value: "year" }, "\uC5F0\uAC04 \uC885\uD569"),
                React.createElement("option", { value: "ytd" },
                    "1\uC6D4~",
                    Number(month.slice(-2)),
                    "\uC6D4 \uC885\uD569"),
                Array.from({ length: 12 }, (_, index) => {
                    const monthNumber = 12 - index;
                    const value = String(monthNumber).padStart(2, "0");
                    return (React.createElement("option", { key: value, value: value },
                        monthNumber,
                        "\uC6D4"));
                })),
            React.createElement("a", { className: "btn", href: `/api/accounting/export?auto=1&year=${selectedYear}` },
                React.createElement(Download, { size: 14 }),
                "\uC5D1\uC140 \uB0B4\uB824\uBC1B\uAE30"),
            React.createElement(Button, { icon: ArrowUpRight, onClick: () => navigate("deals") }, "\uC601\uC5C5 \uB0B4\uC5ED")),
        React.createElement("section", { className: "dashboard-exchange", "aria-label": "\uC624\uB298\uC758 \uD658\uC728" },
            React.createElement("div", { className: "dashboard-exchange-title" },
                React.createElement(CircleDollarSign, { size: 19 }),
                React.createElement("div", null,
                    React.createElement("strong", null, "\uC624\uB298\uC758 \uD658\uC728"),
                    React.createElement("small", null, exchangeRates
                        ? `한국 원화(KRW) 기준 · 환율 기준일 ${exchangeRates.date} · 한국시간 ${koreaDateTime(exchangeRates.fetchedAt || Date.now())} · ${exchangeRates.source}${exchangeRates.stale ? " · 최근 저장값" : ""}`
                        : exchangeError || "환율을 불러오는 중입니다."))),
            React.createElement("div", { className: "dashboard-exchange-rates" },
                React.createElement("div", null,
                    React.createElement("span", { className: "exchange-rate-label" },
                        React.createElement(ExchangeFlag, { country: "US" }),
                        "\uBBF8\uAD6D USD"),
                    React.createElement("strong", null, exchangeRates
                        ? `1달러 = ${fmt(exchangeRates.rates.USD, "USD")}원`
                        : "—")),
                React.createElement("div", null,
                    React.createElement("span", { className: "exchange-rate-label" },
                        React.createElement(ExchangeFlag, { country: "JP" }),
                        "\uC77C\uBCF8 JPY"),
                    React.createElement("strong", null, exchangeRates
                        ? `100엔 = ${fmt(exchangeRates.rates.JPY * 100, "USD")}원`
                        : "—"))),
            React.createElement(Button, { small: true, icon: RotateCw, loading: exchangeBusy, onClick: loadExchangeRates }, "\uC0C8\uB85C\uACE0\uCE68")),
        React.createElement(PendingCards, null),
        React.createElement("div", { className: "kpi-grid" }, [
            [
                `${periodLabel} 판매 확정`,
                deals.length,
                "건",
                "묶음 거래는 1건으로 집계",
                Handshake,
                "violet",
            ],
            ["매입가 합계", t.buy, "만원", "확정 건 매입 원가", Package, "blue"],
            [
                "판매가 합계",
                t.sell,
                "만원",
                "부가세 제외 공급가액",
                CircleDollarSign,
                "blue",
            ],
            [
                "확정 수익",
                t.profit,
                "만원",
                "판매 금액 − 매입 금액",
                TrendingUp,
                "green",
            ],
            [
                "건당 평균 수익",
                avgProfit,
                "만원",
                "확정 거래 기준 평균",
                FileText,
                "amber",
            ],
        ].map(([label, value, unit, sub, Icon, tone]) => (React.createElement("div", { className: "kpi", key: label },
            React.createElement("div", { className: "kpi-top" },
                React.createElement("span", null, label),
                React.createElement("span", { className: `kpi-icon ${tone}` },
                    React.createElement(Icon, { size: 16 }))),
            React.createElement("div", { className: `kpi-value ${label === "확정 수익" ? "positive" : ""}` },
                unit === "건" ? value : shortMoney(value),
                React.createElement("small", null, unit)),
            React.createElement("p", null, sub))))),
        React.createElement(Panel, { title: `${periodLabel} 확정 · 현재 진행 중 영업`, extra: React.createElement("button", { className: "text-button", onClick: () => navigate("deals") },
                "\uC601\uC5C5 \uAD00\uB9AC\uC5D0\uC11C \uBCF4\uAE30 ",
                React.createElement(ArrowRight, { size: 13 })) },
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "\uC601\uC5C5 \uAC74 / \uACE0\uAC1D\uC0AC"),
                            React.createElement("th", null, "\uC124\uBE44"),
                            React.createElement("th", { className: "num" }, "\uB9E4\uC785\uAC00"),
                            React.createElement("th", { className: "num" }, "\uD310\uB9E4\uAC00"),
                            React.createElement("th", { className: "num" }, "\uC218\uC775"),
                            React.createElement("th", null, "\uC0C1\uD0DC"))),
                    React.createElement("tbody", null, salesRows.map((deal) => {
                        const value = totals(deal);
                        return (React.createElement("tr", { key: deal.id, className: "clickable", tabIndex: 0, onClick: () => open(React.createElement(DealDetail, { id: deal.id })), onKeyDown: (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    event.currentTarget.click();
                                }
                            } },
                            React.createElement("td", null,
                                React.createElement("strong", null, deal.name),
                                React.createElement("small", null, companyName(state, deal.customerId))),
                            React.createElement("td", null,
                                value.count,
                                "\uB300"),
                            React.createElement("td", { className: "num" }, won(value.buy)),
                            React.createElement("td", { className: "num" }, deal.status === "확정" ? won(value.sell) : "예정"),
                            React.createElement("td", { className: "num positive" }, deal.status === "확정" ? won(value.profit) : "—"),
                            React.createElement("td", null,
                                React.createElement(Badge, null, deal.status))));
                    }))),
                !salesRows.length && React.createElement(Empty, { title: "\uD45C\uC2DC\uD560 \uD310\uB9E4 \uD604\uD669\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" }))),
        React.createElement("div", { className: "dashboard-middle dashboard-mock-grid" },
            React.createElement(Panel, { title: "\uD310\uB9E4 \uC218\uC775 \uD1B5\uACC4" },
                React.createElement("div", { className: "dashboard-profit-stats" },
                    React.createElement("div", null,
                        React.createElement("span", null, "\uD655\uC815 \uAC74 \uD3C9\uADE0 \uC218\uC775"),
                        React.createElement("strong", null, won(avgProfit))),
                    React.createElement("div", null,
                        React.createElement("span", null, "\uD3C9\uADE0 \uC218\uC775\uB960"),
                        React.createElement("strong", null,
                            profitRate.toFixed(1),
                            "%")),
                    React.createElement("div", null,
                        React.createElement("span", null, "\uCD5C\uACE0 \uC218\uC775 \uAC74"),
                        React.createElement("strong", null, won(maxProfit))),
                    React.createElement("div", null,
                        React.createElement("span", null, "\uD3C9\uADE0 \uB9AC\uB4DC\uD0C0\uC784"),
                        React.createElement("strong", null,
                            avgLeadDays,
                            "\uC77C")),
                    React.createElement("div", null,
                        React.createElement("span", null, "\uC9C4\uD589 \uC911 \uC601\uC5C5 \uAC74"),
                        React.createElement("strong", null,
                            pendingDeals.length,
                            "\uAC74")))),
            React.createElement(Panel, { title: "\uC124\uBE44 \uC0C1\uD0DC \uBD84\uD3EC", extra: React.createElement("span", { className: "subtle" },
                    "\uCD1D ",
                    equipment.length,
                    "\uB300") },
                React.createElement("div", { className: "stage-list" }, stages.map((stageItem, index) => (React.createElement("button", { key: stageItem.name, onClick: () => navigate("equipment") },
                    React.createElement("span", { className: `stage-dot stage-${index}` }),
                    React.createElement("span", null, stageItem.name),
                    React.createElement("div", { className: "stage-track" },
                        React.createElement("i", { className: `stage-${index}`, style: {
                                width: `${equipment.length ? (stageItem.count / equipment.length) * 100 : 0}%`,
                            } })),
                    React.createElement("b", null,
                        stageItem.count,
                        React.createElement("small", null, "\uB300")))))))),
        React.createElement("div", { className: "dashboard-middle dashboard-mock-grid" },
            React.createElement(Panel, { title: "\uCD5C\uADFC \uD65C\uB3D9", className: "activity-panel", extra: (state.logs || []).length > 3 && (React.createElement(Button, { small: true, icon: showAllActivity ? null : ChevronRight, "aria-expanded": showAllActivity, onClick: () => setShowAllActivity((value) => !value) }, showAllActivity ? "접기" : `더보기 (${state.logs.length})`)) },
                React.createElement(ActivityList, { state: state, logs: showAllActivity
                        ? state.logs || []
                        : (state.logs || []).slice(0, 3), expanded: showAllActivity })),
            React.createElement(Panel, { title: "\uD2B9\uC774\uC0AC\uD56D \uBA54\uBAA8" },
                React.createElement("div", { className: "dashboard-special-note", "data-unsaved": noteDirty },
                    React.createElement("textarea", { rows: 5, maxLength: 2000, value: dashboardNote, disabled: !allowed("equipment", "edit"), onChange: (event) => setDashboardNote(event.target.value), placeholder: "\uC120\uC801\u00B7\uD1B5\uAD00\u00B7\uD604\uC7A5 \uC77C\uC815 \uB4F1 \uBAA8\uB450\uAC00 \uD655\uC778\uD560 \uD2B9\uC774\uC0AC\uD56D\uC744 \uC785\uB825\uD558\uC138\uC694." }),
                    React.createElement("div", null,
                        React.createElement("small", null, savedDashboardNote
                            ? `최종 수정: ${personName(state, savedDashboardNote.updatedBy)} · ${date(savedDashboardNote.updatedAt)}`
                            : "아직 등록된 특이사항이 없습니다."),
                        allowed("equipment", "edit") && (React.createElement(Button, { small: true, primary: true, icon: Save, loading: noteBusy, disabled: dashboardNote === (savedDashboardNote?.text || ""), onClick: async () => {
                                setNoteBusy(true);
                                try {
                                    await act({
                                        action: "save",
                                        type: "dashboardNotes",
                                        targetId: savedDashboardNote?.id,
                                        version: savedDashboardNote?.version,
                                        data: { categoryId: category.id, text: dashboardNote },
                                    });
                                }
                                catch (error) {
                                    notify(error.message, "warning");
                                }
                                finally {
                                    setNoteBusy(false);
                                }
                            } }, "\uC800\uC7A5")))))),
        React.createElement("div", { className: "dashboard-bottom dashboard-calendar-only" },
            React.createElement(Panel, { title: "\uC624\uB298\uC758 \uC77C\uC815", extra: React.createElement("button", { className: "text-button", onClick: () => navigate("calendar") },
                    "\uCE98\uB9B0\uB354 ",
                    React.createElement(ArrowRight, { size: 13 })) },
                React.createElement("div", { className: "today-date" },
                    React.createElement(CalendarDays, { size: 18 }),
                    now.toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                    })),
                todayEvents.map((e) => (React.createElement("button", { className: "today-event", key: e.occurrenceId, onClick: () => navigate("calendar") },
                    React.createElement("span", { className: "event-line" }),
                    React.createElement("div", null,
                        React.createElement("strong", null, e.title),
                        React.createElement("small", null,
                            e.allDay ? "종일" : e.start.slice(11),
                            " \u00B7",
                            " ",
                            personName(state, e.createdBy))),
                    React.createElement(ChevronRight, { size: 14 })))),
                !todayEvents.length && (React.createElement("p", { className: "quiet-empty" }, "\uC624\uB298 \uC608\uC815\uB41C \uC77C\uC815\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.")))),
        React.createElement("div", { className: "dashboard-note" }, "\uC870\uD68C \uAC00\uB2A5\uD55C \uB370\uC774\uD130 \uAE30\uC900 \u00B7 \uC6D0\uD654 / \uBD80\uAC00\uC138 \uC81C\uC678 \u00B7 \uBD80\uB300\uBE44\uC6A9\uC740 \uC218\uC775\uC5D0\uC11C \uCC28\uAC10\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")));
}
export function EquipmentPage() {
    const { state, category, open, allowed } = useApp();
    const [detailFilters, setDetailFilters] = useViewState("filters", {});
    const [q, setQ] = useViewState("query", ""), [status, setStatus] = useViewState("status", "전체"), [stage, setStage] = useViewState("stage", "전체 단계"), [sort, setSort] = useViewState("sort", {
        key: "registered",
        direction: "desc",
    }), [view, setView] = useViewState("view", "list"), [page, setPage] = useViewState("page", 1);
    const eq = catEquipment(state, category);
    const equipmentCountry = (item) => item.originCountry ||
        (/^(Korea|Japan|China|Taiwan|Canada|Germany|Indonesia|Philippines|Singapore|Thailand|Vietnam)\s*\//i.exec(item.storagePlace || "")?.[1] || "");
    const filterOptions = (field) => [...new Set(eq.map((item) => String(field === "originCountry" ? equipmentCountry(item) : item[field] ?? "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));
    const companyOptions = [...new Set(eq.flatMap((item) => [item.supplierId, item.buyerId, item.introducedCustomerId]
            .filter(Boolean).map((id) => companyName(state, id))).filter((name) => name !== "—"))].sort((a, b) => a.localeCompare(b, "ko"));
    const yearOptions = Array.from({ length: new Date().getFullYear() - 1949 }, (_, index) => String(new Date().getFullYear() - index));
    const latestMemos = new Map();
    const memoCounts = new Map();
    for (const memo of state.memos) {
        if (memo.targetType !== "equipment" || memo.deletedAt)
            continue;
        memoCounts.set(memo.targetId, (memoCounts.get(memo.targetId) || 0) + 1);
        const previous = latestMemos.get(memo.targetId);
        if (!previous || memo.updatedAt > previous.updatedAt)
            latestMemos.set(memo.targetId, memo);
    }
    const firstPhotos = useMemo(() => {
        const result = new Map();
        for (const file of state.files) {
            if (!result.has(file.targetId) &&
                file.targetType === "equipment" &&
                !file.locked &&
                file.status === "ready" &&
                /^image\/(jpeg|png|webp)$/.test(file.type))
                result.set(file.targetId, file.id);
        }
        return result;
    }, [state.files]);
    const migratedCounts = useMemo(() => {
        const imported = eq.filter((e) => e.legacySourceId);
        const count = (maker) => imported.filter((e) => (e.maker || "").toLowerCase() === maker.toLowerCase()).length;
        return {
            imported: imported.length,
            asahi: count("Asahi-Seiki"),
            bruderer: count("Bruderer"),
            minster: count("Minster"),
            existing: eq.length - imported.length,
        };
    }, [eq]);
    const companyNames = (e) => [
        ...new Set([e.supplierId, e.introducedCustomerId, e.buyerId]
            .filter(Boolean)
            .map((id) => companyName(state, id))
            .filter((name) => name !== "—")),
    ];
    const purchaseInfo = (e) => {
        const original = e.legacyTransactions?.[0];
        return {
            terms: [
                e.purchaseTerms || original?.buyTerms,
                e.purchasePlace || original?.buyPlace,
            ]
                .filter(Boolean)
                .join(" · "),
            amount: e.purchaseUnverified
                ? [original?.buyCurrency, original?.buyPrice].filter(Boolean).join(" ")
                : `${fmt(e.buy)} ${e.currency}`,
        };
    };
    const saleInfo = (e) => ({
        terms: [e.saleTerms, e.salePlace].filter(Boolean).join(" · "),
        amount: e.askingPrice !== "" && e.askingPrice != null
            ? `${fmt(e.askingPrice)} ${e.askingCurrency || ""}`
            : "",
    });
    const indexed = useMemo(() => catEquipment(state, category).map((e) => ({
        ...e,
        title: e.model,
        searchText: e.locked
            ? `${e.model} ${e.number}`
            : searchableText(state, "equipment", e),
    })), [state.equipment, state.customers, state.memos, state.files, category.id]);
    const matched = q.trim() ? rankSearch(q, indexed, Infinity) : indexed;
    const filtered = matched.filter((e) => matchesFilters({
        ...e,
        originCountry: equipmentCountry(e),
        company: [e.supplierId, e.buyerId, e.introducedCustomerId]
            .map((id) => companyName(state, id))
            .join(" "),
    }, detailFilters) &&
        (status === "전체" || equipmentStatus(e.id, state.deals, e) === status) &&
        (stage === "전체 단계" || e.stage === stage));
    const equipmentSortValue = (e) => {
        const purchase = purchaseInfo(e);
        const sale = saleInfo(e);
        const values = {
            featured: Number(Boolean(e.featured)) * 2 + Number(firstPhotos.has(e.id)),
            category: `${e.productClass || ""} ${e.productSubclass || ""} ${e.maker || ""}`,
            model: displayModel(e),
            manufactured: e.manufacturedYear === "" || e.manufacturedYear == null
                ? ""
                : Number(e.manufacturedYear) * 100 + Number(e.manufacturedMonth || 0),
            purchase: `${purchase.terms} ${purchase.amount}`,
            sale: `${sale.terms} ${sale.amount}`,
            number: `${e.number || ""} ${e.advertisingNumbers || ""}`,
            location: `${equipmentCountry(e)} ${e.storagePlace || ""}`,
            tonnage: Number(e.capacityTons || 0),
            stage: e.stage || "",
            company: companyNames(e).join(" "),
            status: `${e.listingStatus || ""} ${equipmentStatus(e.id, state.deals, e)} ${e.stage || ""}`,
            registered: e.registeredOn || e.createdAt || "",
            memo: memoCounts.get(e.id) || 0,
        };
        return values[sort.key];
    };
    const rows = sortTableRows(filtered, equipmentSortValue, sort.direction);
    useResetOnChange(() => setPage(1), [q, status, stage, sort, category.id, detailFilters]);
    const show = (e) => open(e.locked ? (React.createElement(UnlockDialog, { type: "equipment", item: e })) : (React.createElement(EquipmentDetail, { id: e.id })));
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uC0C1\uD488 \uAD00\uB9AC", description: "\uC124\uBE44\uBCC4 \uC815\uBCF4\uC640 \uC790\uB8CC, \uC601\uC5C5 \uC9C4\uD589 \uC0C1\uD669\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4." }, allowed("equipment", "create") && (React.createElement(Button, { primary: true, icon: Plus, onClick: () => open(React.createElement(EquipmentForm, null)) }, "\uC0C1\uD488 \uB4F1\uB85D"))),
        React.createElement("div", { className: "summary-strip" }, [
            ["전체", eq.length],
            ...["재고", "영업중", "판매확정", "이전 판매완료"].map((k) => [
                k,
                eq.filter((e) => equipmentStatus(e.id, state.deals, e) === k)
                    .length,
            ]),
        ].map(([k, n]) => (React.createElement("button", { key: k, className: status === k ? "active" : "", onClick: () => setStatus(k) },
            React.createElement("span", null, k),
            React.createElement("b", null, n))))),
        React.createElement("div", { className: "equipment-origin-summary" },
            React.createElement("strong", null,
                "\uAD6C\uBC84\uC804 \uC774\uAD00 ",
                migratedCounts.imported,
                "\uAC1C"),
            [
                ["Asahi-Seiki", "Asahi-Seiki", migratedCounts.asahi],
                ["Bruderer", "BRUDERER", migratedCounts.bruderer],
                ["Minster", "MINSTER", migratedCounts.minster],
            ].map(([maker, label, count]) => (React.createElement("button", { type: "button", key: maker, className: detailFilters.maker === maker ? "active" : "", "aria-pressed": detailFilters.maker === maker, onClick: () => setDetailFilters({
                    ...detailFilters,
                    maker: detailFilters.maker === maker ? "" : maker,
                }) },
                label,
                " ",
                count))),
            !!migratedCounts.existing && (React.createElement("span", null,
                "\uC9C1\uC811 \uB4F1\uB85D ",
                migratedCounts.existing,
                "\uAC1C"))),
        React.createElement(DetailFilters, { compact: true, value: detailFilters, onChange: setDetailFilters, fields: [
                ["productClass", "대분류", "text", Object.keys(productCategories)],
                [
                    "productSubclass",
                    "중분류",
                    "text",
                    detailFilters.productClass
                        ? productCategories[detailFilters.productClass]
                        : Object.values(productCategories).flat(),
                ],
                ["maker", "메이커", "text", makers],
                ["originCountry", "설비 위치 (국가)", "text", filterOptions("originCountry")],
                ["storagePlace", "보관 장소", "text", filterOptions("storagePlace")],
                ["model", "모델명", "text", filterOptions("model")],
                ["capacityTons", "가압 능력 (톤)", "text", TONNAGE_RANGES],
                ["strokeMm", "스트로크 (mm)", "text", STROKE_RANGES],
                ["dieHeightMm", "다이하이트 (mm)", "text", DIE_HEIGHT_RANGES],
                ["company", "업체명 (매입·판매)", "text", companyOptions],
                ["manufacturedYearMin", "연식 시작", "text", yearOptions],
                ["manufacturedYearMax", "연식 끝", "text", yearOptions],
                ["dateFrom", "등록일 시작", "date"],
                ["dateTo", "등록일 끝", "date"],
                ["saleTerms", "판매조건", "text", filterOptions("saleTerms")],
                ["askingCurrency", "판매 통화", "text", ["KRW", "USD", "JPY", "EUR"]],
                ["askingPriceMin", "최소 판매가격", "number"],
                ["askingPriceMax", "최대 판매가격", "number"],
                ["advertisingNumbers", "광고 사이트 등록번호", "text", filterOptions("advertisingNumbers")],
                ["number", "설비번호", "text", filterOptions("number")],
                [
                    "listingStatus",
                    "판매 상태",
                    "text",
                    ["판매중", "판매완료", "판매보류"],
                ],
                ["visibility", "노출 상태", "text", ["미정", "노출", "비노출"]],
            ] }),
        React.createElement("div", { className: "filters" },
            React.createElement(SmartSearch, { items: indexed, value: q, onChange: setQ, placeholder: "\uBE0C\uB79C\uB4DC\u00B7\uBAA8\uB378\u00B7\uC0AC\uC591\u00B7\uAC70\uB798\uCC98\u00B7\uBA54\uBAA8 \uAC80\uC0C9 (\uCD08\uC131\u00B7\uC624\uD0C0 \uC9C0\uC6D0)" }),
            React.createElement(Select, { "aria-label": "\uBB3C\uB958 \uB2E8\uACC4", value: stage, onChange: (e) => setStage(e.target.value) },
                React.createElement("option", null, "\uC804\uCCB4 \uB2E8\uACC4"),
                STAGES.map((s) => (React.createElement("option", { key: s }, s)))),
            React.createElement("span", { className: "filter-spacer" }),
            React.createElement("div", { className: "segmented" },
                React.createElement(IconButton, { icon: List, label: "\uBAA9\uB85D \uBCF4\uAE30", "aria-pressed": view === "list", onClick: () => setView("list") }),
                React.createElement(IconButton, { icon: LayoutGrid, label: "\uCE74\uB4DC \uBCF4\uAE30", "aria-pressed": view === "grid", onClick: () => setView("grid") }))),
        React.createElement(Panel, null,
            React.createElement("div", { className: view === "grid" ? "equipment-grid" : "table-scroll" }, view === "list" ? (React.createElement("table", { className: "equipment-catalog-table" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement(SortableTh, { column: "featured", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uD2B9\uBCC4\u00B7\uC774\uBBF8\uC9C0"),
                        React.createElement(SortableTh, { column: "category", sort: sort, onSort: setSort }, "\uC81C\uD488\uBD84\uB958\u00B7\uBA54\uC774\uCEE4"),
                        React.createElement(SortableTh, { column: "model", sort: sort, onSort: setSort, className: "w-main" }, "\uBAA8\uB378\uBA85"),
                        React.createElement(SortableTh, { column: "manufactured", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uC5F0\uC2DD"),
                        React.createElement(SortableTh, { column: "tonnage", sort: sort, onSort: setSort }, "\uD1A4\uC218"),
                        React.createElement(SortableTh, { column: "stage", sort: sort, onSort: setSort }, "\uB2E8\uACC4"),
                        React.createElement(SortableTh, { column: "purchase", sort: sort, onSort: setSort }, "\uAD6C\uB9E4\uC870\uAC74"),
                        React.createElement(SortableTh, { column: "sale", sort: sort, onSort: setSort }, "\uD310\uB9E4\uC870\uAC74"),
                        React.createElement(SortableTh, { column: "number", sort: sort, onSort: setSort }, "\uB4F1\uB85D\uBC88\uD638"),
                        React.createElement(SortableTh, { column: "location", sort: sort, onSort: setSort }, "\uC124\uBE44\uC704\uCE58"),
                        React.createElement(SortableTh, { column: "company", sort: sort, onSort: setSort }, "\uC5C5\uCCB4\uBA85"),
                        React.createElement(SortableTh, { column: "status", sort: sort, onSort: setSort }, "\uD310\uB9E4\uC0C1\uD0DC"),
                        React.createElement(SortableTh, { column: "registered", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uB4F1\uB85D\uC77C"),
                        React.createElement(SortableTh, { column: "memo", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uBA54\uBAA8"),
                        React.createElement("th", null))),
                React.createElement("tbody", null, rows.slice((page - 1) * 20, page * 20).map((e) => {
                    const photoId = firstPhotos.get(e.id);
                    const purchase = purchaseInfo(e);
                    const sale = saleInfo(e);
                    const companies = companyNames(e);
                    const memoText = e.locked
                        ? "잠긴 자료"
                        : latestMemos.get(e.id)?.text || e.note || "메모 없음";
                    return (React.createElement("tr", { key: e.id, className: "clickable equipment-data-row", tabIndex: 0, onKeyDown: (event) => {
                            if (event.target === event.currentTarget &&
                                (event.key === "Enter" || event.key === " ")) {
                                event.preventDefault();
                                event.currentTarget.click();
                            }
                        }, onClick: () => show(e) },
                        React.createElement("td", null,
                            React.createElement("div", { className: "equipment-list-photo" },
                                photoId ? (React.createElement("img", { src: `/api/files/${photoId}?preview=1`, alt: `${displayModel(e)} 대표 이미지`, loading: "lazy" })) : (React.createElement(Package, { size: 22 })),
                                e.featured && (React.createElement("span", { title: "\uD2B9\uBCC4 \uC0C1\uD488" },
                                    React.createElement(Star, { size: 14, fill: "currentColor" }))))),
                        React.createElement("td", null,
                            React.createElement("strong", null, e.maker || "—"),
                            React.createElement("small", null, [e.productClass, e.productSubclass]
                                .filter(Boolean)
                                .join(" / ") || "분류 미입력")),
                        React.createElement("td", null,
                            React.createElement("strong", null,
                                displayModel(e),
                                " ",
                                React.createElement(LockMark, { item: e }))),
                        React.createElement("td", { className: "nowrap" }, e.manufacturedYear
                            ? `${e.manufacturedYear}${e.manufacturedMonth ? `.${e.manufacturedMonth}` : ""}`
                            : "연식 미입력"),
                        React.createElement("td", { className: "nowrap" }, e.capacityTons ? `${fmt(e.capacityTons)} TON` : "—"),
                        React.createElement("td", { className: "nowrap" }, e.stage || "—"),
                        React.createElement("td", null,
                            React.createElement("span", null, purchase.terms || "—"),
                            React.createElement("small", null, purchase.amount || "금액 미입력")),
                        React.createElement("td", null,
                            React.createElement("span", null, sale.terms || "—"),
                            React.createElement("small", null, sale.amount || "판매가 미입력")),
                        React.createElement("td", null,
                            React.createElement("strong", { className: "mono" }, e.number),
                            React.createElement("small", null, e.advertisingNumbers || "광고번호 없음")),
                        React.createElement("td", null,
                            React.createElement("span", null, e.originCountry || "—"),
                            React.createElement("small", null, e.storagePlace || "보관 장소 미입력")),
                        React.createElement("td", null, companies.length
                            ? companies.map((name) => (React.createElement("small", { key: name }, name)))
                            : "—"),
                        React.createElement("td", null,
                            React.createElement(Badge, null, e.listingStatus || "미지정"),
                            React.createElement("small", null,
                                equipmentStatus(e.id, state.deals, e),
                                " \u00B7",
                                " ",
                                e.stage || "단계 미입력"),
                            React.createElement("small", null,
                                "\uD648\uD398\uC774\uC9C0 ",
                                e.visibility || "미정")),
                        React.createElement("td", { className: "subtle nowrap" }, date(e.registeredOn || e.createdAt)),
                        React.createElement("td", { className: "memo-preview" },
                            React.createElement("button", { type: "button", className: "memo-preview-button", title: memoText, "aria-label": `메모 전체 보기: ${memoText}`, onClick: (event) => {
                                    event.stopPropagation();
                                    open(e.locked ? (React.createElement(UnlockDialog, { type: "equipment", item: e })) : (React.createElement(EquipmentMemoPreview, { equipment: e, memoText: memoText, memoCount: memoCounts.get(e.id) || 0 })));
                                } },
                                React.createElement("strong", null,
                                    memoCounts.get(e.id) || 0,
                                    "\uAC74"),
                                React.createElement("small", null, memoText))),
                        React.createElement("td", null,
                            React.createElement(ChevronRight, { size: 16 }))));
                })))) : (rows.slice((page - 1) * 20, page * 20).map((e) => {
                const photoId = firstPhotos.get(e.id);
                return (React.createElement("button", { key: e.id, className: "equipment-card", onClick: () => show(e) },
                    React.createElement("div", { className: "equipment-card-art" },
                        photoId ? (React.createElement("img", { src: `/api/files/${photoId}?preview=1`, alt: `${displayModel(e)} 대표 이미지`, loading: "lazy" })) : (React.createElement(Package, { size: 44 })),
                        e.featured && (React.createElement(Star, { className: "equipment-featured", size: 18, fill: "currentColor" })),
                        !e.locked && (React.createElement(Badge, null, equipmentStatus(e.id, state.deals, e)))),
                    React.createElement("div", null,
                        React.createElement("small", null,
                            e.maker || "메이커 미입력",
                            " \u00B7",
                            " ",
                            [e.productClass, e.productSubclass]
                                .filter(Boolean)
                                .join(" / ") || "분류 미입력"),
                        React.createElement("h3", null, displayModel(e)),
                        React.createElement("p", { className: "mono" },
                            e.number,
                            " \u00B7 ",
                            e.manufacturedYear || "연식 미입력"),
                        React.createElement("p", null, [e.originCountry, e.storagePlace]
                            .filter(Boolean)
                            .join(" · ") || "위치 미입력"),
                        React.createElement("p", null,
                            e.saleTerms || "판매조건 미입력",
                            " \u00B7",
                            " ",
                            e.listingStatus || "상태 미지정"),
                        React.createElement("div", { className: "card-bottom" },
                            React.createElement(Badge, null, e.stage),
                            React.createElement("strong", null,
                                "\uBA54\uBAA8 ",
                                memoCounts.get(e.id) || 0,
                                "\uAC74")))));
            }))),
            !rows.length && (React.createElement(Empty, { title: "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uC124\uBE44\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4", description: "\uAC80\uC0C9\uC5B4 \uB610\uB294 \uD544\uD130\uB97C \uBCC0\uACBD\uD574 \uBCF4\uC138\uC694." })),
            React.createElement(Pagination, { total: rows.length, page: page, onChange: setPage }))));
}
function EquipmentMemoPreview({ equipment, memoText, memoCount }) {
    const { close } = useApp();
    return (React.createElement(Modal, { title: `${displayModel(equipment)} 메모`, subtitle: `${equipment.number || "등록번호 없음"} · 업무 메모 ${memoCount}건`, onClose: close },
        React.createElement("div", { className: "modal-body" },
            React.createElement("div", { className: "equipment-memo-full" }, memoText)),
        React.createElement("footer", { className: "modal-foot" },
            React.createElement(Button, { onClick: close }, "\uB2EB\uAE30"))));
}
export function CurrencyFields({ value, onChange, amountKey, hideAmount = false, }) {
    const { notify } = useApp();
    const [busy, setBusy] = useState(false);
    const set = (k, v) => onChange({ ...value, [k]: v });
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "form-grid three" },
            !hideAmount && (React.createElement(Field, { label: "\uB9E4\uC785 \uAE08\uC561", required: true },
                React.createElement("input", { type: "number", min: "0", step: value.currency === "USD" ? ".01" : "1", required: true, value: value[amountKey], onChange: (e) => set(amountKey, e.target.value) }))),
            React.createElement(Field, { label: "\uD1B5\uD654" },
                React.createElement("select", { value: value.currency, onChange: (e) => onChange({
                        ...value,
                        currency: e.target.value,
                        fx: e.target.value === "KRW" ? 1 : "",
                        fxSource: "직접 입력",
                    }) }, ["KRW", "USD", "JPY"].map((c) => (React.createElement("option", { key: c }, c))))),
            React.createElement(Field, { label: "\uBD80\uAC00\uC138" },
                React.createElement("select", { value: value.vat, onChange: (e) => set("vat", e.target.value) },
                    React.createElement("option", { value: "excluded" }, "\uBCC4\uB3C4"),
                    React.createElement("option", { value: "included" }, "\uD3EC\uD568"),
                    React.createElement("option", { value: "none" }, "\uBBF8\uC801\uC6A9"))),
            React.createElement(Field, { label: "\uC138\uC728 (%)" },
                React.createElement("input", { type: "number", min: "0", max: "100", step: ".1", value: value.taxRate, disabled: value.vat === "none", onChange: (e) => set("taxRate", e.target.value) }))),
        value.currency !== "KRW" && (React.createElement("div", { className: "exchange-box" },
            React.createElement(Field, { label: `1 ${value.currency} = 원화`, required: true },
                React.createElement("input", { type: "number", min: "0.000001", step: "any", required: true, value: value.fx, onChange: (e) => onChange({
                        ...value,
                        fx: e.target.value,
                        fxSource: "직접 입력",
                        fxDate: new Date().toISOString().slice(0, 10),
                    }) })),
            React.createElement(Button, { type: "button", small: true, icon: RotateCw, loading: busy, onClick: async () => {
                    setBusy(true);
                    try {
                        const r = await request("/api/rates");
                        onChange({
                            ...value,
                            fx: Number(r.rates[value.currency].toFixed(6)),
                            fxDate: r.date,
                            fxSource: r.source,
                        });
                        if (r.stale)
                            notify("최근 저장된 환율입니다. 기준일을 확인해 주세요.", "warning");
                    }
                    catch (e) {
                        notify(e.message, "warning");
                    }
                    finally {
                        setBusy(false);
                    }
                } }, "\uD658\uC728 \uBD88\uB7EC\uC624\uAE30"),
            React.createElement("small", null,
                value.fxSource || "직접 입력",
                " \u00B7 ",
                value.fxDate || "기준일 미정")))));
}
export function EquipmentForm({ item }) {
    const { state, category, act, close, open, notify, reload } = useApp();
    const [form, set] = useState(item
        ? { ...item }
        : {
            model: "",
            number: "",
            categoryId: category.id,
            stage: "공장",
            buy: "",
            currency: "KRW",
            vat: "excluded",
            taxRate: 10,
            fx: 1,
            note: "",
            video: "",
            manufacturedYear: "",
            manufacturedMonth: "",
            dimensions: "",
            dimensionLengthMm: "",
            dimensionWidthMm: "",
            dimensionHeightMm: "",
            weightTons: "",
            originCountry: "",
            storagePlace: "",
            inspectionStatus: "",
            testRunStatus: "",
            similarEquipmentIds: [],
            featured: false,
        }), [pendingFiles, setPendingFiles] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(""), [dirty, setDirty] = useState(false);
    const change = (k, v) => {
        set({ ...form, [k]: v });
        setDirty(true);
    };
    return (React.createElement(Modal, { title: item ? "상품 정보 수정" : "새 상품 등록", subtitle: "\uC2E4\uBB3C \uC124\uBE44 \uD55C \uB300\uB97C \uD558\uB098\uC758 \uC0C1\uD488\uC73C\uB85C \uB4F1\uB85D\uD569\uB2C8\uB2E4.", onClose: close, dirty: dirty },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    const eid = await act({
                        action: "save",
                        type: "equipment",
                        targetId: item?.id,
                        version: item?.version,
                        data: form,
                    });
                    let uploadFailures = 0;
                    for (const file of pendingFiles) {
                        try {
                            const body = new FormData();
                            body.append("file", file);
                            body.append("categoryId", form.categoryId);
                            body.append("targetId", eid);
                            body.append("targetType", "equipment");
                            await request("/api/upload", { method: "POST", body });
                        }
                        catch {
                            uploadFailures++;
                        }
                    }
                    if (pendingFiles.length && !uploadFailures)
                        notify(`${pendingFiles.length}개 이미지·첨부파일을 등록했습니다.`);
                    if (pendingFiles.length) {
                        try {
                            await reload();
                        }
                        catch {
                            notify("파일 등록은 완료됐습니다. 화면을 새로고침해 확인해 주세요.");
                        }
                    }
                    if (uploadFailures)
                        notify(`상품은 저장됐지만 파일 ${uploadFailures}개를 다시 확인해 주세요.`);
                    open(React.createElement(EquipmentDetail, { id: eid }));
                }
                catch (e) {
                    setError(e.message);
                }
                finally {
                    setBusy(false);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement("div", { className: "form-grid" },
                    React.createElement(Field, { label: "\uBAA8\uB378\uBA85", required: true },
                        React.createElement("input", { autoFocus: true, required: true, value: form.model, onChange: (e) => change("model", e.target.value), placeholder: "\uC608: AIDA NC1-200(D)" })),
                    React.createElement(Field, { label: "\uB4F1\uB85D\uBC88\uD638", required: true, hint: "\uC9C1\uC811 \uC785\uB825 \u00B7 \uB3D9\uC77C\uD55C \uBC88\uD638\uB294 \uB4F1\uB85D\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." },
                        React.createElement("input", { required: true, value: form.number, onChange: (e) => change("number", e.target.value), placeholder: "\uC608: SEIN-U-2601" }))),
                React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", checked: !!form.featured, onChange: (e) => change("featured", e.target.checked) }),
                    "\uD2B9\uBCC4 \uC0C1\uD488\uC73C\uB85C \uD45C\uC2DC"),
                React.createElement(ProfileFields, { fields: equipmentFields, value: form, onChange: (v) => {
                        set(v);
                        setDirty(true);
                    } }),
                React.createElement(Field, { label: "\uD604\uC7AC \uBB3C\uB958 \uB2E8\uACC4" },
                    React.createElement("select", { value: form.stage, onChange: (e) => change("stage", e.target.value) }, STAGES.map((s) => (React.createElement("option", { key: s }, s))))),
                React.createElement("div", { className: "form-section-title" }, "\uB9E4\uC785 \uC815\uBCF4"),
                item?.purchaseUnverified && (React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", checked: form.purchaseUnverified === false, onChange: (e) => change("purchaseUnverified", !e.target.checked) }),
                    "\uC544\uB798 \uB9E4\uC785 \uAE08\uC561\uACFC \uD1B5\uD654\u00B7\uC138\uAE08\u00B7\uD658\uC728\uC744 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4.")),
                React.createElement(Field, { label: "\uBA54\uC77C \uACF5\uAC1C\uC6A9 \uC0AC\uC591", hint: "\uBA54\uC77C \uBC1C\uC1A1 \uD654\uBA74\uC5D0 \uC790\uB3D9 \uC785\uB825\uD560 \uACF5\uD1B5 \uC0AC\uC591\uC785\uB2C8\uB2E4. \uB0B4\uBD80 \uBA54\uBAA8\uC640 \uAC00\uACA9\uC740 \uB123\uC9C0 \uB9C8\uC138\uC694." },
                    React.createElement("textarea", { rows: 4, maxLength: 5000, value: form.publicSpec || "", onChange: (e) => change("publicSpec", e.target.value) })),
                React.createElement(CurrencyFields, { value: form, amountKey: "buy", onChange: (v) => {
                        set(v);
                        setDirty(true);
                    } }),
                React.createElement(Field, { label: "\uC0AC\uC591 \uBC0F \uC5C5\uBB34 \uBA54\uBAA8", hint: "\uD1A4\uC218\u00B7\uC81C\uC870\uC5F0\uB3C4 \uB4F1\uC740 \uD544\uC694\uD55C \uB9CC\uD07C \uC790\uC720\uB86D\uAC8C \uC791\uC131\uD558\uC138\uC694." },
                    React.createElement("textarea", { rows: 4, value: form.note, onChange: (e) => change("note", e.target.value), placeholder: "\uD1A4\uC218, \uC81C\uC870\uC5F0\uB3C4, \uC2A4\uD2B8\uB85C\uD06C, \uBCF4\uAD00 \uC704\uCE58 \uB4F1" })),
                React.createElement("section", { className: "legacy-product-fields" },
                    React.createElement("div", { className: "form-section-title" }, "\uAD6C\uBC84\uC804 \uAE30\uBCF8 \uC0AC\uC591"),
                    React.createElement("p", { className: "hint" }, "\uAD6C\uBC84\uC804 \uC0C1\uD488\uB4F1\uB85D\uC5D0\uC11C \uC0AC\uC6A9\uD558\uB358 \uD56D\uBAA9\uC744 \uBE60\uC9D0\uC5C6\uC774 \uC785\uB825\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."),
                    React.createElement("div", { className: "form-grid" },
                        React.createElement(Field, { label: "\uC81C\uC870\uC5F0\uC6D4" },
                            React.createElement("div", { className: "mission-toolbar" },
                                React.createElement("input", { inputMode: "numeric", maxLength: 4, value: form.manufacturedYear || "", onChange: (e) => change("manufacturedYear", e.target.value), placeholder: "\uC608: 2018" }),
                                React.createElement("input", { inputMode: "numeric", maxLength: 2, value: form.manufacturedMonth || "", onChange: (e) => change("manufacturedMonth", e.target.value), placeholder: "\uC6D4" }))),
                        React.createElement(Field, { label: "\uC124\uBE44 \uD06C\uAE30 \uD1B5\uD569 \uD45C\uAE30" },
                            React.createElement("input", { value: form.dimensions || "", onChange: (e) => change("dimensions", e.target.value), placeholder: "\uC608: 4500 \u00D7 2200 \u00D7 3200 mm" })),
                        React.createElement(Field, { label: "\uC124\uBE44 \uC0AC\uC774\uC988 L (mm)" },
                            React.createElement("input", { inputMode: "decimal", value: form.dimensionLengthMm || "", onChange: (e) => change("dimensionLengthMm", e.target.value) })),
                        React.createElement(Field, { label: "\uC124\uBE44 \uC0AC\uC774\uC988 W (mm)" },
                            React.createElement("input", { inputMode: "decimal", value: form.dimensionWidthMm || "", onChange: (e) => change("dimensionWidthMm", e.target.value) })),
                        React.createElement(Field, { label: "\uC124\uBE44 \uC0AC\uC774\uC988 H (mm)" },
                            React.createElement("input", { inputMode: "decimal", value: form.dimensionHeightMm || "", onChange: (e) => change("dimensionHeightMm", e.target.value) })),
                        React.createElement(Field, { label: "\uC124\uBE44 \uC911\uB7C9" },
                            React.createElement("input", { value: form.weightTons || "", onChange: (e) => change("weightTons", e.target.value), placeholder: "\uC608: 35 ton" })),
                        React.createElement(Field, { label: "\uBCF4\uAD00 \uC7A5\uC18C" },
                            React.createElement("input", { value: form.storagePlace || "", onChange: (e) => change("storagePlace", e.target.value), placeholder: "\uC608: Factory / Warehouse" })),
                        React.createElement(Field, { label: "\uAC80\uC218 \u00B7 \uC2DC\uC6B4\uC804" },
                            React.createElement("div", { className: "mission-toolbar" },
                                React.createElement("select", { value: form.inspectionStatus || "", onChange: (e) => change("inspectionStatus", e.target.value) },
                                    React.createElement("option", { value: "" }, "\uAC80\uC218 \uBBF8\uC785\uB825"),
                                    React.createElement("option", null, "\uAC80\uC218\uC644\uB8CC"),
                                    React.createElement("option", null, "\uBBF8\uAC80\uC218")),
                                React.createElement("select", { value: form.testRunStatus || "", onChange: (e) => change("testRunStatus", e.target.value) },
                                    React.createElement("option", { value: "" }, "\uC2DC\uC6B4\uC804 \uBBF8\uC785\uB825"),
                                    React.createElement("option", null, "\uC2DC\uC6B4\uC804\uC644\uB8CC"),
                                    React.createElement("option", null, "\uBBF8\uC2DC\uC6B4\uC804")))))),
                React.createElement("section", { className: "legacy-product-fields" },
                    React.createElement("div", { className: "form-section-title" }, "\uC774\uBBF8\uC9C0\u00B7\uCCA8\uBD80\u00B7\uC5F0\uACB0 \uC815\uBCF4"),
                    React.createElement(Field, { label: "\uC0C1\uD488 \uC774\uBBF8\uC9C0 \uBC0F \uCCA8\uBD80\uD30C\uC77C", hint: "\uC774\uBBF8\uC9C0\uC640 PDF\u00B7\uBB38\uC11C \uB4F1\uC744 \uC5EC\uB7EC \uAC1C \uACE0\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC0C1\uD488 \uC800\uC7A5\uACFC \uD568\uAED8 \uC5F0\uACB0\uB429\uB2C8\uB2E4. \uD30C\uC77C\uB2F9 \uCD5C\uB300 50MB." },
                        React.createElement("input", { type: "file", multiple: true, onChange: (e) => {
                                setPendingFiles([...e.target.files]);
                                setDirty(true);
                            } }),
                        !!pendingFiles.length && (React.createElement("small", null,
                            pendingFiles.length,
                            "\uAC1C \uD30C\uC77C \uC120\uD0DD\uB428"))),
                    React.createElement(Field, { label: "\uC720\uC0AC\uC124\uBE44 \uC120\uD0DD", hint: "Ctrl \uB610\uB294 Command\uB97C \uB204\uB978 \uCC44 \uC5EC\uB7EC \uC0C1\uD488\uC744 \uC120\uD0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." },
                        React.createElement("select", { multiple: true, size: 6, value: form.similarEquipmentIds || [], onChange: (e) => change("similarEquipmentIds", [...e.target.selectedOptions].map((option) => option.value)) }, state.equipment
                            .filter((equipment) => equipment.id !== item?.id && !equipment.locked)
                            .map((equipment) => (React.createElement("option", { key: equipment.id, value: equipment.id },
                            equipment.maker || "메이커 미입력",
                            " \u00B7 ",
                            equipment.model,
                            " \u00B7",
                            " ",
                            equipment.number))))),
                    React.createElement(Field, { label: "YouTube / Vimeo \uC8FC\uC18C" },
                        React.createElement("input", { type: "url", value: form.video, onChange: (e) => change("video", e.target.value), placeholder: "https://\u2026" }))),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy, icon: Save }, item ? "변경 저장" : "상품 등록")))));
}
export function EquipmentDetail({ id }) {
    const { state, open, close, act, allowed, navigate, category } = useApp();
    const [tab, setTab] = useState("memo");
    const e = state.equipment.find((x) => x.id === id);
    if (!e)
        return null;
    const linked = state.deals.filter((d) => d.lines.some((x) => x.equipmentId === id));
    return (React.createElement(Modal, { title: e.model, subtitle: e.number, wide: true, drawer: true, onClose: close },
        React.createElement("div", { className: "detail-summary" },
            React.createElement("div", null,
                React.createElement(Badge, null, equipmentStatus(e.id, state.deals, e)),
                React.createElement(Badge, null, e.stage),
                React.createElement(LockMark, { item: e })),
            React.createElement("div", { className: "actions" },
                allowed("mail", "create") && (React.createElement(Button, { small: true, icon: Send, onClick: () => {
                        navigate("mail", category.id, { productId: e.id });
                    } }, "\uC774 \uC0C1\uD488\uC73C\uB85C \uBA54\uC77C \uC791\uC131")),
                allowed("locks", "edit") && (React.createElement(Button, { small: true, icon: LockKeyhole, onClick: () => open(React.createElement(LockDialog, { type: "equipment", item: e })) }, "\uC811\uADFC \uC124\uC815")),
                allowed("equipment", "edit") && (React.createElement(Button, { small: true, icon: Pencil, onClick: () => open(React.createElement(EquipmentForm, { item: e })) }, "\uC815\uBCF4 \uC218\uC815")),
                allowed("equipment", "delete") && (React.createElement(IconButton, { icon: Trash2, label: "\uC124\uBE44 \uC0AD\uC81C", onClick: () => open(React.createElement(ConfirmDialog, { title: "\uC124\uBE44\uB97C \uD734\uC9C0\uD1B5\uC73C\uB85C \uC774\uB3D9\uD560\uAE4C\uC694?", description: "\uC601\uC5C5 \uC774\uB825\uC774 \uC5F0\uACB0\uB41C \uC124\uBE44\uB294 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", label: "\uD734\uC9C0\uD1B5 \uC774\uB3D9", danger: true, onConfirm: () => act({
                            action: "delete",
                            type: "equipment",
                            targetId: e.id,
                            version: e.version,
                        }) })) })))),
        React.createElement(Tabs, { value: tab, onChange: setTab, items: [
                ["memo", "사양 · 메모"],
                ["photos", "사진 · 영상"],
                ["files", "첨부 자료"],
                ["deals", "영업 이력", linked.length],
                ["costs", "내부 비용"],
            ] }),
        React.createElement("div", { className: "modal-body detail-body" },
            tab === "memo" && (React.createElement(React.Fragment, null,
                React.createElement(ProfileSummary, { fields: equipmentFields, value: e, state: state }),
                !!e.legacyTransactions?.length && (React.createElement("details", null,
                    React.createElement("summary", null,
                        "\uAD6C\uBC84\uC804 \uAC70\uB798\uCC98\u00B7\uAC00\uACA9 \uC774\uB825 ",
                        e.legacyTransactions.length,
                        "\uAC74"),
                    React.createElement("p", { className: "hint" }, "\uC6D0\uBCF8\uC758 \uC18C\uAC1C\u00B7\uD310\uB9E4 \uAD00\uACC4\uC785\uB2C8\uB2E4. \uD655\uC815 \uB9E4\uC785\u00B7\uB9E4\uCD9C\uC5D0 \uC790\uB3D9 \uBC18\uC601\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."),
                    React.createElement("div", { className: "table-scroll" },
                        React.createElement("table", null,
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "\uC18C\uAC1C \uAC70\uB798\uCC98"),
                                    React.createElement("th", null, "\uD310\uB9E4 \uACE0\uAC1D\uC0AC"),
                                    React.createElement("th", null, "\uAD6C\uB9E4 \uC870\uAC74"),
                                    React.createElement("th", null, "\uD310\uB9E4 \uC870\uAC74"))),
                            React.createElement("tbody", null, e.legacyTransactions.map((t, i) => (React.createElement("tr", { key: t.legacyId || i },
                                React.createElement("td", null, state.customers.some((c) => c.id === t.introducedCustomerId) ? (React.createElement("button", { className: "text-button", onClick: () => open(React.createElement(CustomerDetail, { id: t.introducedCustomerId })) }, companyName(state, t.introducedCustomerId))) : ("—")),
                                React.createElement("td", null, state.customers.some((c) => c.id === t.buyerId) ? (React.createElement("button", { className: "text-button", onClick: () => open(React.createElement(CustomerDetail, { id: t.buyerId })) }, companyName(state, t.buyerId))) : ("—")),
                                React.createElement("td", null,
                                    t.buyTerms,
                                    " ",
                                    t.buyPlace,
                                    React.createElement("small", null,
                                        t.buyCurrency,
                                        " ",
                                        t.buyPrice)),
                                React.createElement("td", null,
                                    t.sellTerms,
                                    " ",
                                    t.sellPlace,
                                    React.createElement("small", null,
                                        t.sellCurrency,
                                        " ",
                                        t.sellPrice)))))))))),
                React.createElement("div", { className: "info-grid" },
                    React.createElement("div", null,
                        React.createElement("small", null, "\uB9E4\uC785 \uAE08\uC561"),
                        React.createElement("strong", null, e.purchaseUnverified
                            ? "확인 필요 (이관 자료)"
                            : `${fmt(e.buy)} ${e.currency}`)),
                    React.createElement("div", null,
                        React.createElement("small", null, "\uC6D0\uD654 \uACF5\uAE09\uAC00\uC561"),
                        React.createElement("strong", null, e.purchaseUnverified
                            ? "확인 필요"
                            : won(krwNet(e.buy, e.currency, e.vat, e.taxRate, e.fx)))),
                    React.createElement("div", null,
                        React.createElement("small", null, "\uD604\uC7AC \uB2E8\uACC4"),
                        React.createElement("strong", null, e.stage)),
                    React.createElement("div", null,
                        React.createElement("small", null, "\uCD5C\uADFC \uC218\uC815"),
                        React.createElement("strong", null, date(e.updatedAt)))),
                e.note && React.createElement("div", { className: "plain-note" }, e.note),
                (e.manufacturedYear ||
                    e.dimensions ||
                    e.weightTons ||
                    e.originCountry ||
                    e.storagePlace ||
                    e.inspectionStatus ||
                    e.testRunStatus) && (React.createElement(React.Fragment, null,
                    React.createElement("h3", null, "\uAE30\uBCF8 \uC0AC\uC591"),
                    React.createElement("div", { className: "info-grid" },
                        e.manufacturedYear && (React.createElement("div", null,
                            React.createElement("small", null, "\uC81C\uC870\uC5F0\uC6D4"),
                            React.createElement("strong", null,
                                e.manufacturedYear,
                                e.manufacturedMonth ? `-${e.manufacturedMonth}` : ""))),
                        e.dimensions && (React.createElement("div", null,
                            React.createElement("small", null, "\uC124\uBE44 \uD06C\uAE30"),
                            React.createElement("strong", null, e.dimensions))),
                        e.weightTons && (React.createElement("div", null,
                            React.createElement("small", null, "\uC124\uBE44 \uC911\uB7C9"),
                            React.createElement("strong", null, e.weightTons))),
                        e.originCountry && (React.createElement("div", null,
                            React.createElement("small", null, "\uC18C\uC7AC \uAD6D\uAC00"),
                            React.createElement("strong", null, e.originCountry))),
                        e.storagePlace && (React.createElement("div", null,
                            React.createElement("small", null, "\uBCF4\uAD00 \uC7A5\uC18C"),
                            React.createElement("strong", null, e.storagePlace))),
                        (e.inspectionStatus || e.testRunStatus) && (React.createElement("div", null,
                            React.createElement("small", null, "\uAC80\uC218 \u00B7 \uC2DC\uC6B4\uC804"),
                            React.createElement("strong", null, [e.inspectionStatus, e.testRunStatus]
                                .filter(Boolean)
                                .join(" · "))))))),
                React.createElement(MemoPanel, { type: "equipment", id: e.id, linked: linked.map((d) => d.id) }))),
            tab === "photos" && (React.createElement(React.Fragment, null,
                React.createElement(FilesPanel, { targetType: "equipment", targetId: e.id, photos: true }),
                e.video && (React.createElement("div", { className: "video-box" },
                    React.createElement("iframe", { src: safeEmbed(e.video), title: `${e.model} 동작 영상`, allowFullScreen: true, loading: "lazy", referrerPolicy: "strict-origin-when-cross-origin" }),
                    React.createElement("a", { href: e.video, target: "_blank", rel: "noreferrer" },
                        "\uC6D0\uBCF8 \uC601\uC0C1 \uC5F4\uAE30 ",
                        React.createElement(ExternalLink, { size: 13 })))))),
            tab === "files" && (React.createElement(FilesPanel, { targetType: "equipment", targetId: e.id })),
            tab === "deals" && (React.createElement("div", { className: "related-list" },
                linked.map((d) => (React.createElement("button", { key: d.id, onClick: () => open(React.createElement(DealDetail, { id: d.id })) },
                    React.createElement(Handshake, { size: 19 }),
                    React.createElement("span", null,
                        React.createElement("strong", null, d.name),
                        React.createElement("small", null,
                            companyName(state, d.customerId),
                            " \u00B7 ",
                            d.lines.length,
                            "\uB300")),
                    React.createElement(Badge, null, d.status),
                    React.createElement(ChevronRight, { size: 15 })))),
                !linked.length && React.createElement(Empty, { title: "\uC5F0\uACB0\uB41C \uC601\uC5C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" }))),
            tab === "costs" && React.createElement(CostsEditor, { item: e }))));
}
export function MemoPanel({ type, id, linked = [] }) {
    const { state, open, allowed } = useApp();
    const menu = type === "folders" ? "files" : type;
    const memos = state.memos.filter((m) => (m.targetType === type && m.targetId === id) ||
        (m.targetType === "deals" && linked.includes(m.targetId)));
    return (React.createElement("div", { className: "memo-panel" },
        React.createElement("div", { className: "section-heading" },
            React.createElement("h3", null,
                "\uC5C5\uBB34 \uBA54\uBAA8 ",
                React.createElement("span", null, memos.length)),
            allowed(menu, "edit") && (React.createElement(Button, { small: true, icon: Plus, onClick: () => open(React.createElement(MemoForm, { type: type, targetId: id })) }, "\uBA54\uBAA8 \uC791\uC131"))),
        memos.map((m) => (React.createElement("article", { className: "memo-item", key: m.id },
            React.createElement("div", { className: "memo-meta" },
                React.createElement("span", { className: "small-avatar" }, m.id.startsWith("legacy-")
                    ? "구"
                    : personName(state, m.createdBy).slice(0, 1)),
                React.createElement("strong", null, m.id.startsWith("legacy-")
                    ? "구버전 기록"
                    : personName(state, m.createdBy)),
                React.createElement("time", null, date(m.updatedAt)),
                m.targetType !== type && (React.createElement(Badge, { tone: "violet" }, "\uACF5\uC720 \uC601\uC5C5 \uBA54\uBAA8")),
                allowed(menu, "edit") &&
                    (state.me.role === "master" || m.createdBy === state.me.id) && (React.createElement("button", { className: "text-button", onClick: () => open(React.createElement(MemoForm, { type: m.targetType, targetId: m.targetId, item: m })) }, "\uC218\uC815"))),
            React.createElement("div", { className: "rich-content", dangerouslySetInnerHTML: { __html: m.body } }),
            React.createElement("div", { className: "tag-row" }, m.tags.map((t) => (React.createElement("span", { className: "tag", key: t },
                "#",
                t))))))),
        !memos.length && (React.createElement("div", { className: "quiet-empty" }, "\uC5C5\uBB34 \uC9C4\uD589 \uC0C1\uD669\uACFC \uD655\uC778\uD560 \uB0B4\uC6A9\uC744 \uB0A8\uACA8 \uC8FC\uC138\uC694."))));
}
function MemoForm({ type, targetId, item }) {
    const { act, close, state, category, reload, allowed } = useApp();
    const editor = useRef();
    const [tags, setTags] = useState(item?.tags || []), [busy, setBusy] = useState(false), [error, setError] = useState(""), [dirty, setDirty] = useState(false);
    useEffect(() => {
        editor.current.innerHTML = item?.body || "<p><br/></p>";
        editor.current.focus();
    }, []);
    const command = (cmd, arg) => {
        editor.current.focus();
        document.execCommand(cmd, false, arg);
        setDirty(true);
    };
    return (React.createElement(Modal, { title: item ? "메모 수정" : "메모 작성", onClose: close, dirty: dirty },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await act({
                        action: "save",
                        type: "memos",
                        targetId: item?.id,
                        version: item?.version,
                        data: {
                            targetType: type,
                            targetId,
                            body: editor.current.innerHTML,
                            tags,
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
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement("div", { className: "editor" },
                    React.createElement("div", { className: "editor-toolbar" },
                        React.createElement(IconButton, { icon: Bold, label: "\uAD75\uAC8C", onClick: () => command("bold") }),
                        React.createElement(IconButton, { icon: Italic, label: "\uAE30\uC6B8\uC784", onClick: () => command("italic") }),
                        React.createElement(IconButton, { icon: ListIcon, label: "\uBAA9\uB85D", onClick: () => command("insertUnorderedList") }),
                        React.createElement(IconButton, { icon: Link, label: "\uB9C1\uD06C \uC0BD\uC785", onClick: () => {
                                const url = prompt("링크 주소 (https://)");
                                if (url && /^https?:\/\//.test(url))
                                    command("createLink", url);
                            } }),
                        React.createElement("select", { "aria-label": "\uAE00\uAF34 \uD06C\uAE30", defaultValue: "3", onChange: (e) => command("fontSize", e.target.value) },
                            React.createElement("option", { value: "2" }, "\uC791\uAC8C"),
                            React.createElement("option", { value: "3" }, "\uBCF4\uD1B5"),
                            React.createElement("option", { value: "4" }, "\uD06C\uAC8C"))),
                    React.createElement("div", { ref: editor, role: "textbox", "aria-label": "\uBA54\uBAA8 \uB0B4\uC6A9", contentEditable: true, suppressContentEditableWarning: true, onInput: () => setDirty(true), onDragOver: (e) => {
                            if (allowed("files", "upload"))
                                e.preventDefault();
                        }, onDrop: async (e) => {
                            e.preventDefault();
                            if (!allowed("files", "upload"))
                                return;
                            const files = [...e.dataTransfer.files];
                            setBusy(true);
                            try {
                                for (const file of files) {
                                    if (file.size > 50_000_000)
                                        throw Error("파일당 최대 50MB까지 업로드할 수 있습니다.");
                                    const body = new FormData();
                                    body.append("file", file);
                                    body.append("categoryId", category.id);
                                    body.append("targetType", type);
                                    body.append("targetId", targetId);
                                    const saved = await request("/api/upload", {
                                        method: "POST",
                                        body,
                                    });
                                    const p = document.createElement("p"), link = document.createElement("a");
                                    link.href = "/api/files/" + saved.id;
                                    link.textContent = file.name;
                                    p.append(link);
                                    editor.current.append(p);
                                }
                                await reload();
                                setDirty(true);
                            }
                            catch (error) {
                                setError(error.message);
                            }
                            finally {
                                setBusy(false);
                            }
                        }, onPaste: (e) => {
                            e.preventDefault();
                            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
                            setDirty(true);
                        }, className: "rich-editor" }),
                    allowed("files", "upload") && (React.createElement("div", { className: "editor-attachment-hint" }, "\uD30C\uC77C\uC744 \uBA54\uBAA8\uC5D0 \uB04C\uC5B4 \uB193\uC544 \uCCA8\uBD80\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \u00B7 \uCD5C\uB300 50MB"))),
                React.createElement(Field, { label: "\uD0DC\uADF8" },
                    React.createElement("div", { className: "tag-select" }, state.tags.map((t) => (React.createElement("button", { type: "button", key: t, className: tags.includes(t) ? "selected" : "", onClick: () => setTags(tags.includes(t)
                            ? tags.filter((x) => x !== t)
                            : [...tags, t]) },
                        "#",
                        t))))),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uBA54\uBAA8 \uC800\uC7A5")))));
}
function CostsEditor({ item }) {
    const { act, allowed } = useApp();
    const [baseVersion, setBaseVersion] = useState(item.version);
    const [rows, setRows] = useState(item.costs ||
        ["운송·통관", "수리·정비", "보관·창고"].map((name) => ({
            name,
            estimated: "",
            actual: "",
        }))), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    const [savedRows, setSavedRows] = useState(() => JSON.stringify(rows));
    const dirty = JSON.stringify(rows) !== savedRows;
    useUnsaved(dirty);
    const calculate = (v) => {
        if (!v)
            return 0;
        try {
            return evaluateCell([[String(v).startsWith("=") ? v : `=${v}`]], 0, 0);
        }
        catch (e) {
            return e.message;
        }
    };
    return (React.createElement("div", { "data-unsaved": dirty },
        React.createElement("p", { className: "hint" }, "\uB0B4\uBD80 \uAC80\uD1A0\uC6A9\uC785\uB2C8\uB2E4. \uACE0\uAC1D \uACAC\uC801\uC11C\uC640 \uB300\uC2DC\uBCF4\uB4DC \uC218\uC775\uC5D0\uB294 \uD3EC\uD568\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."),
        React.createElement("table", { className: "cost-table" },
            React.createElement("thead", null,
                React.createElement("tr", null,
                    React.createElement("th", null, "\uD56D\uBAA9"),
                    React.createElement("th", null, "\uC608\uC0C1 \uBE44\uC6A9 (\uC6D0)"),
                    React.createElement("th", null, "\uC2E4\uC81C \uBE44\uC6A9 (\uC6D0)"),
                    React.createElement("th", null))),
            React.createElement("tbody", null, rows.map((r, i) => (React.createElement("tr", { key: i },
                ["name", "estimated", "actual"].map((k) => (React.createElement("td", { key: k },
                    React.createElement("input", { "aria-label": `${i + 1}행 ${k}`, readOnly: busy || !allowed("equipment", "edit"), value: r[k], placeholder: k === "name" ? "항목명" : "예: 1200000+300000", onChange: (e) => setRows(rows.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x)) }),
                    k !== "name" && r[k] && (React.createElement("small", null, typeof calculate(r[k]) === "number"
                        ? won(calculate(r[k]))
                        : calculate(r[k])))))),
                React.createElement("td", null, allowed("equipment", "edit") && (React.createElement(IconButton, { icon: X, label: "\uD56D\uBAA9 \uC0AD\uC81C", disabled: busy, onClick: () => setRows(rows.filter((_, j) => j !== i)) })))))))),
        React.createElement(ErrorNote, { error: error }),
        allowed("equipment", "edit") && (React.createElement("div", { className: "actions spread" },
            React.createElement(Button, { small: true, icon: Plus, disabled: busy, onClick: () => setRows([...rows, { name: "", estimated: "", actual: "" }]) }, "\uD56D\uBAA9 \uCD94\uAC00"),
            React.createElement(Button, { primary: true, loading: busy, onClick: async () => {
                    setBusy(true);
                    setError("");
                    try {
                        await act({
                            action: "costs",
                            type: "equipment",
                            targetId: item.id,
                            version: baseVersion,
                            data: { rows },
                        });
                        setBaseVersion((v) => v + 1);
                        setSavedRows(JSON.stringify(rows));
                    }
                    catch (e) {
                        setError(e.message);
                    }
                    finally {
                        setBusy(false);
                    }
                } }, "\uBE44\uC6A9 \uC800\uC7A5")))));
}
const CUSTOMER_TABLE_COLUMNS = [
    ["number", "번호"],
    ["importance", "중요도"],
    ["group", "그룹 / 고객 구분"],
    ["department", "부서 / 직함"],
    ["phone", "전화번호"],
    ["email", "이메일"],
    ["interest", "주요 취급품목"],
    ["wanted", "관심 설비 / 톤수"],
    ["date", "등록일"],
    ["receive", "수신 여부"],
    ["memo", "메모"],
    ["deals", "영업 건"],
];
const DEFAULT_CUSTOMER_COLUMNS = CUSTOMER_TABLE_COLUMNS.map(([key]) => key);
export function CustomersPage() {
    const { state, open, allowed, notify } = useApp();
    const [page, setPage] = useViewState("page", 1);
    const [detailFilters, setDetailFilters] = useViewState("filters", {});
    const [sort, setSort] = useViewState("sort", {
        key: "date",
        direction: "desc",
    });
    const [q, setQ] = useViewState("query", ""), [selected, setSelected] = useState([]), [filter, setFilter] = useViewState("filter", "all"), [emailFilter, setEmailFilter] = useViewState("email", "all"), [groupFilter, setGroupFilter] = useViewState("group", "__all__"), [originFilter, setOriginFilter] = useViewState("origin", "all"), [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("sein-customer-columns") || "null");
            return Array.isArray(saved) ? saved : DEFAULT_CUSTOMER_COLUMNS;
        }
        catch {
            return DEFAULT_CUSTOMER_COLUMNS;
        }
    });
    const columnVisible = (key) => visibleColumns.includes(key);
    const toggleColumn = (key) => {
        const next = columnVisible(key)
            ? visibleColumns.filter((column) => column !== key)
            : [...visibleColumns, key];
        setVisibleColumns(next);
        localStorage.setItem("sein-customer-columns", JSON.stringify(next));
    };
    const customerGroups = useMemo(() => customerGroupSummary(state.customers), [state.customers]);
    const countryOptions = useMemo(() => countryOptionsFromCustomers(state.customers), [state.customers]);
    const groupNames = customerGroups
        .filter((group) => group.name)
        .map((group) => group.name);
    const customerMemos = useMemo(() => {
        const counts = new Map();
        const latest = new Map();
        for (const memo of state.memos) {
            if (memo.targetType !== "customers" || memo.deletedAt)
                continue;
            counts.set(memo.targetId, (counts.get(memo.targetId) || 0) + 1);
            const previous = latest.get(memo.targetId);
            if (!previous || memo.updatedAt > previous.updatedAt)
                latest.set(memo.targetId, memo);
        }
        return { counts, latest };
    }, [state.memos]);
    const customerStats = useMemo(() => {
        const imported = state.customers.filter((c) => c.legacySourceId).length;
        return {
            total: state.customers.length,
            imported,
            existing: state.customers.length - imported,
            withEmail: state.customers.filter((c) => c.contacts.some((p) => p.email))
                .length,
            available: state.customers.filter((c) => !c.blocked && c.contacts.some((p) => validEmail(p.email))).length,
            blocked: state.customers.filter((c) => c.blocked).length,
            groups: customerGroups.filter((group) => group.name).length,
        };
    }, [state.customers, customerGroups]);
    const customerDealCounts = useMemo(() => {
        const counts = new Map();
        for (const deal of state.deals) {
            if (!deal.customerId)
                continue;
            counts.set(deal.customerId, (counts.get(deal.customerId) || 0) + 1);
        }
        return counts;
    }, [state.deals]);
    const indexed = useMemo(() => state.customers.map((c) => ({
        ...c,
        title: c.name,
        searchText: searchableText(state, "customers", c),
    })), [state.customers, state.memos, state.files]);
    useResetOnChange(() => setPage(1), [q, filter, emailFilter, groupFilter, originFilter, detailFilters, sort]);
    const customerSortValue = (record) => {
        const contact = record.contacts[0] || {};
        const values = {
            number: record.legacySourceId || "",
            importance: Number(record.importance || 0),
            group: `${record.groupName || ""} ${record.kind || ""}`,
            person: contact.name || "",
            company: record.name || "",
            country: record.country || "",
            department: `${contact.department || ""} ${contact.position || ""}`,
            phone: contact.phone || "",
            email: contact.email || "",
            interest: `${record.interestClass || ""} ${record.interestSubclass || ""} ${record.productInterest || ""}`,
            wanted: `${record.wantedClass || ""} ${record.wantedSubclass || ""} ${record.wantedTonsMin || ""} ${record.wantedTonsMax || ""}`,
            date: record.registeredOn || record.createdAt || "",
            receive: record.blocked ? 0 : 1,
            memo: (customerMemos.counts.get(record.id) || 0) +
                Number(Boolean(record.note)),
            deals: customerDealCounts.get(record.id) || 0,
        };
        return values[sort.key];
    };
    const customerMatches = (q.trim() ? rankSearch(q, indexed, Infinity) : indexed).filter((c) => matchesFilters({
        ...c,
        person: c.contacts.map((p) => p.name).join(" "),
        department: c.contacts.map((p) => p.department).join(" "),
        position: c.contacts.map((p) => p.position).join(" "),
        phone: c.contacts.map((p) => p.phone).join(" "),
        email: c.contacts.map((p) => p.email).join(" "),
    }, detailFilters) &&
        (filter === "all" ||
            (filter === "blocked" && c.blocked) ||
            (filter === "normal" &&
                !c.blocked &&
                c.contacts.some((p) => validEmail(p.email)))) &&
        (emailFilter === "all" ||
            (emailFilter === "with" && c.contacts.some((p) => p.email)) ||
            (emailFilter === "without" && !c.contacts.some((p) => p.email))) &&
        (groupFilter === "__all__" ||
            (groupFilter === "__ungrouped__"
                ? !String(c.groupName || "").trim()
                : String(c.groupName || "").trim() === groupFilter)) &&
        (originFilter === "all" ||
            (originFilter === "legacy" && c.legacySourceId) ||
            (originFilter === "review" && !c.legacySourceId)));
    const rows = sortTableRows(customerMatches, customerSortValue, sort.direction);
    const copy = () => {
        const result = emailList(state.customers.filter((c) => selected.includes(c.id)));
        open(React.createElement(CopyDialog, { result: result }));
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uACE0\uAC1D \uAD00\uB9AC", description: "\uBAA8\uB4E0 \uCE74\uD14C\uACE0\uB9AC\uC5D0\uC11C \uACF5\uC720\uD558\uB294 \uACE0\uAC1D\uC0AC\uC640 \uB2F4\uB2F9\uC790 \uC815\uBCF4\uC785\uB2C8\uB2E4." },
            React.createElement(Button, { icon: Tags, onClick: () => open(React.createElement(CustomerGroupsDialog, { groups: customerGroups, activeGroup: groupFilter, onSelect: setGroupFilter })) }, "\uADF8\uB8F9 \uAD00\uB9AC"),
            allowed("customers", "create") && (React.createElement(Button, { primary: true, icon: Plus, onClick: () => open(React.createElement(CustomerForm, null)) }, "\uACE0\uAC1D\uC0AC \uB4F1\uB85D"))),
        React.createElement("div", { className: "customer-origin-summary" },
            React.createElement("button", { type: "button", className: originFilter === "all" ? "active" : "", onClick: () => setOriginFilter("all") },
                "\uC804\uCCB4 ",
                customerStats.total,
                "\uAC1C"),
            React.createElement("button", { type: "button", className: originFilter === "legacy" ? "active" : "", onClick: () => setOriginFilter("legacy") },
                "\uAD6C\uBC84\uC804 \uC774\uAD00 ",
                customerStats.imported,
                "\uAC1C"),
            !!customerStats.existing && (React.createElement("button", { type: "button", className: originFilter === "review" ? "active" : "", onClick: () => setOriginFilter("review") },
                "\uC9C1\uC811 \uB4F1\uB85D ",
                customerStats.existing,
                "\uAC1C")),
            React.createElement("button", { type: "button", className: emailFilter === "with" ? "active" : "", "aria-pressed": emailFilter === "with", onClick: () => setEmailFilter(emailFilter === "with" ? "all" : "with") },
                "\uC774\uBA54\uC77C \uB4F1\uB85D ",
                customerStats.withEmail,
                "\uAC1C"),
            React.createElement("button", { type: "button", className: filter === "normal" ? "active" : "", "aria-pressed": filter === "normal", onClick: () => setFilter(filter === "normal" ? "all" : "normal") },
                "\uC1A1\uC2E0 \uAC00\uB2A5 ",
                customerStats.available,
                "\uAC1C"),
            React.createElement("button", { type: "button", className: filter === "blocked" ? "active" : "", "aria-pressed": filter === "blocked", onClick: () => setFilter(filter === "blocked" ? "all" : "blocked") },
                "\uC1A1\uC2E0 \uAE08\uC9C0 ",
                customerStats.blocked,
                "\uAC1C"),
            React.createElement("button", { type: "button", className: groupFilter !== "__all__" ? "active" : "", "aria-pressed": groupFilter !== "__all__", onClick: () => open(React.createElement(CustomerGroupsDialog, { groups: customerGroups, activeGroup: groupFilter, onSelect: setGroupFilter })) },
                "\uACE0\uAC1D \uADF8\uB8F9 ",
                customerStats.groups,
                "\uAC1C")),
        React.createElement(DetailFilters, { value: detailFilters, onChange: setDetailFilters, fields: [
                ["name", "회사명"],
                ["person", "이름"],
                ["country", "국가", "text", countryOptions],
                ["groupName", "그룹", "text", groupNames],
                ["kind", "고객 구분", "text", ["Dealer", "End user"]],
                ["importance", "중요도", "text", ["0", "1", "2", "3"]],
                ["department", "부서명"],
                ["position", "직함"],
                ["phone", "연락처"],
                ["email", "이메일"],
                ["productInterest", "주요 취급 설비 (자유입력)"],
                ["dateFrom", "등록일 시작", "date"],
                ["dateTo", "등록일 끝", "date"],
                [
                    "interestClass",
                    "주요 취급품목 대분류",
                    "text",
                    Object.keys(productCategories),
                ],
                [
                    "interestSubclass",
                    "주요 취급품목 중분류",
                    "text",
                    detailFilters.interestClass
                        ? productCategories[detailFilters.interestClass]
                        : Object.values(productCategories).flat(),
                ],
                [
                    "wantedClass",
                    "관심 설비 대분류",
                    "text",
                    Object.keys(productCategories),
                ],
                [
                    "wantedSubclass",
                    "관심 설비 중분류",
                    "text",
                    detailFilters.wantedClass
                        ? productCategories[detailFilters.wantedClass]
                        : Object.values(productCategories).flat(),
                ],
                ["wantedTonsMinMin", "최소 관심 톤수 이상", "number"],
                ["wantedTonsMaxMax", "최대 관심 톤수 이하", "number"],
            ] }),
        React.createElement("div", { className: "filters" },
            React.createElement(SmartSearch, { items: indexed, value: q, onChange: setQ, placeholder: "\uD68C\uC0AC\u00B7\uC774\uB984\u00B7\uAD6D\uAC00\u00B7\uCDE8\uAE09\uD488\uBAA9\u00B7\uBA54\uBAA8 \uAC80\uC0C9 (\uCD08\uC131\u00B7\uC624\uD0C0 \uC9C0\uC6D0)" }),
            React.createElement(Select, { value: groupFilter, "aria-label": "\uACE0\uAC1D \uADF8\uB8F9", onChange: (e) => setGroupFilter(e.target.value) },
                React.createElement("option", { value: "__all__" }, "\uC804\uCCB4 \uADF8\uB8F9"),
                customerGroups.map((group) => (React.createElement("option", { key: group.key, value: group.key },
                    group.label,
                    " (",
                    group.count,
                    ")")))),
            React.createElement(Select, { value: emailFilter, "aria-label": "\uC774\uBA54\uC77C \uB4F1\uB85D \uC5EC\uBD80", onChange: (e) => setEmailFilter(e.target.value) },
                React.createElement("option", { value: "all" }, "\uC774\uBA54\uC77C \uC804\uCCB4"),
                React.createElement("option", { value: "with" }, "\uC774\uBA54\uC77C \uB4F1\uB85D"),
                React.createElement("option", { value: "without" }, "\uC774\uBA54\uC77C \uBBF8\uB4F1\uB85D")),
            React.createElement(Select, { value: filter, "aria-label": "\uC1A1\uC2E0 \uC0C1\uD0DC", onChange: (e) => setFilter(e.target.value) },
                React.createElement("option", { value: "all" }, "\uC804\uCCB4 \uACE0\uAC1D\uC0AC"),
                React.createElement("option", { value: "normal" }, "\uC1A1\uC2E0 \uAC00\uB2A5"),
                React.createElement("option", { value: "blocked" }, "\uC1A1\uC2E0 \uAE08\uC9C0")),
            React.createElement("span", { className: "filter-spacer" }),
            React.createElement("details", { className: "column-picker" },
                React.createElement("summary", null,
                    React.createElement(LayoutGrid, { size: 15 }),
                    " \uC5F4 \uC124\uC815"),
                React.createElement("div", null,
                    React.createElement("strong", null, "\uD56D\uC0C1 \uD45C\uC2DC: \uD68C\uC0AC\uBA85 \u00B7 \uB2F4\uB2F9\uC790 \u00B7 \uAD6D\uAC00"),
                    CUSTOMER_TABLE_COLUMNS.map(([key, label]) => (React.createElement("label", { key: key },
                        React.createElement("input", { type: "checkbox", "aria-label": `${label} 열 표시`, checked: columnVisible(key), onChange: () => toggleColumn(key) }),
                        React.createElement("span", null, label)))),
                    React.createElement("button", { type: "button", onClick: () => {
                            setVisibleColumns(DEFAULT_CUSTOMER_COLUMNS);
                            localStorage.removeItem("sein-customer-columns");
                        } }, "\uAE30\uBCF8\uAC12\uC73C\uB85C \uBCF5\uC6D0"))),
            React.createElement(Button, { icon: Copy, disabled: !selected.length, onClick: copy },
                "\uC774\uBA54\uC77C \uC77C\uAD04 \uBCF5\uC0AC",
                selected.length > 0 && ` (${selected.length})`)),
        React.createElement(Panel, null,
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", { className: "customer-catalog-table" },
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", { className: "checkbox-cell" },
                                React.createElement("input", { type: "checkbox", "aria-label": "\uACE0\uAC1D\uC0AC \uC804\uCCB4 \uC120\uD0DD", checked: rows.length > 0 &&
                                        rows.every((r) => selected.includes(r.id)), onChange: (e) => setSelected(e.target.checked ? rows.map((r) => r.id) : []) })),
                            React.createElement(SortableTh, { column: "company", sort: sort, onSort: setSort, className: "customer-company-cell" }, "\uD68C\uC0AC\uBA85"),
                            React.createElement(SortableTh, { column: "person", sort: sort, onSort: setSort }, "\uB2F4\uB2F9\uC790\uBA85"),
                            React.createElement(SortableTh, { column: "country", sort: sort, onSort: setSort }, "\uAD6D\uAC00"),
                            columnVisible("number") && (React.createElement(SortableTh, { column: "number", sort: sort, onSort: setSort }, "\uBC88\uD638")),
                            columnVisible("importance") && (React.createElement(SortableTh, { column: "importance", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uC911\uC694\uB3C4")),
                            columnVisible("group") && (React.createElement(SortableTh, { column: "group", sort: sort, onSort: setSort }, "\uADF8\uB8F9 / \uACE0\uAC1D \uAD6C\uBD84")),
                            columnVisible("department") && (React.createElement(SortableTh, { column: "department", sort: sort, onSort: setSort }, "\uBD80\uC11C / \uC9C1\uD568")),
                            columnVisible("phone") && (React.createElement(SortableTh, { column: "phone", sort: sort, onSort: setSort }, "\uC804\uD654\uBC88\uD638")),
                            columnVisible("email") && (React.createElement(SortableTh, { column: "email", sort: sort, onSort: setSort }, "\uC774\uBA54\uC77C")),
                            columnVisible("interest") && (React.createElement(SortableTh, { column: "interest", sort: sort, onSort: setSort }, "\uC8FC\uC694 \uCDE8\uAE09\uD488\uBAA9")),
                            columnVisible("wanted") && (React.createElement(SortableTh, { column: "wanted", sort: sort, onSort: setSort }, "\uAD00\uC2EC \uC124\uBE44 / \uD1A4\uC218")),
                            columnVisible("date") && (React.createElement(SortableTh, { column: "date", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uB4F1\uB85D\uC77C")),
                            columnVisible("receive") && (React.createElement(SortableTh, { column: "receive", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uC218\uC2E0 \uC5EC\uBD80")),
                            columnVisible("memo") && (React.createElement(SortableTh, { column: "memo", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uBA54\uBAA8")),
                            columnVisible("deals") && (React.createElement(SortableTh, { column: "deals", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uC601\uC5C5 \uAC74")),
                            React.createElement("th", null))),
                    React.createElement("tbody", null, rows.slice((page - 1) * 30, page * 30).map((c) => {
                        const primaryContact = c.contacts[0] || {};
                        const extraContacts = Math.max(0, c.contacts.length - 1);
                        const memoCount = (customerMemos.counts.get(c.id) || 0) + (c.note ? 1 : 0);
                        const latestMemo = customerMemos.latest.get(c.id)?.body || c.note;
                        const productInterest = [
                            c.interestClass,
                            c.interestSubclass,
                            c.productInterest,
                        ].filter(Boolean);
                        const wantedEquipment = [
                            c.wantedClass,
                            c.wantedSubclass,
                        ].filter(Boolean);
                        const tons = c.wantedTonsMin || c.wantedTonsMax
                            ? `${c.wantedTonsMin || "0"}~${c.wantedTonsMax || "∞"}톤`
                            : "";
                        return (React.createElement("tr", { key: c.id, className: "clickable customer-data-row", tabIndex: 0, onKeyDown: (e) => {
                                if (e.target === e.currentTarget &&
                                    (e.key === "Enter" || e.key === " ")) {
                                    e.preventDefault();
                                    e.currentTarget.click();
                                }
                            }, onClick: () => open(React.createElement(CustomerDetail, { id: c.id })) },
                            React.createElement("td", { className: "customer-select-cell", onClick: (e) => e.stopPropagation() },
                                React.createElement("input", { type: "checkbox", "aria-label": `${c.name} 선택`, checked: selected.includes(c.id), onChange: (e) => setSelected(e.target.checked
                                        ? [...selected, c.id]
                                        : selected.filter((x) => x !== c.id)) })),
                            React.createElement("td", { className: "customer-company-cell", "data-label": "\uD68C\uC0AC\uBA85" },
                                React.createElement("strong", null, c.name)),
                            React.createElement("td", { "data-label": "\uB2F4\uB2F9\uC790\uBA85" },
                                React.createElement("strong", null, primaryContact.name || "—"),
                                !!extraContacts && React.createElement("small", null,
                                    "\uC678 ",
                                    extraContacts,
                                    "\uBA85")),
                            React.createElement("td", { "data-label": "\uAD6D\uAC00" }, c.country || "—"),
                            columnVisible("number") && (React.createElement("td", { "data-label": "\uBC88\uD638" },
                                React.createElement("strong", null, c.legacySourceId || "—"))),
                            columnVisible("importance") && (React.createElement("td", { "data-label": "\uC911\uC694\uB3C4" },
                                React.createElement("strong", { className: "customer-stars" }, "★".repeat(Number(c.importance || 0)) || "—"))),
                            columnVisible("group") && (React.createElement("td", { "data-label": "\uADF8\uB8F9 / \uACE0\uAC1D \uAD6C\uBD84" },
                                React.createElement("strong", null, c.groupName || "미분류"),
                                React.createElement("small", null, c.kind || "구분 미입력"))),
                            columnVisible("department") && (React.createElement("td", { "data-label": "\uBD80\uC11C / \uC9C1\uD568" },
                                React.createElement("strong", null, primaryContact.department || "—"),
                                React.createElement("small", null, primaryContact.position || "직함 미입력"))),
                            columnVisible("phone") && (React.createElement("td", { "data-label": "\uC804\uD654\uBC88\uD638" }, primaryContact.phone || "—")),
                            columnVisible("email") && (React.createElement("td", { className: "email-cell", "data-label": "\uC774\uBA54\uC77C" }, primaryContact.email || (React.createElement("span", { className: "subtle" }, "\uBBF8\uB4F1\uB85D")))),
                            columnVisible("interest") && (React.createElement("td", { "data-label": "\uC8FC\uC694 \uCDE8\uAE09\uD488\uBAA9" },
                                React.createElement("strong", null, productInterest.slice(0, 2).join(" / ") || "—"),
                                productInterest[2] && (React.createElement("small", null, productInterest[2])))),
                            columnVisible("wanted") && (React.createElement("td", { "data-label": "\uAD00\uC2EC \uC124\uBE44 / \uD1A4\uC218" },
                                React.createElement("strong", null, wantedEquipment.join(" / ") || "—"),
                                !!tons && React.createElement("small", null, tons))),
                            columnVisible("date") && (React.createElement("td", { "data-label": "\uB4F1\uB85D\uC77C" }, (c.registeredOn || c.createdAt || "").slice(0, 10) ||
                                "—")),
                            columnVisible("receive") && (React.createElement("td", { "data-label": "\uC218\uC2E0 \uC5EC\uBD80" },
                                React.createElement(Badge, { tone: c.blocked ? "red" : "green" }, c.blocked ? "송신 금지" : "송신 가능"))),
                            columnVisible("memo") && (React.createElement("td", { "data-label": "\uBA54\uBAA8" },
                                React.createElement("strong", null,
                                    memoCount,
                                    "\uAC74"),
                                !!latestMemo && (React.createElement("small", { title: latestMemo }, latestMemo)))),
                            columnVisible("deals") && (React.createElement("td", { "data-label": "\uC601\uC5C5 \uAC74" },
                                customerDealCounts.get(c.id) || 0,
                                "\uAC74")),
                            React.createElement("td", { className: "customer-open-cell" },
                                React.createElement(ChevronRight, { size: 15 }))));
                    })))),
            !rows.length && React.createElement(Empty, { title: "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4" }),
            React.createElement(Pagination, { total: rows.length, page: page, onChange: setPage, size: 30 }),
            React.createElement("div", { className: "table-foot" },
                React.createElement("span", null,
                    "\uC804\uCCB4 ",
                    React.createElement("b", null, rows.length),
                    "\uAC1C \uACE0\uAC1D\uC0AC"),
                React.createElement("span", null, "\uC774\uBA54\uC77C\uC740 Outlook\uC5D0 \uBD99\uC5EC\uB123\uC5B4 \uC0AC\uC6A9\uD558\uC138\uC694.")))));
}
function CustomerGroupsDialog({ groups, activeGroup, onSelect }) {
    const { close } = useApp();
    const [query, setQuery] = useState("");
    const visible = groups.filter((group) => group.label
        .toLocaleLowerCase("ko")
        .includes(query.trim().toLocaleLowerCase("ko")));
    const selectGroup = (key) => {
        onSelect(key);
        close();
    };
    return (React.createElement(Modal, { title: "\uACE0\uAC1D \uADF8\uB8F9 \uAD00\uB9AC", subtitle: `${groups.length}개 분류 · 고객 ${groups.reduce((sum, group) => sum + group.count, 0)}개`, wide: true, onClose: close },
        React.createElement("div", { className: "modal-body customer-group-manager" },
            React.createElement("div", { className: "customer-group-toolbar" },
                React.createElement(SearchField, { value: query, onChange: setQuery, placeholder: "\uADF8\uB8F9\uBA85 \uAC80\uC0C9" }),
                React.createElement(Button, { small: true, onClick: () => selectGroup("__all__"), "aria-pressed": activeGroup === "__all__" }, "\uC804\uCCB4 \uACE0\uAC1D \uBCF4\uAE30")),
            React.createElement("div", { className: "customer-group-grid" }, visible.map((group) => (React.createElement("button", { type: "button", key: group.key, className: activeGroup === group.key ? "active" : "", onClick: () => selectGroup(group.key) },
                React.createElement("span", { className: "customer-group-card-head" },
                    React.createElement("strong", null, group.label),
                    React.createElement("b", null,
                        group.count,
                        "\uBA85")),
                React.createElement("span", { className: "customer-group-card-stats" },
                    "\uC774\uBA54\uC77C ",
                    group.withEmail,
                    " \u00B7 \uC1A1\uC2E0 \uAC00\uB2A5 ",
                    group.available),
                React.createElement("span", { className: "customer-group-card-members" },
                    group.customers
                        .slice(0, 3)
                        .map((customer) => customer.name)
                        .join(" · "),
                    group.count > 3 && ` 외 ${group.count - 3}개사`))))),
            !visible.length && React.createElement(Empty, { title: "\uC77C\uCE58\uD558\uB294 \uACE0\uAC1D \uADF8\uB8F9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" }))));
}
function CopyDialog({ result }) {
    const { close, notify } = useApp();
    return (React.createElement(Modal, { title: "\uC774\uBA54\uC77C \uC8FC\uC18C \uBCF5\uC0AC", onClose: close },
        React.createElement("div", { className: "modal-body" },
            React.createElement("p", null,
                React.createElement("strong", null,
                    result.count,
                    "\uAC1C"),
                "\uC758 \uC720\uD6A8\uD55C \uC774\uBA54\uC77C \uC8FC\uC18C\uC785\uB2C8\uB2E4."),
            React.createElement("textarea", { readOnly: true, rows: 5, value: result.text, onFocus: (e) => e.target.select() }),
            React.createElement("p", { className: "hint" },
                "\uC81C\uC678: \uC1A1\uC2E0 \uAE08\uC9C0 ",
                result.blocked,
                "\uAC1C \u00B7 \uBBF8\uB4F1\uB85D/\uD615\uC2DD \uC624\uB958 ",
                result.invalid,
                "\uAC1C \u00B7 \uC911\uBCF5 ",
                result.duplicate,
                "\uAC1C")),
        React.createElement("footer", { className: "modal-foot" },
            React.createElement(Button, { primary: true, icon: Copy, disabled: !result.count, onClick: async () => {
                    try {
                        await navigator.clipboard.writeText(result.text);
                        notify("이메일 주소를 복사했습니다.");
                    }
                    catch {
                        notify("텍스트를 선택해 직접 복사해 주세요.", "warning");
                    }
                } }, "\uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC"))));
}
function CustomerForm({ item }) {
    const { state, act, close, open } = useApp();
    const countryOptions = useMemo(() => countryOptionsFromCustomers(state.customers), [state.customers]);
    const customerGroupNames = customerGroupSummary(state.customers)
        .filter((group) => group.name)
        .map((group) => group.name);
    const [form, set] = useState(item || {
        name: "",
        blocked: false,
        kind: "",
        country: "",
        groupName: "",
        productInterest: "",
        note: "",
        contacts: [
            { name: "", department: "", position: "", phone: "", email: "" },
        ],
    }), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    return (React.createElement(Modal, { title: item ? "고객사 수정" : "고객사 등록", wide: true, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    const id = await act({
                        action: "save",
                        type: "customers",
                        targetId: item?.id,
                        version: item?.version,
                        data: form,
                    });
                    open(React.createElement(CustomerDetail, { id: id }));
                }
                catch (e) {
                    setError(e.message);
                }
                finally {
                    setBusy(false);
                }
            } },
            React.createElement("div", { className: "modal-body customer-form-body" },
                React.createElement("section", { className: "form-section-card" },
                    React.createElement("div", { className: "form-section-title" }, "\uAE30\uBCF8 \uC815\uBCF4"),
                    React.createElement(Field, { label: "\uD68C\uC0AC\uBA85", required: true },
                        React.createElement("input", { autoFocus: true, required: true, value: form.name, onChange: (e) => set({ ...form, name: e.target.value }) })),
                    React.createElement(ProfileFields, { fields: customerFields, value: form, onChange: set })),
                React.createElement("details", { className: "form-section-card", open: true },
                    React.createElement("summary", null, "\uAC70\uB798\uCC98 \uBD84\uB958"),
                    React.createElement("div", { className: "form-grid" },
                        React.createElement(Field, { label: "\uACE0\uAC1D \uAD6C\uBD84" },
                            React.createElement("select", { value: form.kind || "", onChange: (e) => set({ ...form, kind: e.target.value }) },
                                React.createElement("option", { value: "" }, "\uBBF8\uBD84\uB958"),
                                React.createElement("option", null, "Dealer"),
                                React.createElement("option", null, "End user"))),
                        React.createElement(Field, { label: "\uAD6D\uAC00" },
                            React.createElement("select", { value: form.country || "", onChange: (e) => set({ ...form, country: e.target.value }) },
                                React.createElement("option", { value: "", disabled: true }, "\uAD6D\uAC00 \uC120\uD0DD"),
                                countryOptions.map(([value, label]) => (React.createElement("option", { key: value, value: value },
                                    label,
                                    value === label ? "" : ` (${value})`))))),
                        React.createElement(Field, { label: "\uACE0\uAC1D \uADF8\uB8F9" },
                            React.createElement("input", { list: "customer-group-options", value: form.groupName || "", onChange: (e) => set({ ...form, groupName: e.target.value }), placeholder: "\uAE30\uC874 \uADF8\uB8F9 \uC120\uD0DD \uB610\uB294 \uC0C8 \uADF8\uB8F9 \uC785\uB825" }),
                            React.createElement("datalist", { id: "customer-group-options" }, customerGroupNames.map((group) => (React.createElement("option", { key: group, value: group }))))),
                        React.createElement(Field, { label: "\uC8FC\uC694 \uCDE8\uAE09 \uC124\uBE44" },
                            React.createElement("input", { value: form.productInterest || "", onChange: (e) => set({ ...form, productInterest: e.target.value }), placeholder: "\uC608: \uD504\uB808\uC2A4, NC\uC120\uBC18" })))),
                React.createElement("section", { className: "form-section-card" },
                    React.createElement("div", { className: "section-heading" },
                        React.createElement("h3", null, "\uB2F4\uB2F9\uC790"),
                        React.createElement(Button, { type: "button", small: true, icon: Plus, onClick: () => set({
                                ...form,
                                contacts: [
                                    ...form.contacts,
                                    {
                                        name: "",
                                        department: "",
                                        position: "",
                                        phone: "",
                                        email: "",
                                    },
                                ],
                            }) }, "\uB2F4\uB2F9\uC790 \uCD94\uAC00")),
                    form.contacts.map((p, i) => (React.createElement("div", { key: i, className: "contact-form" },
                        React.createElement("div", { className: "form-grid three" },
                            [
                                ["name", "이름"],
                                ["department", "부서"],
                                ["position", "직함"],
                                ["phone", "전화번호"],
                                ["email", "이메일"],
                            ].map(([k, label]) => (React.createElement(Field, { label: label, key: k },
                                React.createElement("input", { value: p[k], type: k === "email" ? "email" : "text", onChange: (e) => set({
                                        ...form,
                                        contacts: form.contacts.map((x, j) => i === j ? { ...x, [k]: e.target.value } : x),
                                    }) })))),
                            React.createElement(Button, { type: "button", small: true, danger: true, onClick: () => set({
                                    ...form,
                                    contacts: form.contacts.filter((_, j) => j !== i),
                                }) }, "\uB2F4\uB2F9\uC790 \uC0AD\uC81C")))))),
                React.createElement("section", { className: "form-section-card" },
                    React.createElement("div", { className: "form-section-title" }, "\uBA54\uBAA8 \uBC0F \uBC1C\uC1A1 \uC124\uC815"),
                    React.createElement(Field, { label: "\uACE0\uAC1D \uBA54\uBAA8" },
                        React.createElement("textarea", { rows: 3, value: form.note, onChange: (e) => set({ ...form, note: e.target.value }) })),
                    React.createElement("label", { className: "check-line" },
                        React.createElement("input", { type: "checkbox", checked: form.blocked, onChange: (e) => set({ ...form, blocked: e.target.checked }) }),
                        React.createElement("span", null, "\uC774 \uD68C\uC0AC\uC758 \uBAA8\uB4E0 \uB2F4\uB2F9\uC790\uB97C \uC774\uBA54\uC77C \uC77C\uAD04 \uBCF5\uC0AC\uC5D0\uC11C \uC81C\uC678"))),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uACE0\uAC1D\uC0AC \uC800\uC7A5")))));
}
export function CustomerDetail({ id }) {
    const { state, close, open, allowed, notify } = useApp();
    const c = state.customers.find((x) => x.id === id);
    return (React.createElement(Modal, { title: c.name, subtitle: "\uACF5\uD1B5 \uACE0\uAC1D\uC0AC", wide: true, drawer: true, onClose: close },
        React.createElement("div", { className: "detail-summary" },
            React.createElement(Badge, { tone: c.blocked ? "red" : "green" }, c.blocked ? "송신 금지" : "송신 가능"),
            React.createElement("div", { className: "actions" },
                React.createElement(Button, { small: true, icon: Copy, onClick: async () => {
                        await navigator.clipboard.writeText([
                            c.name,
                            ...c.contacts.map((p) => [p.name, p.department, p.position, p.phone, p.email]
                                .filter(Boolean)
                                .join(" · ")),
                        ].join("\n"));
                        notify("담당자 정보를 복사했습니다.");
                    } }, "\uC5F0\uB77D\uCC98 \uBCF5\uC0AC"),
                allowed("customers", "edit") && (React.createElement(Button, { small: true, icon: Pencil, onClick: () => open(React.createElement(CustomerForm, { item: c })) }, "\uC218\uC815")))),
        React.createElement("div", { className: "modal-body" },
            (c.kind || c.country || c.groupName || c.productInterest) && (React.createElement("div", { className: "info-grid" },
                c.kind && (React.createElement("div", null,
                    React.createElement("small", null, "\uACE0\uAC1D \uAD6C\uBD84"),
                    React.createElement("strong", null, c.kind))),
                c.country && (React.createElement("div", null,
                    React.createElement("small", null, "\uAD6D\uAC00"),
                    React.createElement("strong", null, c.country))),
                c.groupName && (React.createElement("div", null,
                    React.createElement("small", null, "\uACE0\uAC1D \uADF8\uB8F9"),
                    React.createElement("strong", null, c.groupName))),
                c.productInterest && (React.createElement("div", null,
                    React.createElement("small", null, "\uC8FC\uC694 \uCDE8\uAE09 \uC124\uBE44"),
                    React.createElement("strong", null, c.productInterest))))),
            React.createElement(ProfileSummary, { fields: customerFields, value: c, state: state }),
            React.createElement("div", { className: "contact-cards" }, c.contacts.map((p, i) => (React.createElement("div", { key: i },
                React.createElement("strong", null, p.name || "이름 미등록"),
                React.createElement("small", null,
                    p.department,
                    " ",
                    p.position),
                React.createElement("p", null, p.phone || "전화번호 미등록"),
                React.createElement("a", { href: `mailto:${p.email}` }, p.email))))),
            c.note && React.createElement("div", { className: "plain-note" }, c.note),
            !!c.legacySourceId && (React.createElement("details", null,
                React.createElement("summary", null, "\uAD6C\uBC84\uC804\uC5D0\uC11C \uC5F0\uACB0\uB41C \uC0C1\uD488"),
                React.createElement("div", { className: "related-list" }, state.equipment
                    .filter((e) => !e.locked &&
                    e.legacyTransactions?.some((t) => t.introducedCustomerId === c.id || t.buyerId === c.id))
                    .map((e) => (React.createElement("button", { key: e.id, onClick: () => open(React.createElement(EquipmentDetail, { id: e.id })) },
                    React.createElement(Package, { size: 18 }),
                    React.createElement("span", null,
                        React.createElement("strong", null, e.model),
                        React.createElement("small", null, e.number)),
                    React.createElement(Badge, null, e.listingStatus || "상태 미등록"))))))),
            React.createElement("div", { className: "section-heading" },
                React.createElement("h3", null, "\uC5F0\uACB0 \uC601\uC5C5")),
            React.createElement("div", { className: "related-list" }, state.deals
                .filter((d) => d.customerId === c.id)
                .map((d) => (React.createElement("button", { key: d.id, onClick: () => open(React.createElement(DealDetail, { id: d.id })) },
                React.createElement(Handshake, { size: 18 }),
                React.createElement("span", null,
                    React.createElement("strong", null, d.name),
                    React.createElement("small", null,
                        d.lines.length,
                        "\uB300 \u00B7 ",
                        personName(state, d.ownerId))),
                React.createElement(Badge, null, d.status))))),
            React.createElement(MemoPanel, { type: "customers", id: c.id }))));
}
function SalesProfitStatsModal() {
    const { state, category, close } = useApp();
    const confirmed = state.deals.filter((deal) => deal.categoryId === category.id && deal.status === "확정");
    const values = confirmed.map((deal) => ({ deal, ...totals(deal) }));
    const sum = values.reduce((result, value) => ({
        buy: result.buy + value.buy,
        sell: result.sell + value.sell,
        profit: result.profit + value.profit,
    }), { buy: 0, sell: 0, profit: 0 });
    const average = confirmed.length ? sum.profit / confirmed.length : 0;
    const rate = sum.sell ? (sum.profit / sum.sell) * 100 : 0;
    return (React.createElement(Modal, { title: "\uD310\uB9E4 \uC218\uC775 \uD1B5\uACC4", subtitle: "\uD310\uB9E4 \uD655\uC815 \uAC74\uC744 \uAE30\uC900\uC73C\uB85C \uC9D1\uACC4\uD569\uB2C8\uB2E4.", onClose: close, wide: true },
        React.createElement("div", { className: "modal-body" },
            React.createElement("div", { className: "dashboard-profit-stats sales-profit-modal-summary" },
                React.createElement("div", null,
                    React.createElement("span", null, "\uD655\uC815 \uAC74"),
                    React.createElement("strong", null,
                        confirmed.length,
                        "\uAC74")),
                React.createElement("div", null,
                    React.createElement("span", null, "\uD310\uB9E4\uAC00 \uD569\uACC4"),
                    React.createElement("strong", null, won(sum.sell))),
                React.createElement("div", null,
                    React.createElement("span", null, "\uC218\uC775 \uD569\uACC4"),
                    React.createElement("strong", null, won(sum.profit))),
                React.createElement("div", null,
                    React.createElement("span", null, "\uD3C9\uADE0 \uC218\uC775"),
                    React.createElement("strong", null, won(average))),
                React.createElement("div", null,
                    React.createElement("span", null, "\uD3C9\uADE0 \uC218\uC775\uB960"),
                    React.createElement("strong", null,
                        rate.toFixed(1),
                        "%"))),
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "\uC601\uC5C5 \uAC74"),
                            React.createElement("th", null, "\uACE0\uAC1D\uC0AC"),
                            React.createElement("th", { className: "num" }, "\uB9E4\uC785\uAC00"),
                            React.createElement("th", { className: "num" }, "\uD310\uB9E4\uAC00"),
                            React.createElement("th", { className: "num" }, "\uC218\uC775"),
                            React.createElement("th", null, "\uD655\uC815\uC77C"))),
                    React.createElement("tbody", null, values.map(({ deal, buy, sell, profit }) => (React.createElement("tr", { key: deal.id },
                        React.createElement("td", null,
                            React.createElement("strong", null, deal.name)),
                        React.createElement("td", null, companyName(state, deal.customerId)),
                        React.createElement("td", { className: "num" }, won(buy)),
                        React.createElement("td", { className: "num" }, won(sell)),
                        React.createElement("td", { className: "num positive" }, won(profit)),
                        React.createElement("td", null, date(deal.confirmedAt))))))),
                !values.length && React.createElement(Empty, { title: "\uD310\uB9E4 \uD655\uC815 \uAC74\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" })))));
}
export function DealsPage() {
    const { state, category, open, allowed } = useApp();
    const [q, setQ] = useState(""), [status, setStatus] = useState("전체"), [owner, setOwner] = useState("all"), [sort, setSort] = useState({ key: "updated", direction: "desc" });
    const dealFigures = (deal) => {
        const confirmed = deal.status === "확정";
        const sell = totals(deal).sell;
        const buy = confirmed
            ? totals(deal).buy
            : deal.lines.filter((line) => !line.cancelled).reduce((sum, line) => {
                const equipment = state.equipment.find((item) => item.id === line.equipmentId);
                if (!equipment || equipment.purchaseUnverified)
                    return sum;
                try {
                    return sum + krwNet(equipment.buy, equipment.currency, equipment.vat, equipment.taxRate, equipment.fx);
                }
                catch {
                    return sum;
                }
            }, 0);
        return { buy, sell, profit: confirmed ? sell - buy : null };
    };
    const memoCount = (deal) => state.memos.filter((memo) => memo.targetType === "deals" && memo.targetId === deal.id && !memo.deletedAt).length;
    const all = state.deals.filter((d) => d.categoryId === category.id), dealMatches = all.filter((d) => {
        const equipmentText = d.lines
            .map((line) => {
            const equipment = state.equipment.find((item) => item.id === line.equipmentId);
            return `${equipment?.model || line.model || ""} ${equipment?.number || ""}`;
        })
            .join(" ");
        return (`${d.name} ${companyName(state, d.customerId)} ${equipmentText}`
            .toLowerCase()
            .includes(q.toLowerCase()) &&
            (status === "전체" || d.status === status) &&
            (owner === "all" || d.ownerId === owner));
    });
    const rows = sortTableRows(dealMatches, (deal) => ({
        name: `${deal.name || ""} ${companyName(state, deal.customerId)}`,
        equipment: deal.lines
            .map((line) => state.equipment.find((item) => item.id === line.equipmentId)
            ?.model ||
            line.model ||
            "")
            .join(" "),
        buy: dealFigures(deal).buy,
        sell: dealFigures(deal).sell,
        profit: dealFigures(deal).profit,
        memo: memoCount(deal),
        owner: personName(state, deal.ownerId),
        status: deal.status || "",
        updated: deal.updatedAt || deal.createdAt || "",
    })[sort.key], sort.direction);
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uC601\uC5C5 \uAD00\uB9AC", description: "\uBCF5\uC218 \uC124\uBE44 \uC81C\uC548\uBD80\uD130 \uD310\uB9E4 \uD655\uC815\uAE4C\uC9C0, \uAC70\uB798\uC758 \uD750\uB984\uC744 \uAE30\uB85D\uD569\uB2C8\uB2E4." },
            React.createElement(Button, { icon: TrendingUp, onClick: () => open(React.createElement(SalesProfitStatsModal, null)) }, "\uD310\uB9E4 \uC218\uC775 \uD1B5\uACC4"),
            allowed("deals", "create") && (React.createElement(Button, { primary: true, icon: Plus, onClick: () => open(React.createElement(DealForm, null)) }, "\uC601\uC5C5 \uB4F1\uB85D"))),
        React.createElement(Tabs, { value: status, onChange: setStatus, items: ["전체", "진행중", "확정", "무산", "취소"].map((k) => [
                k,
                k,
                all.filter((d) => k === "전체" || d.status === k).length,
            ]) }),
        React.createElement("div", { className: "filters" },
            React.createElement(SearchField, { value: q, onChange: setQ, placeholder: "\uC601\uC5C5\uBA85, \uACE0\uAC1D\uC0AC, \uC124\uBE44 \uAC80\uC0C9" }),
            React.createElement(Select, { "aria-label": "\uC601\uC5C5 \uB2F4\uB2F9\uC790", value: owner, onChange: (e) => setOwner(e.target.value) },
                React.createElement("option", { value: "all" }, "\uC804\uCCB4 \uB2F4\uB2F9\uC790"),
                state.users
                    .filter((user) => user.active)
                    .map((user) => (React.createElement("option", { key: user.id, value: user.id }, user.name)))),
            React.createElement("span", { className: "filter-spacer" }),
            React.createElement("span", { className: "hint" }, "\uC124\uBE44 \uD55C \uB300\uB97C \uC5EC\uB7EC \uACE0\uAC1D\uC5D0\uAC8C \uB3D9\uC2DC\uC5D0 \uC81C\uC548\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")),
        React.createElement(Panel, null,
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement(SortableTh, { column: "name", sort: sort, onSort: setSort }, "\uC601\uC5C5 \uAC74"),
                            React.createElement("th", null, "\uACE0\uAC1D\uC0AC"),
                            React.createElement(SortableTh, { column: "equipment", sort: sort, onSort: setSort }, "\uC5F0\uACB0 \uC124\uBE44"),
                            React.createElement(SortableTh, { column: "owner", sort: sort, onSort: setSort }, "\uB2F4\uB2F9\uC790"),
                            React.createElement(SortableTh, { column: "buy", sort: sort, onSort: setSort, className: "num" }, "\uB9E4\uC785\uAC00"),
                            React.createElement(SortableTh, { column: "sell", sort: sort, onSort: setSort, className: "num" }, "\uD310\uB9E4\uAC00"),
                            React.createElement(SortableTh, { column: "profit", sort: sort, onSort: setSort, className: "num" }, "\uC218\uC775"),
                            React.createElement(SortableTh, { column: "memo", sort: sort, onSort: setSort }, "\uBA54\uBAA8"),
                            React.createElement(SortableTh, { column: "status", sort: sort, onSort: setSort }, "\uC0C1\uD0DC"),
                            React.createElement(SortableTh, { column: "updated", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uCD5C\uADFC \uC218\uC815"),
                            React.createElement("th", null))),
                    React.createElement("tbody", null, rows.map((d) => (React.createElement("tr", { key: d.id, className: "clickable", tabIndex: 0, onKeyDown: (e) => {
                            if (e.target === e.currentTarget &&
                                (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                e.currentTarget.click();
                            }
                        }, onClick: () => open(React.createElement(DealDetail, { id: d.id })) },
                        React.createElement("td", null,
                            React.createElement("strong", null, d.name),
                            React.createElement("small", null, d.number || d.code || "")),
                        React.createElement("td", null, companyName(state, d.customerId)),
                        React.createElement("td", null,
                            React.createElement("div", { className: "equipment-chips" },
                                d.lines.slice(0, 2).map((l) => (React.createElement("span", { className: l.cancelled ? "cancelled" : "", key: l.equipmentId }, state.equipment.find((e) => e.id === l.equipmentId)
                                    ?.model || l.model))),
                                d.lines.length > 2 && React.createElement("span", null,
                                    "+",
                                    d.lines.length - 2))),
                        React.createElement("td", null, personName(state, d.ownerId)),
                        React.createElement("td", { className: "num" }, won(dealFigures(d).buy)),
                        React.createElement("td", { className: "num" }, d.status === "확정" ? won(dealFigures(d).sell) : "—"),
                        React.createElement("td", { className: "num" }, d.status === "확정" ? won(dealFigures(d).profit) : "—"),
                        React.createElement("td", null, memoCount(d) ? `${memoCount(d)}건` : "—"),
                        React.createElement("td", null,
                            React.createElement(Badge, null, d.status),
                            d.status === "확정" &&
                                d.lines.some((l) => l.cancelled) && (React.createElement("small", { className: "text-amber" }, "\uC77C\uBD80 \uCDE8\uC18C"))),
                        React.createElement("td", { className: "subtle nowrap" }, date(d.updatedAt)),
                        React.createElement("td", null,
                            React.createElement(ChevronRight, { size: 16 })))))))),
            !rows.length && React.createElement(Empty, { title: "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uC601\uC5C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" }),
            React.createElement("div", { className: "table-foot" },
                "\uC804\uCCB4 ",
                rows.length,
                "\uAC74"))));
}
export function DealForm({ item, equipmentIds = [] }) {
    const { state, category, act, open, close } = useApp();
    const [form, set] = useState(item
        ? structuredClone(item)
        : {
            name: "",
            customerId: "",
            categoryId: category.id,
            lines: equipmentIds.map((equipmentId) => ({
                equipmentId,
                amount: "",
            })),
            currency: "KRW",
            vat: "excluded",
            taxRate: 10,
            fx: 1,
            fxSource: "KRW",
            fxDate: new Date().toISOString().slice(0, 10),
            terms: "",
        }), [q, setQ] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false), [targetTotal, setTargetTotal] = useState("");
    const equipment = catEquipment(state, category).filter((e) => !e.locked && (e.model + e.number).toLowerCase().includes(q.toLowerCase()));
    const sum = form.lines.reduce((a, l) => a + Number(l.amount || 0), 0);
    return (React.createElement(Modal, { title: item ? "영업 정보 수정" : "새 영업 등록", subtitle: "\uACE0\uAC1D\uACFC \uC124\uBE44\uB97C \uC5F0\uACB0\uD558\uACE0 \uC124\uBE44\uBCC4 \uC81C\uC548 \uAE08\uC561\uC744 \uC785\uB825\uD558\uC138\uC694.", wide: true, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    if (targetTotal !== "" &&
                        Math.round(Number(targetTotal) * 100) !== Math.round(sum * 100))
                        throw Error("목표 총액과 설비별 합계가 다릅니다. 금액을 배분해 주세요.");
                    const id = await act({
                        action: "save",
                        type: "deals",
                        targetId: item?.id,
                        version: item?.version,
                        data: form,
                    });
                    open(React.createElement(DealDetail, { id: id }));
                }
                catch (e) {
                    setError(e.message);
                }
                finally {
                    setBusy(false);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement("div", { className: "form-grid" },
                    React.createElement(Field, { label: "\uC601\uC5C5\uBA85", required: true },
                        React.createElement("input", { autoFocus: true, required: true, value: form.name, onChange: (e) => set({ ...form, name: e.target.value }), placeholder: "\uC608: \uD55C\uC2E0\uAE08\uC18D \uD504\uB808\uC2A4 2\uB300 \uC81C\uC548" })),
                    React.createElement(Field, { label: "\uACE0\uAC1D\uC0AC", required: true },
                        React.createElement("select", { value: form.customerId, required: true, onChange: (e) => set({ ...form, customerId: e.target.value }) },
                            React.createElement("option", { value: "" }, "\uACE0\uAC1D\uC0AC \uC120\uD0DD"),
                            state.customers.map((c) => (React.createElement("option", { key: c.id, value: c.id }, c.name)))))),
                React.createElement(CurrencyFields, { value: form, onChange: set, hideAmount: true }),
                React.createElement("div", { className: "section-heading" },
                    React.createElement("h3", null,
                        "\uC81C\uC548\uD560 \uC124\uBE44 ",
                        React.createElement("span", null,
                            form.lines.length,
                            "\uB300")),
                    React.createElement(SearchField, { value: q, onChange: setQ, placeholder: "\uC124\uBE44 \uAC80\uC0C9" })),
                React.createElement("div", { className: "equipment-picker" }, equipment.map((e) => {
                    const line = form.lines.find((l) => l.equipmentId === e.id), status = equipmentStatus(e.id, state.deals, e);
                    return (React.createElement("div", { key: e.id, className: line ? "selected" : "" },
                        React.createElement("label", null,
                            React.createElement("input", { type: "checkbox", checked: !!line, disabled: !line && ["판매확정", "이전 판매완료"].includes(status), onChange: (ev) => set({
                                    ...form,
                                    lines: ev.target.checked
                                        ? [...form.lines, { equipmentId: e.id, amount: "" }]
                                        : form.lines.filter((l) => l.equipmentId !== e.id),
                                }) }),
                            React.createElement("span", null,
                                React.createElement("strong", null, e.model),
                                React.createElement("small", null, e.number))),
                        React.createElement(Badge, null, status),
                        line && (React.createElement("input", { className: "price-input", type: "number", "aria-label": `${e.model} 판매 금액`, required: true, min: "0", step: form.currency === "USD" ? ".01" : "1", placeholder: "\uD310\uB9E4 \uAE08\uC561", value: line.amount, onChange: (ev) => set({
                                ...form,
                                lines: form.lines.map((l) => l.equipmentId === e.id
                                    ? { ...l, amount: ev.target.value }
                                    : l),
                            }) }))));
                })),
                React.createElement("div", { className: "allocation" },
                    React.createElement(Field, { label: "\uBB36\uC74C \uBAA9\uD45C \uCD1D\uC561 (\uC120\uD0DD)", hint: "\uC124\uBE44\uBCC4 \uAE08\uC561 \uD569\uACC4\uC640 \uC77C\uCE58\uD574\uC57C \uD569\uB2C8\uB2E4." },
                        React.createElement("input", { type: "number", min: "0", step: form.currency === "USD" ? ".01" : "1", value: targetTotal, onChange: (e) => setTargetTotal(e.target.value), placeholder: "\uCD1D\uC561\uBD80\uD130 \uC815\uD558\uB294 \uACBD\uC6B0 \uC785\uB825" })),
                    React.createElement("div", null,
                        React.createElement("small", null, "\uC124\uBE44\uBCC4 \uAE08\uC561 \uD569\uACC4"),
                        React.createElement("strong", null,
                            fmt(sum, form.currency),
                            " ",
                            React.createElement("span", null, form.currency)),
                        targetTotal !== "" && Number(targetTotal) !== sum && (React.createElement("small", { className: "text-red" },
                            "\uCC28\uC561 ",
                            fmt(Number(targetTotal) - sum, form.currency),
                            " ",
                            form.currency)))),
                React.createElement("details", null,
                    React.createElement("summary", null, "\uAC70\uB798\uC870\uAC74 \uC785\uB825"),
                    React.createElement("textarea", { rows: 3, value: form.terms, onChange: (e) => set({ ...form, terms: e.target.value }), placeholder: "\uB0A9\uAE30, \uACB0\uC81C, \uC778\uB3C4\uC870\uAC74 \uB4F1" })),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uC601\uC5C5 \uC800\uC7A5")))));
}
export function DealDetail({ id }) {
    const { state, open, close, act, allowed } = useApp();
    const [tab, setTab] = useState("equipment");
    const d = state.deals.find((x) => x.id === id);
    if (!d)
        return null;
    const t = totals(d), quotes = state.quotes.filter((q) => q.dealId === id);
    return (React.createElement(Modal, { title: d.name, subtitle: `${companyName(state, d.customerId)} · 담당 ${personName(state, d.ownerId)}`, wide: true, drawer: true, onClose: close },
        React.createElement("div", { className: "detail-summary" },
            React.createElement("div", { className: "actions" },
                React.createElement(Badge, null, d.status),
                d.lines.some((l) => l.cancelled) && (React.createElement(Badge, { tone: "amber" }, "\uC77C\uBD80 \uCDE8\uC18C"))),
            React.createElement("div", { className: "actions" },
                d.status === "진행중" && allowed("deals", "edit") && (React.createElement(Button, { small: true, icon: Pencil, onClick: () => open(React.createElement(DealForm, { item: d })) }, "\uC218\uC815")),
                allowed("quotes", "create") &&
                    ["진행중", "확정"].includes(d.status) && (React.createElement(Button, { small: true, icon: FileText, onClick: () => open(React.createElement(QuoteForm, { deal: d })) }, "\uACAC\uC801\uC11C \uB9CC\uB4E4\uAE30")),
                d.status === "진행중" && allowed("deals", "confirm") && (React.createElement(Button, { primary: true, small: true, icon: Check, onClick: () => open(React.createElement(SalesConfirmation, { deal: d })) }, "\uD310\uB9E4 \uD655\uC815")))),
        React.createElement(Tabs, { items: [
                ["equipment", "설비 · 금액"],
                ["memo", "공유 메모"],
                ["quotes", "견적 이력", quotes.length],
                ["files", "첨부 자료"],
                ["history", "변경 이력"],
            ], value: tab, onChange: setTab }),
        React.createElement("div", { className: "modal-body detail-body" },
            tab === "equipment" && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "deal-totals" },
                    React.createElement("div", null,
                        React.createElement("small", null,
                            d.status === "확정" ? "확정 판매" : "제안",
                            " \uACF5\uAE09\uAC00\uC561"),
                        React.createElement("strong", null, won(t.sell))),
                    React.createElement("div", null,
                        React.createElement("small", null,
                            d.status === "확정" ? "확정 매입" : "현재 매입",
                            " \uACF5\uAE09\uAC00\uC561"),
                        React.createElement("strong", null, won(d.status === "확정"
                            ? t.buy
                            : d.lines.reduce((a, l) => {
                                const e = state.equipment.find((e) => e.id === l.equipmentId);
                                return (a +
                                    (e
                                        ? krwNet(e.buy, e.currency, e.vat, e.taxRate, e.fx)
                                        : 0));
                            }, 0)))),
                    React.createElement("div", null,
                        React.createElement("small", null, "\uC801\uC6A9 \uD658\uC728"),
                        React.createElement("strong", null, d.currency === "KRW"
                            ? "원화 거래"
                            : `1 ${d.currency} = ${fmt(d.fx, "USD")}원`),
                        React.createElement("small", null,
                            d.fxDate,
                            " \u00B7 ",
                            d.fxSource))),
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "\uC124\uBE44"),
                            React.createElement("th", null, "\uC0C1\uD0DC"),
                            React.createElement("th", { className: "num" },
                                "\uD310\uB9E4 \uAE08\uC561 (",
                                d.currency,
                                ")"),
                            React.createElement("th", null))),
                    React.createElement("tbody", null, d.lines.map((l) => {
                        const e = state.equipment.find((e) => e.id === l.equipmentId);
                        const soldElsewhere = d.status === "진행중" &&
                            equipmentStatus(l.equipmentId, state.deals) === "판매확정";
                        return (React.createElement("tr", { key: l.equipmentId },
                            React.createElement("td", null,
                                React.createElement("strong", null, e?.model || l.model),
                                React.createElement("small", null, e?.number || l.number)),
                            React.createElement("td", null, l.cancelled ? (React.createElement(Badge, { tone: "red" }, "\uD310\uB9E4 \uCDE8\uC18C")) : soldElsewhere ? (React.createElement(Badge, { tone: "red" }, "\uB2E4\uB978 \uAC70\uB798\uC5D0\uC11C \uD310\uB9E4\uB428")) : (React.createElement(Badge, null, d.status === "확정" ? "판매확정" : "제안중"))),
                            React.createElement("td", { className: `num ${l.cancelled ? "cancelled" : ""}` }, fmt(l.amount, d.currency)),
                            React.createElement("td", null,
                                React.createElement(IconButton, { icon: ArrowUpRight, label: "\uC124\uBE44 \uC0C1\uC138", onClick: () => open(React.createElement(EquipmentDetail, { id: l.equipmentId })) }))));
                    }))),
                React.createElement("p", { className: "hint" },
                    d.vat === "included"
                        ? "부가세 포함 금액"
                        : d.vat === "excluded"
                            ? `부가세 별도 (${d.taxRate}%)`
                            : "부가세 미적용",
                    " ",
                    "\u00B7 \uD310\uB9E4 \uD655\uC815 \uC2DC\uC810\uC758 \uAE08\uC561\uC73C\uB85C \uC2E4\uC801\uC744 \uACC4\uC0B0\uD569\uB2C8\uB2E4."),
                d.terms && React.createElement("div", { className: "plain-note" }, d.terms),
                React.createElement("div", { className: "detail-danger-actions" },
                    d.status === "확정" && allowed("deals", "correct") && (React.createElement(React.Fragment, null,
                        React.createElement(Button, { small: true, onClick: () => open(React.createElement(CorrectionDialog, { deal: d })) }, "\uAE08\uC561 \uC815\uC815"),
                        React.createElement(Button, { small: true, danger: true, onClick: () => open(React.createElement(CorrectionDialog, { deal: d, cancel: true })) }, "\uC77C\uBD80 / \uC804\uCCB4 \uCDE8\uC18C"))),
                    d.status === "진행중" && allowed("deals", "edit") && (React.createElement(Button, { small: true, danger: true, onClick: () => open(React.createElement(ReasonDialog, { title: "\uC601\uC5C5 \uBB34\uC0B0 \uCC98\uB9AC", onSubmit: (reason) => act({
                                action: "lose",
                                type: "deals",
                                targetId: d.id,
                                version: d.version,
                                data: { reason },
                            }) })) }, "\uBB34\uC0B0 \uCC98\uB9AC"))))),
            tab === "memo" && React.createElement(MemoPanel, { type: "deals", id: d.id }),
            tab === "quotes" && React.createElement(QuoteList, { quotes: quotes }),
            tab === "files" && React.createElement(FilesPanel, { targetType: "deals", targetId: d.id }),
            tab === "history" && (React.createElement("div", { className: "timeline" },
                state.logs
                    .filter((l) => l.targetType === "deals" && l.targetId === id)
                    .map((l) => (React.createElement("div", { key: l.id },
                    React.createElement("i", null),
                    React.createElement("strong", null, l.action),
                    React.createElement("small", null,
                        personName(state, l.userId),
                        " \u00B7",
                        " ",
                        new Date(l.at).toLocaleString("ko-KR")),
                    l.detail && React.createElement("p", null, l.detail)))),
                !state.logs.some((l) => l.targetType === "deals" && l.targetId === id) && React.createElement(Empty, { title: "\uAE30\uB85D\uB41C \uBCC0\uACBD \uC774\uB825\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" }))))));
}
function ReasonDialog({ title, onSubmit }) {
    const { close } = useApp();
    const [reason, set] = useState(""), [error, setError] = useState("");
    return (React.createElement(Modal, { title: title, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                try {
                    await onSubmit(reason);
                    close();
                }
                catch (e) {
                    setError(e.message);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement(Field, { label: "\uBCC0\uACBD \uC0AC\uC720", required: true },
                    React.createElement("textarea", { required: true, value: reason, onChange: (e) => set(e.target.value) })),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { danger: true }, "\uCC98\uB9AC\uD558\uAE30")))));
}
function CorrectionDialog({ deal, cancel = false }) {
    const { state, act, close } = useApp();
    const [lines, setLines] = useState(deal.lines.filter((l) => !l.cancelled).map((l) => ({ ...l }))), [selected, setSelected] = useState([]), [reason, setReason] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    return (React.createElement(Modal, { title: cancel ? "판매 일부 / 전체 취소" : "확정 금액 정정", onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await act({
                        action: cancel ? "cancel" : "correct",
                        type: "deals",
                        targetId: deal.id,
                        version: deal.version,
                        data: { reason, lines, equipmentIds: selected },
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
                React.createElement("p", { className: "hint" }, cancel
                    ? "취소한 설비는 다시 판매할 수 있으며, 이전 기록은 보존됩니다."
                    : "발행된 견적 원본은 변경되지 않습니다. 변경 사유와 금액을 기록합니다."),
                lines.map((l) => (React.createElement("div", { className: "correction-row", key: l.equipmentId },
                    cancel && (React.createElement("input", { "aria-label": "\uCDE8\uC18C \uC120\uD0DD", type: "checkbox", checked: selected.includes(l.equipmentId), onChange: (e) => setSelected(e.target.checked
                            ? [...selected, l.equipmentId]
                            : selected.filter((x) => x !== l.equipmentId)) })),
                    React.createElement("strong", null, state.equipment.find((e) => e.id === l.equipmentId)?.model ||
                        l.model),
                    cancel ? (React.createElement("span", null,
                        fmt(l.amount, deal.currency),
                        " ",
                        deal.currency)) : (React.createElement("input", { type: "number", required: true, min: "0", step: deal.currency === "USD" ? ".01" : "1", "aria-label": "\uC815\uC815 \uD310\uB9E4 \uAE08\uC561", value: l.amount, onChange: (e) => setLines(lines.map((x) => x.equipmentId === l.equipmentId
                            ? { ...x, amount: e.target.value }
                            : x)) }))))),
                React.createElement(Field, { label: "\uBCC0\uACBD \uC0AC\uC720", required: true },
                    React.createElement("textarea", { required: true, value: reason, onChange: (e) => setReason(e.target.value), rows: 3 })),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uB3CC\uC544\uAC00\uAE30"),
                React.createElement(Button, { primary: !cancel, danger: cancel, loading: busy }, cancel ? "선택 설비 판매 취소" : "정정 저장")))));
}
export function QuotesPage() {
    const { state, open, category, allowed } = useApp();
    const [q, setQ] = useState(""), [language, setLanguage] = useState("all"), [currency, setCurrency] = useState("all"), [sort, setSort] = useState({ key: "created", direction: "desc" });
    const quoteTotal = (quote) => quote.lines.reduce((sum, line) => sum +
        moneyParts(line.amount, quote.currency, quote.vat, quote.taxRate).total, 0);
    const categoryQuotes = state.quotes.filter((q) => state.deals.some((d) => d.id === q.dealId && d.categoryId === category.id));
    const quoteMatches = categoryQuotes.filter((x) => `${x.number} ${x.customer.name}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
        (language === "all" || x.language === language) &&
        (currency === "all" || x.currency === currency));
    const quotes = sortTableRows(quoteMatches, (quote) => ({
        number: `${quote.number || ""} ${quote.customer.name || ""}`,
        revision: Number(quote.revision || 0),
        language: quote.language || "",
        total: quoteTotal(quote),
        created: quote.createdAt || "",
    })[sort.key], sort.direction);
    const confirmedQuotes = quotes.filter((quote) => state.deals.find((deal) => deal.id === quote.dealId)?.status === "확정");
    const expectedQuotes = quotes.filter((quote) => state.deals.find((deal) => deal.id === quote.dealId)?.status === "진행중");
    const summary = quoteSummary(categoryQuotes, state.deals);
    const archivedQuotes = quotes.filter((q) => !confirmedQuotes.includes(q) && !expectedQuotes.includes(q));
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uACAC\uC801 \uAD00\uB9AC", description: "\uAD6D\uBB38\u00B7\uC601\uBB38 \uACAC\uC801\uC11C\uB97C \uBC1C\uD589\uD558\uACE0 \uBC84\uC804\uBCC4 \uC6D0\uBCF8\uC744 \uBCF4\uAD00\uD569\uB2C8\uB2E4." }, allowed("quotes", "create") && (React.createElement(Button, { primary: true, icon: Plus, onClick: () => open(React.createElement(QuoteForm, null)) }, "\uACAC\uC801\uC11C \uB9CC\uB4E4\uAE30"))),
        React.createElement("p", { className: "hint" }, "\uC0C1\uB2E8 \uC9D1\uACC4\uB294 \uCE74\uD14C\uACE0\uB9AC \uC804\uCCB4 \uAE30\uC900\uC785\uB2C8\uB2E4. \uAC80\uC0C9\u00B7\uC5B8\uC5B4\u00B7\uD1B5\uD654 \uC870\uAC74\uC740 \uC544\uB798 \uBCF4\uAD00 \uBAA9\uB85D\uC5D0 \uC801\uC6A9\uB429\uB2C8\uB2E4."),
        React.createElement("div", { className: "quote-summary-strip" },
            React.createElement("div", null,
                React.createElement("span", null, "\uD655\uC815 \uC601\uC5C5 \uBCF4\uAD00 \uBC84\uC804"),
                React.createElement("strong", null,
                    categoryQuotes.filter((q) => state.deals.some((d) => d.id === q.dealId && d.status === "확정")).length,
                    "\uAC74"),
                React.createElement("small", null, "\uBC84\uC804 \uAE30\uB85D \u00B7 \uD655\uC815 \uB9E4\uCD9C\uC740 \uC601\uC5C5 \uAD00\uB9AC\uC5D0\uC11C \uD655\uC778")),
            React.createElement("div", null,
                React.createElement("span", null, "\uC9C4\uD589\uC911 \uC601\uC5C5 \uCD5C\uC2E0 \uACAC\uC801"),
                React.createElement("strong", null,
                    summary.expectedDeals,
                    "\uAC74"),
                React.createElement("small", null,
                    "\uC6D0\uD654 \uACF5\uAE09\uAC00 ",
                    won(summary.expectedAmount),
                    " \u00B7 \uC601\uC5C5\uBCC4 \uCD5C\uC2E0 1\uAC1C")),
            React.createElement("div", null,
                React.createElement("span", null, "\uBCF4\uAD00 PDF"),
                React.createElement("strong", null,
                    categoryQuotes.length,
                    "\uAC1C"),
                React.createElement("small", null, "\uD589 \uC120\uD0DD \uC2DC \uC0C1\uC138 \uC815\uBCF4 \uBCF4\uAE30"))),
        React.createElement("div", { className: "filters" },
            React.createElement(SearchField, { value: q, onChange: setQ, placeholder: "\uACAC\uC801\uBC88\uD638, \uACE0\uAC1D\uC0AC \uAC80\uC0C9" }),
            React.createElement(Select, { "aria-label": "\uACAC\uC801 \uC5B8\uC5B4", value: language, onChange: (e) => setLanguage(e.target.value) },
                React.createElement("option", { value: "all" }, "\uC804\uCCB4 \uC5B8\uC5B4"),
                React.createElement("option", { value: "ko" }, "\uAD6D\uBB38"),
                React.createElement("option", { value: "en" }, "\uC601\uBB38")),
            React.createElement(Select, { "aria-label": "\uACAC\uC801 \uD1B5\uD654", value: currency, onChange: (e) => setCurrency(e.target.value) },
                React.createElement("option", { value: "all" }, "\uC804\uCCB4 \uD1B5\uD654"),
                [...new Set(state.quotes.map((quote) => quote.currency))].map((item) => (React.createElement("option", { key: item, value: item }, item)))),
            React.createElement("span", { className: "filter-spacer" }),
            React.createElement("span", { className: "hint" }, "KRW \u00B7 USD \u00B7 JPY / \uAD6D\uBB38 \u00B7 \uC601\uBB38")),
        React.createElement(Panel, { title: "\uD655\uC815 \uC601\uC5C5 \uACAC\uC801", extra: React.createElement("span", { className: "subtle" },
                confirmedQuotes.length,
                "\uAC74") },
            React.createElement(QuoteList, { quotes: confirmedQuotes, ordered: true, sort: sort, onSort: setSort })),
        React.createElement(Panel, { title: "\uC608\uC0C1 \uC601\uC5C5 \uACAC\uC801", extra: React.createElement("span", { className: "subtle" },
                expectedQuotes.length,
                "\uAC74") },
            React.createElement(QuoteList, { quotes: expectedQuotes, ordered: true, sort: sort, onSort: setSort })),
        archivedQuotes.length > 0 && (React.createElement(Panel, { title: "\uCDE8\uC18C\u00B7\uC885\uB8CC \uC601\uC5C5 \uBCF4\uAD00 \uACAC\uC801" },
            React.createElement(QuoteList, { quotes: archivedQuotes, ordered: true, sort: sort, onSort: setSort })))));
}
function QuoteList({ quotes, ordered = false, sort, onSort }) {
    const { open, state, allowed } = useApp();
    return quotes.length ? (React.createElement("div", { className: "table-scroll" },
        React.createElement("table", { className: "quote-list-table" },
            React.createElement("thead", null,
                React.createElement("tr", null,
                    onSort ? React.createElement(SortableTh, { column: "number", sort: sort, onSort: onSort }, "\uACAC\uC801\uBC88\uD638") : React.createElement("th", null, "\uACAC\uC801\uBC88\uD638"),
                    React.createElement("th", null, "\uC5F0\uB3D9 \uC124\uBE44"),
                    React.createElement("th", null, "\uAD6C\uBD84"),
                    onSort ? (React.createElement(SortableTh, { column: "total", sort: sort, onSort: onSort, defaultDirection: "desc", className: "num" }, "\uAE08\uC561")) : (React.createElement("th", { className: "num" }, "\uAE08\uC561")),
                    onSort ? (React.createElement(SortableTh, { column: "created", sort: sort, onSort: onSort, defaultDirection: "desc" }, "\uC791\uC131\uC77C")) : (React.createElement("th", null, "\uC791\uC131\uC77C")),
                    React.createElement("th", null, "\uC791\uC131\uC790"),
                    React.createElement("th", null, "\uC138\uBD80 \uACAC\uC801 \uD30C\uC77C"))),
            React.createElement("tbody", null, (ordered ? quotes : [...quotes].reverse()).map((q) => (React.createElement("tr", { key: q.id, className: "clickable", tabIndex: 0, title: "\uACAC\uC801 \uC0C1\uC138 \uBCF4\uAE30", onClick: () => open(React.createElement(QuoteDetail, { quote: q })), onKeyDown: (event) => {
                    if (event.target === event.currentTarget &&
                        (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        event.currentTarget.click();
                    }
                } },
                React.createElement("td", null,
                    React.createElement("strong", null, q.number),
                    React.createElement("small", null,
                        q.customer.name,
                        " \u00B7 v",
                        q.revision,
                        " \u00B7 ",
                        q.language === "ko" ? "국문" : "영문")),
                React.createElement("td", null, q.lines.map((line) => {
                    const equipment = state.equipment.find((item) => item.id === line.equipmentId);
                    return React.createElement("small", { key: line.equipmentId },
                        equipment?.model || line.model,
                        " \u00B7 ",
                        equipment?.number || line.number || "번호 없음");
                })),
                React.createElement("td", null,
                    React.createElement(Badge, { tone: state.deals.find((deal) => deal.id === q.dealId)?.status === "확정" ? "blue" : undefined }, state.deals.find((deal) => deal.id === q.dealId)?.status === "확정" ? "확정(실비)" : "예상(영업)")),
                React.createElement("td", { className: "num" },
                    fmt(q.lines.reduce((a, l) => a +
                        moneyParts(l.amount, q.currency, q.vat, q.taxRate).total, 0), q.currency),
                    " ",
                    q.currency),
                React.createElement("td", null, date(q.createdAt)),
                React.createElement("td", null, personName(state, q.createdBy)),
                React.createElement("td", null,
                    React.createElement("div", { className: "actions" },
                        React.createElement("a", { className: "btn sm", href: `/api/quotes/${q.id}/pdf`, target: "_blank", rel: "noreferrer", onClick: (event) => event.stopPropagation() },
                            React.createElement(FileText, { size: 14 }),
                            "PDF \uBCF4\uAE30"),
                        allowed("quotes", "download") && (React.createElement("a", { className: "btn sm", href: `/api/quotes/${q.id}/pdf?download=1`, download: `${q.number}.pdf`, onClick: (event) => event.stopPropagation() },
                            React.createElement(Download, { size: 14 }),
                            "\uB2E4\uC6B4\uB85C\uB4DC")),
                        allowed("quotes", "create") && (React.createElement(Button, { small: true, onClick: (event) => {
                                event.stopPropagation();
                                open(React.createElement(QuoteForm, { deal: state.deals.find((d) => d.id === q.dealId), previous: q }));
                            } }, "\uC0C8 \uBC84\uC804"))),
                    state.files.filter((file) => file.targetType === "quotes" && file.targetId === q.id && !file.deletedAt).map((file) => React.createElement("small", { key: file.id }, file.name)))))))))) : (React.createElement(Empty, { title: "\uBC1C\uD589\uB41C \uACAC\uC801\uC11C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4", description: "\uC601\uC5C5 \uAC74\uC744 \uC120\uD0DD\uD574 \uACAC\uC801\uC11C\uB97C \uB9CC\uB4E4\uBA74 PDF\uAC00 \uBC84\uC804\uBCC4\uB85C \uBCF4\uAD00\uB429\uB2C8\uB2E4." }));
}
function QuoteDetail({ quote }) {
    const { state, close, open, allowed } = useApp();
    const deal = state.deals.find((item) => item.id === quote.dealId);
    return (React.createElement(Modal, { title: quote.number, subtitle: `${quote.customer.name} · ${deal?.name || "영업 건"}`, wide: true, drawer: true, onClose: close },
        React.createElement("div", { className: "modal-body detail-body" },
            React.createElement("div", { className: "quote-detail-grid" },
                React.createElement("div", null,
                    React.createElement("small", null, "\uAD6C\uBD84"),
                    React.createElement("strong", null, deal?.status === "확정" ? "확정(실비)" : "예상(영업)")),
                React.createElement("div", null,
                    React.createElement("small", null, "\uBC84\uC804 / \uC5B8\uC5B4"),
                    React.createElement("strong", null,
                        "v",
                        quote.revision,
                        " \u00B7 ",
                        quote.language === "ko" ? "국문" : "영문")),
                React.createElement("div", null,
                    React.createElement("small", null, "\uC791\uC131\uC77C / \uC791\uC131\uC790"),
                    React.createElement("strong", null,
                        date(quote.createdAt),
                        " \u00B7 ",
                        personName(state, quote.createdBy))),
                React.createElement("div", null,
                    React.createElement("small", null, "\uC720\uD6A8\uAE30\uAC04"),
                    React.createElement("strong", null, quote.validUntil || "—")),
                React.createElement("div", null,
                    React.createElement("small", null, "\uD1B5\uD654 / \uBD80\uAC00\uC138"),
                    React.createElement("strong", null,
                        quote.currency,
                        " \u00B7 ",
                        quote.vat === "included" ? "포함" : quote.vat === "none" ? "미적용" : "별도")),
                React.createElement("div", null,
                    React.createElement("small", null, "\uC801\uC6A9 \uD658\uC728"),
                    React.createElement("strong", null,
                        quote.fx || "—",
                        " \u00B7 ",
                        quote.fxDate || "—"))),
            React.createElement("h3", null, "\uC5F0\uB3D9 \uC124\uBE44 \u00B7 \uAE08\uC561"),
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "\uC124\uBE44"),
                            React.createElement("th", null, "\uC124\uBE44\uBC88\uD638"),
                            React.createElement("th", { className: "num" }, "\uAE08\uC561"))),
                    React.createElement("tbody", null, quote.lines.map((line) => {
                        const equipment = state.equipment.find((item) => item.id === line.equipmentId);
                        return React.createElement("tr", { key: line.equipmentId, className: equipment ? "clickable" : "", onClick: () => equipment && open(React.createElement(EquipmentDetail, { id: equipment.id })) },
                            React.createElement("td", null, equipment?.model || line.model),
                            React.createElement("td", null, equipment?.number || line.number || "—"),
                            React.createElement("td", { className: "num" },
                                fmt(line.amount, quote.currency),
                                " ",
                                quote.currency));
                    })))),
            React.createElement("h3", null, "\uAC70\uB798\uC870\uAC74 \uBC0F \uBE44\uACE0"),
            React.createElement("p", { className: "quote-detail-terms" }, quote.terms || "—"),
            React.createElement("div", { className: "actions" },
                React.createElement("a", { className: "btn", href: `/api/quotes/${quote.id}/pdf`, target: "_blank", rel: "noreferrer" },
                    React.createElement(FileText, { size: 14 }),
                    " \uC138\uBD80 \uACAC\uC801 PDF \uBCF4\uAE30"),
                allowed("quotes", "download") && React.createElement("a", { className: "btn", href: `/api/quotes/${quote.id}/pdf?download=1`, download: `${quote.number}.pdf` },
                    React.createElement(Download, { size: 14 }),
                    " \uB2E4\uC6B4\uB85C\uB4DC"),
                deal && React.createElement(Button, { small: true, onClick: () => open(React.createElement(DealDetail, { id: deal.id })) }, "\uC601\uC5C5 \uAC74 \uBCF4\uAE30")),
            React.createElement(FilesPanel, { targetType: "quotes", targetId: quote.id }))));
}
export function TagsPage() {
    const { state, open, close, allowed } = useApp();
    const [tag, setTag] = useViewState("tag", "전체");
    const [page, setPage] = useViewState("page", 1);
    useResetOnChange(() => setPage(1), [tag]);
    const rows = state.memos.filter((m) => tag === "전체" || m.tags.includes(tag));
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uD0DC\uADF8 \uBAA8\uC544\uBCF4\uAE30", description: "\uC5C5\uBB34\uBCC4\uB85C \uD769\uC5B4\uC9C4 \uBA54\uBAA8\uB97C \uD0DC\uADF8\uB85C \uBAA8\uC544 \uD655\uC778\uD558\uC138\uC694." },
            allowed("tags", "manage") && (React.createElement(Button, { icon: Pencil, onClick: () => open(React.createElement(TagManage, null)) }, "\uD0DC\uADF8 \uAD00\uB9AC")),
            allowed("tags", "manage") && (React.createElement(Button, { icon: Plus, onClick: () => open(React.createElement(TagForm, null)) }, "\uD0DC\uADF8 \uCD94\uAC00"))),
        React.createElement("div", { className: "tag-filter" }, ["전체", ...state.tags].map((t) => (React.createElement("button", { className: tag === t ? "active" : "", key: t, onClick: () => setTag(t) },
            t === "전체" ? t : "#" + t,
            React.createElement("span", null, state.memos.filter((m) => t === "전체" || m.tags.includes(t))
                .length))))),
        React.createElement("div", { className: "tag-memos" }, rows
            .slice((Math.min(page, Math.max(1, Math.ceil(rows.length / 40))) - 1) * 40, Math.min(page, Math.max(1, Math.ceil(rows.length / 40))) * 40)
            .map((m) => (React.createElement(Panel, { key: m.id },
            React.createElement("div", { className: "tag-memo-body" },
                React.createElement("div", { className: "memo-meta" },
                    React.createElement("strong", null, m.id.startsWith("legacy-")
                        ? "구버전 기록"
                        : personName(state, m.createdBy)),
                    React.createElement("span", null, date(m.updatedAt)),
                    React.createElement("button", { className: "text-button", onClick: () => open(React.createElement(Modal, { title: "\uBA54\uBAA8 \uC804\uCCB4", onClose: close },
                            React.createElement("div", { className: "modal-body rich-content", dangerouslySetInnerHTML: { __html: m.body } }))) }, "\uBA54\uBAA8 \uC804\uCCB4 \uBCF4\uAE30"),
                    React.createElement("button", { className: "text-button", disabled: !["equipment", "customers", "deals"].includes(m.targetType), onClick: () => {
                            if (m.targetType === "equipment")
                                open(React.createElement(EquipmentDetail, { id: m.targetId }));
                            else if (m.targetType === "deals")
                                open(React.createElement(DealDetail, { id: m.targetId }));
                            else if (m.targetType === "customers")
                                open(React.createElement(CustomerDetail, { id: m.targetId }));
                        } },
                        "\uC6D0\uBCF8 \uBCF4\uAE30 ",
                        React.createElement(ArrowUpRight, { size: 13 }))),
                React.createElement("div", { className: "memo-excerpt", children: m.body
                        .replace(/<[^>]*>/g, " ")
                        .replace(/&nbsp;/g, " ")
                        .slice(0, 500) }),
                React.createElement("div", { className: "tag-row" }, m.tags.map((t) => (React.createElement("span", { key: t, className: "tag" },
                    "#",
                    t))))))))),
        React.createElement(Pagination, { total: rows.length, page: page, onChange: setPage, size: 40 }),
        !rows.length && React.createElement(Empty, { title: "\uC774 \uD0DC\uADF8\uC758 \uBA54\uBAA8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4" })));
}
function TagForm() {
    const { act, close } = useApp();
    const [name, set] = useState(""), [error, setError] = useState("");
    return (React.createElement(Modal, { title: "\uD0DC\uADF8 \uCD94\uAC00", onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                try {
                    await act({ action: "tags", data: { name } });
                    close();
                }
                catch (e) {
                    setError(e.message);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement(Field, { label: "\uD0DC\uADF8 \uC774\uB984" },
                    React.createElement("input", { autoFocus: true, required: true, maxLength: 40, value: name, onChange: (e) => set(e.target.value) })),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { primary: true }, "\uCD94\uAC00")))));
}
function TagManage() {
    const { state, act, close } = useApp();
    const [names, set] = useState(Object.fromEntries(state.tags.map((t) => [t, t]))), [error, setError] = useState("");
    return (React.createElement(Modal, { title: "\uD0DC\uADF8 \uAD00\uB9AC", onClose: close },
        React.createElement("div", { className: "modal-body" },
            React.createElement("p", { className: "hint" }, "\uD0DC\uADF8\uB97C \uC0AD\uC81C\uD574\uB3C4 \uBA54\uBAA8 \uBCF8\uBB38\uC740 \uBCF4\uC874\uB429\uB2C8\uB2E4."),
            state.tags.map((t) => (React.createElement("div", { className: "tag-manage-row", key: t },
                React.createElement("input", { "aria-label": `${t} 태그명`, value: names[t] ?? t, onChange: (e) => set({ ...names, [t]: e.target.value }) }),
                React.createElement(Button, { small: true, disabled: names[t] === t, onClick: async () => {
                        try {
                            await act({
                                action: "tags",
                                data: { name: t, renameTo: names[t] },
                            });
                        }
                        catch (e) {
                            setError(e.message);
                        }
                    } }, "\uC774\uB984 \uC800\uC7A5"),
                React.createElement(IconButton, { icon: Trash2, label: `${t} 태그 삭제`, onClick: async () => {
                        if (confirm(`${t} 태그 연결을 삭제할까요? 메모 본문은 유지됩니다.`))
                            try {
                                await act({
                                    action: "tags",
                                    data: { name: t, remove: true },
                                });
                            }
                            catch (e) {
                                setError(e.message);
                            }
                    } })))),
            React.createElement(ErrorNote, { error: error }))));
}
