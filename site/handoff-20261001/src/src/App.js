import React, { useEffect, useState, useCallback } from "react";
import { LayoutDashboard, Package, FileText, Handshake, Users, FolderOpen, Calculator, CalendarDays, Tags, Settings, Bell, Search, Plus, ChevronRight, LogOut, ArrowUpRight, Menu, Check, AlertTriangle, RotateCw, X, Cloud, ShieldCheck, Star, Clock, } from "lucide-react";
import { clearViewState } from "./hooks.js";
import { installTableResizing } from "./table-resize.js";
import { can } from "../shared/domain.mjs";
import { rankSearch } from "../shared/search.mjs";
import { searchableText, recordText } from "../shared/profiles.mjs";
import { AppContext, request, Button, IconButton, Field, ErrorNote, Modal, bytes, Badge, } from "./ui.js";
const lazyPage = (load, name) => React.lazy(() => load().then((module) => ({ default: module[name] })));
const business = () => import("./business.js");
const drive = () => import("./drive.js");
const workspace = () => import("./workspace.js");
const Dashboard = lazyPage(business, "Dashboard"), EquipmentPage = lazyPage(business, "EquipmentPage"), EquipmentDetail = lazyPage(business, "EquipmentDetail"), CustomerDetail = lazyPage(business, "CustomerDetail"), CustomersPage = lazyPage(business, "CustomersPage"), DealsPage = lazyPage(business, "DealsPage"), DealDetail = lazyPage(business, "DealDetail"), QuotesPage = lazyPage(business, "QuotesPage"), TagsPage = lazyPage(business, "TagsPage");
const DrivePage = lazyPage(drive, "DrivePage"), TrashPage = lazyPage(drive, "TrashPage"), FilePreview = lazyPage(drive, "FilePreview");
const Accounting = lazyPage(() => import("./Accounting.js"), "Accounting");
const TaxPage = lazyPage(() => import("./Missions.js"), "TaxPage"), PurchasesPage = lazyPage(() => import("./Missions.js"), "PurchasesPage");
const MailPage = lazyPage(() => import("./Mail.js"), "MailPage");
const CalendarPage = lazyPage(workspace, "CalendarPage"), AccountingPage = lazyPage(workspace, "AccountingPage"), SettingsPage = lazyPage(workspace, "SettingsPage"), CategoryForm = lazyPage(workspace, "CategoryForm");

function ViewDashboard({ page, state, category }) {
    if (!state || page === "dashboard")
        return null;
    const count = (rows, fn = () => true) => (rows || []).filter(fn).length;
    const sum = (rows, fn) => (rows || []).reduce((total, item) => total + Number(fn(item) || 0), 0);
    const money = (value) => "₩" + new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const catEquipment = (state.equipment || []).filter((item) => item.categoryId === category?.id);
    const catDeals = (state.deals || []).filter((item) => item.categoryId === category?.id);
    const catPurchases = (state.purchases || []).filter((item) => item.categoryId === category?.id);
    const catQuotes = (state.quotes || []).filter((quote) => catDeals.some((deal) => deal.id === quote.dealId));
    const monthEntries = (state.cashEntries || []).filter((item) => !item.cancelled && item.date?.startsWith(month));
    const income = sum(monthEntries.filter((item) => item.kind === "income"), (item) => item.amount);
    const expense = sum(monthEntries.filter((item) => item.kind === "expense"), (item) => item.amount);
    const sendable = count(state.customers, (customer) => !customer.blocked && (customer.contacts || []).some((person) => person.email));
    const fileRows = (state.files || []).filter((item) => item.categoryId === category?.id && !item.deletedAt);
    const metrics = {
        equipment: [["전체 상품", catEquipment.length], ["영업 연결", count(catEquipment, (e) => catDeals.some((d) => d.status === "진행중" && (d.lines || []).some((l) => l.equipmentId === e.id)))], ["판매 확정", count(catEquipment, (e) => catDeals.some((d) => d.status === "확정" && (d.lines || []).some((l) => l.equipmentId === e.id && !l.cancelled)))], ["특별 상품", count(catEquipment, (e) => e.featured)]],
        customers: [["전체 고객", (state.customers || []).length], ["발송 가능", sendable], ["송신 금지", count(state.customers, (c) => c.blocked)], ["Dealer", count(state.customers, (c) => c.kind === "Dealer")]],
        deals: [["전체 영업", catDeals.length], ["진행중", count(catDeals, (d) => d.status === "진행중")], ["확정", count(catDeals, (d) => d.status === "확정")], ["확정 매출", money(sum(catDeals.filter((d) => d.status === "확정"), (d) => sum((d.lines || []).filter((l) => !l.cancelled), (l) => l.sellKrw ?? l.amount)))]],
        quotes: [["보관 견적", catQuotes.length], ["진행중 영업 견적", count(catQuotes, (q) => catDeals.find((d) => d.id === q.dealId)?.status === "진행중")], ["확정 영업 견적", count(catQuotes, (q) => catDeals.find((d) => d.id === q.dealId)?.status === "확정")], ["국문 / 영문", count(catQuotes, (q) => q.language === "ko") + " / " + count(catQuotes, (q) => q.language === "en")]],
        files: [["폴더", count(state.folders, (f) => f.categoryId === category?.id && !f.deletedAt)], ["파일", fileRows.length], ["준비 완료", count(fileRows, (f) => f.status === "ready")], ["용량", new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(sum(fileRows, (f) => f.size)) + "B"]],
        drive: [["폴더", count(state.folders, (f) => f.categoryId === category?.id && !f.deletedAt)], ["파일", fileRows.length], ["준비 완료", count(fileRows, (f) => f.status === "ready")], ["연결 자료", count(fileRows, (f) => f.targetId)]],
        calendar: [["전체 일정", count(state.events, (e) => !e.deletedAt)], ["오늘 이후", count(state.events, (e) => !e.deletedAt && String(e.start || "").slice(0, 10) >= today)], ["종일 일정", count(state.events, (e) => e.allDay)], ["미확인 알림", count(state.notifications, (n) => !n.read)]],
        accounting: [["자금 계좌", count(state.cashAccounts, (a) => a.active)], ["이번 달 수입", money(income)], ["이번 달 지출", money(expense)], ["이번 달 차액", money(income - expense)]],
        tax: [["세금계산서 폴더", count(state.folders, (f) => f.categoryId === "tax-documents" && !f.deletedAt)], ["세금계산서 파일", count(state.files, (f) => f.categoryId === "tax-documents" && !f.deletedAt)], ["매입 확정", count(state.purchases, (p) => p.status === "확정")], ["회계 증빙 연결", count(state.cashEntries, (e) => (e.fileIds || []).length > 0)]],
        purchases: [["전체 매입", catPurchases.length], ["진행중", count(catPurchases, (p) => p.status === "진행중")], ["확정", count(catPurchases, (p) => p.status === "확정")], ["확정 매입액", money(sum(catPurchases.filter((p) => p.status === "확정"), (p) => p.amount))]],
        mail: [["메일 양식", (state.mailTemplates || []).length], ["발송 가능 고객", sendable], ["상품 후보", catEquipment.length], ["보관 파일", (state.files || []).length]],
        tags: [["태그", (state.tags || []).length], ["메모", (state.memos || []).length], ["태그된 메모", count(state.memos, (m) => (m.tags || []).length > 0)], ["고객 그룹", new Set((state.customers || []).map((c) => c.groupName).filter(Boolean)).size]],
        trash: [["휴지통", (state.trash || []).length], ["삭제 고객", count(state.trash, (x) => x.type === "customers")], ["삭제 상품", count(state.trash, (x) => x.type === "equipment")], ["삭제 파일", count(state.trash, (x) => x.type === "files")]],
        settings: [["사용자", (state.users || []).length], ["활성 사용자", count(state.users, (u) => u.active)], ["업무 카테고리", (state.categories || []).length], ["변경 로그", (state.logs || []).length]]
    }[page];
    if (!metrics)
        return null;
    return React.createElement("div", { className: "mission-kpis view-dashboard", "aria-label": "현재 화면 요약" }, metrics.map(([label, value]) => React.createElement("div", { key: label },
        React.createElement("small", null, label),
        React.createElement("strong", null, value))));
}
class ScreenBoundary extends React.Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    render() {
        return this.state.error ? (React.createElement("div", { className: "empty", role: "alert" },
            React.createElement("h2", null, "\uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4"),
            React.createElement("p", null, "\uC5F0\uACB0\uC744 \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uC5F4\uC5B4 \uC8FC\uC138\uC694."),
            React.createElement(Button, { onClick: () => location.reload() }, "\uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30"))) : (this.props.children);
    }
}
const screenLoading = (React.createElement("div", { className: "empty", role: "status" }, "\uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\u2026"));
const navs = [
    ["현황", [["dashboard", "대시보드", LayoutDashboard]]],
    [
        "설비",
        [
            ["equipment", "상품 관리", Package],
            ["quotes", "견적 관리", FileText],
        ],
    ],
    [
        "영업",
        [
            ["deals", "영업 관리", Handshake],
            ["mail", "메일 발송", FileText],
            ["customers", "고객 관리", Users],
        ],
    ],
    [
        "관리",
        [
            ["files", "자료실", FolderOpen],
            ["tax", "세금계산서", FileText],
            ["accounting", "회계 관리", Calculator],
        ],
    ],
];
export default function App() {
    useEffect(() => installTableResizing(), []);
    const snapshot = React.useRef({ state: null, digests: {}, revision: "" });
    const stateQueue = React.useRef(Promise.resolve());
    const stateRequest = useCallback((url, options = {}) => {
        const work = stateQueue.current
            .catch(() => { })
            .then(async () => {
            const current = snapshot.current;
            const r = await request(url, {
                ...options,
                headers: {
                    "X-Incremental-State": "1",
                    "X-State-Digests": JSON.stringify(current.digests),
                    "X-State-Revision": current.revision,
                    ...options.headers,
                },
            });
            if (!r.unchanged) {
                const next = r.partial ? { ...current.state, ...r.state } : r.state;
                snapshot.current = {
                    state: next,
                    digests: r.digests || {},
                    revision: r.revision || "",
                };
                setState(next);
            }
            return { ...r, state: snapshot.current.state };
        });
        stateQueue.current = work;
        return work;
    }, []);
    const [state, setState] = useState(null), [config, setConfig] = useState(null), [error, setError] = useState(""), [loading, setLoading] = useState(true), [modal, setModal] = useState(null), [toast, setToast] = useState(null), [route, setRoute] = useState(() => ({
        page: new URLSearchParams(location.search).get("page") || "dashboard",
        category: new URLSearchParams(location.search).get("category") || "used",
    })), [mobileNav, setMobileNav] = useState(false), [busy, setBusy] = useState(false);
    const currentUrl = React.useRef(location.href);
    const [passwordSetup, setPasswordSetup] = useState(false);
    const notify = (message, tone = "success") => setToast({ message, tone, id: Date.now() });
    const reload = useCallback(async () => {
        try {
            const { state: s } = await stateRequest("/api/state");
            setError("");
            return s;
        }
        catch (e) {
            if (e.status === 401) {
                setState(null);
                snapshot.current = { state: null, digests: {}, revision: "" };
            }
            else
                setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }, [stateRequest]);
    useEffect(() => {
        request("/api/config")
            .then(setConfig)
            .catch((e) => setError(e.message));
        const hash = new URLSearchParams(location.hash.slice(1));
        if (hash.has("access_token") && hash.has("refresh_token")) {
            const body = {
                accessToken: hash.get("access_token"),
                refreshToken: hash.get("refresh_token"),
            };
            history.replaceState(null, "", location.pathname + location.search);
            request("/api/auth-callback", {
                method: "POST",
                body: JSON.stringify(body),
            })
                .then(() => {
                setPasswordSetup(true);
                setLoading(false);
            })
                .catch((e) => {
                setError(e.message);
                setLoading(false);
            });
        }
        else
            reload();
    }, []);
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 4500);
            return () => clearTimeout(t);
        }
    }, [toast]);
    useEffect(() => {
        if (!state)
            return;
        const refresh = () => {
            if (document.visibilityState === "visible" &&
                !document.querySelector("dialog[open]") &&
                !document.querySelector('[data-unsaved="true"]'))
                reload();
        };
        window.addEventListener("focus", refresh);
        const timer = setInterval(refresh, 60000);
        return () => {
            window.removeEventListener("focus", refresh);
            clearInterval(timer);
        };
    }, [!!state, reload]);
    useEffect(() => {
        const fn = () => {
            if (document.querySelector('[data-unsaved="true"]') &&
                !confirm("저장하지 않은 변경 사항이 있습니다. 이동할까요?")) {
                history.pushState(null, "", currentUrl.current);
                return;
            }
            setRoute({
                page: new URLSearchParams(location.search).get("page") || "dashboard",
                category: new URLSearchParams(location.search).get("category") || "used",
            });
        };
        window.addEventListener("popstate", fn);
        return () => window.removeEventListener("popstate", fn);
    }, []);
    useEffect(() => {
        currentUrl.current = location.href;
        document.title = `${{ dashboard: "대시보드", equipment: "상품 관리", customers: "고객사 관리", deals: "영업 관리", quotes: "견적 관리", drive: "자료실", files: "자료실", tax: "세금계산서", accounting: "회계 관리", calendar: "캘린더", mail: "메일 발송", tags: "태그", settings: "설정", trash: "휴지통", purchases: "매입 거래" }[route.page] || "업무"} · SEIN`;
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [route.page, route.category]);
    const navigate = (page, category = route.category, params = {}) => {
        if (document.querySelector('[data-unsaved="true"]') &&
            !confirm("저장하지 않은 변경 사항이 있습니다. 이동할까요?"))
            return;
        setModal(null);
        setRoute({ page, category });
        history.pushState(null, "", `?${new URLSearchParams({ page, category, ...params })}`);
        setMobileNav(false);
    };
    const act = async (command) => {
        setBusy(true);
        try {
            const r = await stateRequest("/api/command", {
                method: "POST",
                body: JSON.stringify(command),
            });
            if (!command.silent)
                notify("저장했습니다.");
            return r.resultId;
        }
        catch (e) {
            if (e.status === 401) {
                setState(null);
                snapshot.current = { state: null, digests: {}, revision: "" };
                setModal(null);
            }
            throw e;
        }
        finally {
            setBusy(false);
        }
    };
    const close = () => setModal(null);
    const open = (content) => {
        if (document.querySelector('dialog [data-unsaved="true"]') &&
            !confirm("저장하지 않은 변경 사항이 있습니다. 다른 창을 열까요?"))
            return;
        setModal(content);
    };
    const readonly = false;
    const category = state?.categories.find((c) => c.id === route.category) ||
        state?.categories[0];
    const allowed = (menu, action = "view") => can(state?.me, menu, action);
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                if (state)
                    document.getElementById("global-search-input")?.focus();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [state]);
    useEffect(() => {
        const overflowCell = (target) => {
            const cell = target.closest(".table-scroll th, .table-scroll td");
            if (!cell || cell.querySelector("input, select, textarea"))
                return null;
            const text = cell.innerText.replace(/\s+/g, " ").trim();
            if (!text)
                return null;
            const descendants = [...cell.querySelectorAll("*")];
            const clipped = cell.scrollWidth > cell.clientWidth ||
                descendants.some((item) => item.scrollWidth > item.clientWidth);
            return clipped ? { cell, text } : null;
        };
        const showOverflowText = (event) => {
            const overflow = overflowCell(event.target);
            if (overflow && !overflow.cell.title)
                overflow.cell.title = overflow.text;
        };
        const openOverflowText = (event) => {
            if (event.target.closest("button, a, input, select, textarea, [role='button'], tr.clickable"))
                return;
            const overflow = overflowCell(event.target);
            if (!overflow)
                return;
            setModal(React.createElement(OverflowCellPreview, { text: overflow.text, onClose: () => setModal(null) }));
        };
        document.addEventListener("mouseover", showOverflowText);
        document.addEventListener("click", openOverflowText);
        return () => {
            document.removeEventListener("mouseover", showOverflowText);
            document.removeEventListener("click", openOverflowText);
        };
    }, []);
    if (loading)
        return (React.createElement("div", { className: "boot" },
            React.createElement("div", { className: "brand-mark" }, "SEIN"),
            React.createElement("p", null, "\uC5C5\uBB34 \uACF5\uAC04\uC744 \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4\u2026")));
    const ctx = {
        state,
        config,
        reload,
        act,
        notify,
        open,
        close,
        navigate,
        category,
        readonly,
        viewId: route.page,
        allowed,
    };
    if (passwordSetup)
        return (React.createElement(PasswordSetup, { onDone: () => {
                setPasswordSetup(false);
                setState(null);
            } }));
    if (!state)
        return (React.createElement(AppContext.Provider, { value: ctx },
            React.createElement(Login, { config: config, error: error, onLogin: reload })));
    const pages = {
        dashboard: React.createElement(Dashboard, null),
        equipment: React.createElement(EquipmentPage, null),
        customers: React.createElement(CustomersPage, null),
        deals: React.createElement(DealsPage, null),
        quotes: React.createElement(QuotesPage, null),
        files: React.createElement(DrivePage, null),
        drive: React.createElement(DrivePage, null),
        calendar: React.createElement(CalendarPage, null),
        accounting: React.createElement(Accounting, null),
        tax: React.createElement(TaxPage, null),
        purchases: React.createElement(PurchasesPage, null),
        mail: React.createElement(MailPage, null),
        settings: React.createElement(SettingsPage, null),
        tags: React.createElement(TagsPage, null),
        trash: React.createElement(TrashPage, null),
    };
    const page = category?.type === "drive" &&
        ["dashboard", "equipment", "deals", "quotes", "files"].includes(route.page)
        ? "drive"
        : route.page;
    const authMenu = {
        drive: "files",
        tax: "files",
        purchases: "deals",
        trash: "files",
        dashboard: "equipment",
        settings: "accounts",
    }[page] || page;
    const dashboardCategory = state.categories.find((item) => item.type !== "drive")?.id || category.id;
    const navCounts = {
        equipment: state.equipment.filter((item) => item.categoryId === category.id)
            .length,
        deals: state.deals.filter((item) => item.categoryId === category.id).length,
        quotes: state.quotes.filter((quote) => state.deals.some((deal) => deal.id === quote.dealId && deal.categoryId === category.id)).length,
        customers: state.customers.length,
    };
    return (React.createElement(AppContext.Provider, { value: ctx },
        React.createElement("div", { className: "app" },
            React.createElement("header", { className: "topbar" },
                React.createElement("div", { className: "brand" },
                    React.createElement("button", { className: "mobile-menu icon-btn", "aria-label": "\uBA54\uB274 \uC5F4\uAE30", onClick: () => setMobileNav(!mobileNav) },
                        React.createElement(Menu, { size: 20 })),
                    React.createElement("a", { className: "brand-home", href: `?${new URLSearchParams({
                            page: "dashboard",
                            category: dashboardCategory,
                        })}`, "aria-label": "\uC138\uC778\uCF54\uD37C\uB808\uC774\uC158 \uB300\uC2DC\uBCF4\uB4DC \uC0C8\uB85C\uACE0\uCE68", onClick: (event) => {
                            if (document.querySelector('[data-unsaved="true"]') &&
                                !confirm("저장하지 않은 변경 사항이 있습니다. 대시보드로 이동할까요?"))
                                event.preventDefault();
                        } },
                        React.createElement("span", { className: "brand-mark" }, "SEIN"),
                        React.createElement("span", { className: "brand-title" },
                            "\uC138\uC778\uCF54\uD37C\uB808\uC774\uC158",
                            React.createElement("small", null, "\uB0B4\uBD80 \uAD00\uB9AC \uC2DC\uC2A4\uD15C")))),
                React.createElement("nav", { className: "categories", "aria-label": "\uC5C5\uBB34 \uCE74\uD14C\uACE0\uB9AC" },
                    state.categories.map((c) => (React.createElement("button", { key: c.id, className: category.id === c.id ? "active" : "", onClick: () => navigate(c.type === "drive" ? "drive" : "dashboard", c.id) }, c.name))),
                    state.categories.length < 4 && allowed("categories", "manage") && (React.createElement("button", { className: "add-category", onClick: () => open(React.createElement(CategoryForm, null)) },
                        React.createElement(Plus, { size: 13 }),
                        "\uCE74\uD14C\uACE0\uB9AC"))),
                React.createElement(GlobalSearch, null),
                React.createElement("div", { className: "top-tools" },
                    React.createElement("button", { className: "notification-button icon-btn", "aria-label": "\uC54C\uB9BC", onClick: () => open(React.createElement(Notifications, null)) },
                        React.createElement(Bell, { size: 19 }),
                        state.notifications.some((n) => !n.read) && React.createElement("i", null)),
                    React.createElement("button", { className: "profile", onClick: () => open(React.createElement(Profile, { onLogout: async () => {
                                await stateQueue.current.catch(() => { });
                                await request("/api/logout", { method: "POST" });
                                snapshot.current = {
                                    state: null,
                                    digests: {},
                                    revision: "",
                                };
                                clearViewState();
                                setState(null);
                                close();
                            } })) },
                        React.createElement("span", { className: "avatar" }, state.me.name.slice(0, 1)),
                        React.createElement("span", null,
                            state.me.name,
                            React.createElement("small", null, state.me.role === "master" ? "대표" : "담당자"))))),
            React.createElement("div", { className: "shell" },
                mobileNav && (React.createElement("div", { className: "nav-scrim", onClick: () => setMobileNav(false) })),
                React.createElement("aside", { className: `sidebar ${mobileNav ? "mobile-open" : ""}` },
                    React.createElement("div", { className: "workspace-label" },
                        React.createElement("span", { className: "live-dot" }),
                        category.type === "drive" ? "제품 자료 공간" : "업무 공간",
                        React.createElement("span", { className: "workspace-initial" }, category.type === "drive" ? "ASAHI" : "SEIN")),
                    (category.type === "drive"
                        ? [
                            [
                                "자료",
                                [
                                    ["drive", "제품 드라이브", FolderOpen],
                                    ["tax", "세금계산서", FileText],
                                    ["accounting", "회계 관리", Calculator],
                                ],
                            ],
                        ]
                        : navs).map(([group, items]) => (React.createElement("div", { className: "nav-group", key: group },
                        React.createElement("div", { className: "nav-label" }, group),
                        items
                            .filter(([key]) => can(state.me, {
                            dashboard: "equipment",
                            tax: "files",
                            purchases: "deals",
                        }[key] || key))
                            .map(([key, label, Icon]) => (React.createElement("button", { key: key, onClick: () => navigate(key), className: `nav-item ${page === key ? "active" : ""}` },
                            React.createElement(Icon, { size: 17 }),
                            React.createElement("span", null, label),
                            navCounts[key] !== undefined && (React.createElement("b", { className: "nav-count" }, navCounts[key])),
                            key === "accounting" && (React.createElement(ShieldCheck, { className: "nav-end", size: 13 })))))))),
                    React.createElement("div", { className: "nav-divider" }),
                    React.createElement("div", { className: "nav-group" },
                        React.createElement("div", { className: "nav-label" }, "\uACF5\uD1B5 \uC5C5\uBB34"),
                        [
                            ["calendar", "캘린더", CalendarDays],
                            ["tags", "태그 모아보기", Tags],
                            ["trash", "휴지통", FolderOpen],
                            ["settings", "계정 및 설정", Settings],
                        ]
                            .filter(([key]) => can(state.me, { trash: "files", settings: "accounts" }[key] || key))
                            .map(([key, label, Icon]) => (React.createElement("button", { key: key, className: `nav-item ${page === key ? "active" : ""}`, onClick: () => navigate(key) },
                            React.createElement(Icon, { size: 17 }),
                            React.createElement("span", null, label),
                            key === "settings" && (React.createElement(ShieldCheck, { className: "nav-end", size: 13 })))))),
                    React.createElement("div", { className: "sidebar-bottom" },
                        React.createElement("div", { className: "storage-title" },
                            React.createElement(Cloud, { size: 15 }),
                            React.createElement("span", null, "\uC800\uC7A5 \uACF5\uAC04"),
                            React.createElement("span", null,
                                Math.round((state.storage.used / state.storage.limit) * 100),
                                "%")),
                        React.createElement("div", { className: "meter" },
                            React.createElement("i", { style: {
                                    width: `${Math.min(100, (state.storage.used / state.storage.limit) * 100)}%`,
                                } })),
                        React.createElement("small", null,
                            bytes(state.storage.used),
                            " ",
                            React.createElement("span", null,
                                "/ ",
                                bytes(state.storage.limit))),
                        React.createElement("div", { className: "env-note" },
                            React.createElement("span", { className: "live-dot" }),
                            config?.demo
                                ? state.legacyMigration
                                    ? "이관 자료 · 로컬 저장"
                                    : "로컬 저장"
                                : "업무 데이터 연결됨"))),
                React.createElement("main", { className: "main" },
                    React.createElement("div", { className: "breadcrumb" },
                        React.createElement("span", null, category.name),
                        React.createElement(ChevronRight, { size: 12 }),
                        React.createElement("span", null, [
                            ...navs.flatMap((g) => g[1]),
                            ["drive", "제품 드라이브"],
                            ["calendar", "캘린더"],
                            ["tags", "태그 모아보기"],
                            ["trash", "휴지통"],
                            ["settings", "계정 및 설정"],
                        ].find((x) => x[0] === page)?.[1]),
                        React.createElement("div", { className: "save-status" }, busy ? ("저장 중…") : (React.createElement(React.Fragment, null,
                            React.createElement(Check, { size: 12 }),
                            "\uC5F0\uACB0\uB428 \u00B7 \uC800\uC7A5\uC740 \uAC01 \uD654\uBA74\uC5D0\uC11C \uD655\uC778")))),
                    error && (React.createElement("div", { className: "inline-error" },
                        React.createElement(AlertTriangle, { size: 16 }),
                        error,
                        React.createElement(Button, { small: true, icon: RotateCw, onClick: reload }, "\uB2E4\uC2DC \uC2DC\uB3C4"))),
                    can(state.me, authMenu) ? (React.createElement(ScreenBoundary, { key: `${page}:${category.id}` },
                        React.createElement(ViewDashboard, { page: page, state: state, category: category }),
                        React.createElement(React.Suspense, { fallback: screenLoading }, pages[page] || pages.dashboard))) : (React.createElement("div", { className: "empty" },
                        React.createElement(ShieldCheck, { size: 28 }),
                        React.createElement("h2", null, "\uC811\uADFC \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4"),
                        React.createElement("p", null, "\uB300\uD45C\uC5D0\uAC8C \uBA54\uB274 \uAD8C\uD55C\uC744 \uC694\uCCAD\uD574 \uC8FC\uC138\uC694."))),
                    React.createElement("footer", { className: "app-footer" },
                        React.createElement("span", null, "SEIN CORPORATION"),
                        React.createElement("span", null,
                            config?.demo
                                ? state.legacyMigration
                                    ? "구버전 이관 자료가 포함된 로컬 실행본"
                                    : "이 컴퓨터에 저장된 업무 공간"
                                : "내부 업무 전용",
                            " ",
                            "\u00B7 ",
                            new Date().getFullYear())))),
            React.createElement(React.Suspense, { fallback: screenLoading }, modal),
            toast && (React.createElement("div", { className: `toast ${toast.tone}`, role: "status" },
                React.createElement(Check, { size: 17 }),
                toast.message,
                React.createElement("button", { "aria-label": "\uC54C\uB9BC \uB2EB\uAE30", onClick: () => setToast(null) },
                    React.createElement(X, { size: 14 })))))));
}
function OverflowCellPreview({ text, onClose }) {
    return (React.createElement(Modal, { title: "\uC804\uCCB4 \uB0B4\uC6A9", onClose: onClose },
        React.createElement("div", { className: "modal-body" },
            React.createElement("div", { className: "equipment-memo-full" }, text)),
        React.createElement("footer", { className: "modal-foot" },
            React.createElement(Button, { onClick: onClose }, "\uB2EB\uAE30"))));
}
function PasswordSetup({ onDone }) {
    const [password, setPassword] = useState(""), [again, setAgain] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    return (React.createElement("div", { className: "login-screen" },
        React.createElement("div", { className: "login-art" },
            React.createElement("div", { className: "brand-mark large" }, "SEIN"),
            React.createElement("h1", null,
                "\uC548\uC804\uD55C \uC5C5\uBB34 \uACF5\uAC04\uC744",
                React.createElement("br", null),
                "\uC2DC\uC791\uD558\uC138\uC694.")),
        React.createElement("div", { className: "login-card" },
            React.createElement("h2", null, "\uBE44\uBC00\uBC88\uD638 \uC124\uC815"),
            React.createElement("p", null, "\uCD08\uB300\uBC1B\uC740 \uACC4\uC815\uC758 \uBE44\uBC00\uBC88\uD638\uB97C \uC9C1\uC811 \uC124\uC815\uD574 \uC8FC\uC138\uC694."),
            React.createElement("form", { onSubmit: async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                        if (password !== again)
                            throw Error("비밀번호가 일치하지 않습니다.");
                        await request("/api/password", {
                            method: "POST",
                            body: JSON.stringify({ password }),
                        });
                        onDone();
                    }
                    catch (e) {
                        setError(e.message);
                    }
                    finally {
                        setBusy(false);
                    }
                } },
                React.createElement(Field, { label: "\uC0C8 \uBE44\uBC00\uBC88\uD638" },
                    React.createElement("input", { type: "password", minLength: 12, required: true, autoComplete: "new-password", value: password, onChange: (e) => setPassword(e.target.value) })),
                React.createElement(Field, { label: "\uBE44\uBC00\uBC88\uD638 \uD655\uC778", hint: "12\uC790 \uC774\uC0C1\uC73C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694." },
                    React.createElement("input", { type: "password", minLength: 12, required: true, autoComplete: "new-password", value: again, onChange: (e) => setAgain(e.target.value) })),
                React.createElement(ErrorNote, { error: error }),
                React.createElement(Button, { primary: true, loading: busy }, "\uC124\uC815 \uD6C4 \uB85C\uADF8\uC778")))));
}
function Login({ config, error, onLogin }) {
    const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [localError, setError] = useState(error), [busy, setBusy] = useState(false);
    return (React.createElement("div", { className: "login-screen" },
        React.createElement("div", { className: "login-art" },
            React.createElement("div", { className: "brand-mark large" }, "SEIN"),
            React.createElement("span", { className: "eyebrow" }, "SEIN CORPORATION"),
            React.createElement("h1", null,
                "\uC77C\uC5D0 \uD544\uC694\uD55C \uBAA8\uB4E0 \uAC83,",
                React.createElement("br", null),
                "\uD55C \uACF5\uAC04\uC5D0\uC11C."),
            React.createElement("p", null,
                "\uC124\uBE44\uC640 \uACE0\uAC1D, \uC601\uC5C5\uACFC \uC790\uB8CC\uB97C",
                React.createElement("br", null),
                "\uAC04\uACB0\uD558\uAC8C \uC5F0\uACB0\uD558\uB294 \uC138\uC778\uC758 \uC5C5\uBB34 \uACF5\uAC04\uC785\uB2C8\uB2E4."),
            React.createElement("div", { className: "login-grid" },
                React.createElement("span", null,
                    "01",
                    React.createElement("span", null, "\uC124\uBE44 \uAD00\uB9AC")),
                React.createElement("span", null,
                    "02",
                    React.createElement("span", null, "\uC601\uC5C5 \u00B7 \uACAC\uC801")),
                React.createElement("span", null,
                    "03",
                    React.createElement("span", null, "\uC81C\uD488 \uC790\uB8CC")))),
        React.createElement("div", { className: "login-card" },
            React.createElement("h2", null, "\uC5C5\uBB34 \uACF5\uAC04\uC5D0 \uB85C\uADF8\uC778"),
            React.createElement("p", null, "\uCD08\uB300\uBC1B\uC740 \uD68C\uC0AC \uACC4\uC815\uC73C\uB85C \uC2DC\uC791\uD558\uC138\uC694."),
            config?.demo ? (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "demo-callout" },
                    React.createElement("strong", null, "\uB85C\uCEEC \uC5C5\uBB34 \uACF5\uAC04"),
                    React.createElement("p", null, "\uC774 \uCEF4\uD4E8\uD130\uC5D0 \uC800\uC7A5\uB41C \uC790\uB8CC\uB85C \uC5C5\uBB34\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uBCC0\uACBD \uB0B4\uC6A9\uC740 \uC774 \uCEF4\uD4E8\uD130\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4.")),
                React.createElement(Button, { primary: true, loading: busy, onClick: async () => {
                        setBusy(true);
                        try {
                            await request("/api/login", {
                                method: "POST",
                                body: JSON.stringify({ demo: true }),
                            });
                            await onLogin();
                        }
                        catch (e) {
                            setError(e.message);
                        }
                        finally {
                            setBusy(false);
                        }
                    } },
                    "\uB85C\uCEEC \uC5C5\uBB34 \uACF5\uAC04 \uC5F4\uAE30 ",
                    React.createElement(ArrowUpRight, { size: 16 })))) : (React.createElement("form", { onSubmit: async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                        await request("/api/login", {
                            method: "POST",
                            body: JSON.stringify({ email, password }),
                        });
                        await onLogin();
                    }
                    catch (e) {
                        setError(e.message);
                    }
                    finally {
                        setBusy(false);
                    }
                } },
                React.createElement(Field, { label: "\uC774\uBA54\uC77C" },
                    React.createElement("input", { type: "email", autoComplete: "username", required: true, value: email, onChange: (e) => setEmail(e.target.value) })),
                React.createElement(Field, { label: "\uBE44\uBC00\uBC88\uD638" },
                    React.createElement("input", { type: "password", autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value) })),
                React.createElement(Button, { primary: true, loading: busy }, "\uB85C\uADF8\uC778"),
                React.createElement("button", { type: "button", className: "text-button", onClick: async () => {
                        try {
                            const r = await request("/api/reset-password", {
                                method: "POST",
                                body: JSON.stringify({ email }),
                            });
                            setError(r.message);
                        }
                        catch (e) {
                            setError(e.message);
                        }
                    } }, "\uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815"))),
            React.createElement(ErrorNote, { error: localError }),
            React.createElement("small", null, "\uC0AC\uB0B4 \uC5C5\uBB34\uC6A9 \uC2DC\uC2A4\uD15C \u00B7 \uD5C8\uAC00\uB41C \uC0AC\uC6A9\uC790\uB9CC \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."))));
}
function GlobalSearch() {
    const { state, open, close, act, notify, navigate } = React.useContext(AppContext);
    const [q, setQ] = useState(""), [expanded, setExpanded] = useState(false);
    const preferences = state.me.searchPreferences || {
        recent: [],
        favorites: [],
    };
    const items = React.useMemo(() => [
        ...state.equipment
            .filter((x) => !x.locked)
            .map((x) => ({
            ...x,
            title: x.model,
            sub: `설비 · ${x.number}`,
            type: "equipment",
            searchText: searchableText(state, "equipment", x),
        })),
        ...state.customers.map((x) => ({
            ...x,
            title: x.name,
            sub: "고객사",
            type: "customers",
            searchText: searchableText(state, "customers", x),
        })),
        ...state.deals.map((x) => ({
            ...x,
            title: x.name,
            sub: `영업 · ${x.status}`,
            type: "deals",
            searchText: searchableText(state, "deals", x),
        })),
        ...state.quotes.map((x) => ({
            ...x,
            title: x.number,
            sub: `견적 · ${x.customer.name}`,
            type: "quotes",
            searchText: searchableText(state, "quotes", x),
        })),
        ...state.files
            .filter((x) => !x.locked)
            .map((x) => ({
            ...x,
            title: x.name,
            sub: "파일",
            type: "files",
            searchText: searchableText(state, "files", x),
        })),
        ...["folders", "events"].flatMap((type) => (state[type] || [])
            .filter((x) => !x.locked && !x.deletedAt)
            .map((x) => ({
            ...x,
            title: x.name || x.title,
            sub: type === "folders" ? "자료실 폴더 · 메모" : "일정",
            type,
            searchText: searchableText(state, type, x),
        }))),
        ...[
            ["purchases", "매입 거래", "purchases"],
            ["cashEntries", "입출금 내역", "accounting"],
            ["cashAccounts", "현금·은행 계좌", "accounting"],
            ["cashCategories", "회계 항목", "accounting"],
            ["sheets", "회계표", "accounting"],
            ["mailTemplates", "메일 템플릿", "mail"],
        ].flatMap(([type, label, page]) => (state[type] || [])
            .filter((x) => !x.deletedAt && !x.locked)
            .map((x) => ({
            ...x,
            type,
            page,
            title: x.name || x.title || x.note || x.date || label,
            sub: label,
            searchText: searchableText(state, type, x),
        }))),
    ], [
        state.equipment,
        state.customers,
        state.deals,
        state.quotes,
        state.files,
        state.folders,
        state.events,
        state.purchases,
        state.cashEntries,
        state.cashAccounts,
        state.cashCategories,
        state.sheets,
        state.mailTemplates,
        state.memos,
    ]);
    const matches = q.trim() ? rankSearch(q, items, 12) : [];
    const savePreferences = async (next) => {
        try {
            await act({ action: "search-preferences", data: next, silent: true });
        }
        catch (error) {
            notify(error.message, "warning");
        }
    };
    const remember = (term) => {
        const value = term.trim();
        if (!value)
            return;
        return savePreferences({ operation: "remember", term: value });
    };
    const toggleFavorite = (term) => {
        const value = term.trim();
        if (!value)
            return;
        return savePreferences({ operation: "toggle-favorite", term: value });
    };
    const choose = async (item) => {
        const saved = remember(q || item.title);
        setExpanded(false);
        if (item.type === "equipment")
            open(React.createElement(EquipmentDetail, { id: item.id }));
        else if (item.type === "customers")
            open(React.createElement(CustomerDetail, { id: item.id }));
        else if (item.type === "deals")
            open(React.createElement(DealDetail, { id: item.id }));
        else if (item.type === "files")
            open(React.createElement(FilePreview, { file: item }));
        else if (item.type === "folders" || item.type === "events" || item.page) {
            open(React.createElement(Modal, { drawer: true, title: item.title, subtitle: item.sub, onClose: close },
                React.createElement("div", { className: "modal-body" },
                    React.createElement("p", { className: "plain-note" }, recordText(state[item.type]?.find((x) => x.id === item.id))),
                    state.memos
                        .filter((m) => m.targetType === item.type &&
                        m.targetId === item.id &&
                        !m.deletedAt &&
                        !m.locked)
                        .map((m) => (React.createElement("p", { className: "plain-note", key: m.id }, m.text))),
                    React.createElement(Button, { onClick: () => {
                            close();
                            navigate(item.page || (item.type === "folders" ? "files" : "calendar"), item.categoryId || undefined);
                        } }, "\uD574\uB2F9 \uAD00\uB9AC \uD654\uBA74 \uC5F4\uAE30"))));
        }
        else if (item.type === "quotes") {
            await saved;
            window.location.assign(`/api/quotes/${item.id}/pdf`);
        }
    };
    return (React.createElement("div", { className: "global-search", onFocusCapture: () => setExpanded(true), onBlurCapture: (e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
                setExpanded(false);
        } },
        React.createElement("div", { className: "global-search-input" },
            React.createElement(Search, { size: 16 }),
            React.createElement("input", { id: "global-search-input", value: q, maxLength: 40, onChange: (e) => setQ(e.target.value), onKeyDown: (e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229)
                        return;
                    if (e.key === "Enter") {
                        e.preventDefault();
                        if (matches[0])
                            choose(matches[0]);
                        else
                            remember(q);
                    }
                    if (e.key === "ArrowDown" && matches.length) {
                        e.preventDefault();
                        e.currentTarget
                            .closest(".global-search")
                            .querySelector(".search-results button")
                            ?.focus();
                    }
                    if (e.key === "Escape") {
                        setExpanded(false);
                        e.currentTarget.blur();
                    }
                }, placeholder: "\uD1B5\uD569 \uAC80\uC0C9", "aria-label": "\uD1B5\uD569 \uAC80\uC0C9", autoComplete: "off" }),
            q ? (React.createElement("button", { "aria-label": "\uAC80\uC0C9\uC5B4 \uC9C0\uC6B0\uAE30", onClick: () => setQ("") },
                React.createElement(X, { size: 14 }))) : (React.createElement("kbd", null, "Ctrl K"))),
        expanded && (React.createElement("div", { className: "global-search-menu" },
            q.trim() && (React.createElement("div", { className: "search-query-row" },
                React.createElement("span", null,
                    "\u201C",
                    q.trim(),
                    "\u201D \uAC80\uC0C9"),
                React.createElement("button", { className: preferences.favorites.includes(q.trim()) ? "active" : "", onClick: () => toggleFavorite(q), "aria-pressed": preferences.favorites.includes(q.trim()) },
                    React.createElement(Star, { size: 14 }),
                    " \uC990\uACA8\uCC3E\uAE30"))),
            !q.trim() &&
                (preferences.favorites.length || preferences.recent.length) ? (React.createElement(React.Fragment, null,
                !!preferences.favorites.length && (React.createElement("div", { className: "search-terms" },
                    React.createElement("strong", null,
                        React.createElement(Star, { size: 13 }),
                        " \uC990\uACA8\uCC3E\uAE30"),
                    preferences.favorites.map((term) => (React.createElement("button", { key: term, onClick: () => setQ(term) }, term))))),
                !!preferences.recent.length && (React.createElement("div", { className: "search-terms" },
                    React.createElement("strong", null,
                        React.createElement(Clock, { size: 13 }),
                        " \uCD5C\uADFC \uAC80\uC0C9"),
                    preferences.recent.map((term) => (React.createElement("button", { key: term, onClick: () => setQ(term) }, term))))))) : null,
            q.trim() && (React.createElement("div", { className: "search-results" },
                matches.map((x) => (React.createElement("button", { key: x.type + x.id, onClick: () => choose(x) },
                    React.createElement(Search, { size: 15 }),
                    React.createElement("span", null,
                        React.createElement("strong", null, x.title),
                        React.createElement("small", null, x.sub)),
                    React.createElement(ChevronRight, { size: 14 })))),
                !matches.length && (React.createElement("p", { className: "empty" }, "\uBE44\uC2B7\uD55C \uAC80\uC0C9 \uACB0\uACFC\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.")))),
            !q.trim() &&
                !preferences.favorites.length &&
                !preferences.recent.length && (React.createElement("p", { className: "search-hint" }, "\uBAA8\uB378\uBA85\u00B7\uC124\uBE44\uBC88\uD638\u00B7\uACE0\uAC1D\uC0AC\u00B7\uC601\uC5C5\u00B7\uACAC\uC801\u00B7\uD30C\uC77C\uC744 \uAC80\uC0C9\uD569\uB2C8\uB2E4."))))));
}
function Notifications() {
    const { state, close, act, navigate } = React.useContext(AppContext);
    return (React.createElement(Modal, { title: "\uC54C\uB9BC", subtitle: "\uACF5\uC720 \uC77C\uC815\uACFC \uC5C5\uBB34 \uC54C\uB9BC", onClose: close },
        React.createElement("div", { className: "modal-body" }, state.notifications.length ? (state.notifications.map((n) => (React.createElement("button", { className: `notification-row ${n.read ? "" : "unread"}`, key: n.id, onClick: async () => {
                if (!n.read)
                    await act({ action: "read-notification", targetId: n.id });
                navigate("calendar");
                close();
            } },
            React.createElement(CalendarDays, { size: 18 }),
            React.createElement("span", null,
                React.createElement("strong", null, n.title),
                React.createElement("small", null, new Date(n.at).toLocaleString("ko-KR"))),
            !n.read && React.createElement("i", null))))) : (React.createElement("div", { className: "empty" },
            React.createElement(Bell, { size: 28 }),
            React.createElement("strong", null, "\uC0C8\uB85C\uC6B4 \uC54C\uB9BC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4"),
            React.createElement("p", null, "\uC77C\uC815\uC5D0 \uC124\uC815\uD55C \uC54C\uB9BC\uC774 \uC774\uACF3\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."))))));
}
function Profile({ onLogout }) {
    const { state, close } = React.useContext(AppContext);
    return (React.createElement(Modal, { title: "\uB0B4 \uACC4\uC815", onClose: close },
        React.createElement("div", { className: "modal-body profile-detail" },
            React.createElement("span", { className: "avatar large" }, state.me.name[0]),
            React.createElement("h3", null, state.me.name),
            React.createElement("p", null, state.me.email),
            React.createElement(Badge, { tone: "blue" }, state.me.role === "master" ? "마스터 계정" : "일반 계정")),
        React.createElement("footer", { className: "modal-foot" },
            React.createElement(Button, { icon: LogOut, onClick: onLogout }, "\uB85C\uADF8\uC544\uC6C3"))));
}
