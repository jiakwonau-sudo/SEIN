import React, { useEffect, useState } from "react";
import { useApp, PageHead, Button, Panel, Field, ErrorNote, request, Empty, bytes, } from "./ui.js";
import { renderMail } from "../shared/missions.mjs";
import { customerGroupSummary } from "../shared/profiles.mjs";
import { countryOptionsFromCustomers } from "../shared/countries.mjs";
import { validEmail } from "../shared/workflow.mjs";
import { useUnsaved } from "./hooks.js";
import { Pagination } from "./ui.js";
const DEFAULT_MAIL_SENDER = "info@seinmachinery.com";
const languages = {
    ko: "한국어",
    en: "English",
    ja: "日本語",
    zh: "中文（简体）",
};
const statusNames = {
    queued: "대기",
    sending: "전송 중",
    accepted: "Microsoft 접수",
    pending: "대기",
    failed: "실패",
    uncertain: "확인 필요",
    cancelled: "취소",
    complete: "접수 완료",
    attention: "확인 필요",
    skipped: "제외",
};
const productName = (product) => product.maker &&
    !String(product.model).toLowerCase().includes(product.maker.toLowerCase())
    ? `${product.maker} ${product.model}`
    : product.model;
function productDraft(state, product) {
    const photoIds = state.files
        .filter((f) => f.targetType === "equipment" &&
        f.targetId === product.id &&
        !f.locked &&
        f.status === "ready" &&
        /^image\/(jpeg|png|webp)$/.test(f.type))
        .slice(0, 3)
        .map((f) => f.id);
    return {
        id: product.id,
        maker: product.maker || "",
        model: product.model,
        number: product.number,
        spec: product.publicSpec || "",
        photoIds,
    };
}
function TemplateForm({ item, onDone, onCancel }) {
    const { act } = useApp();
    const [v, set] = useState(item || {
        name: "",
        language: "ko",
        subject: "",
        body: "{{products}}\n\n{{company}}",
    }), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    return (React.createElement("section", { className: "mission-template-editor", "aria-label": "\uB2E4\uAD6D\uC5B4 \uC591\uC2DD \uD3B8\uC9D1" },
        React.createElement("div", { className: "mission-template-editor-head" },
            React.createElement("div", null,
                React.createElement("h4", null, item ? "다국어 양식 수정" : "새 다국어 양식"),
                React.createElement("p", { className: "hint" }, "\uC5B8\uC5B4\uBCC4 \uC81C\uBAA9\uACFC \uBCF8\uBB38\uC744 \uD55C \uD654\uBA74\uC5D0\uC11C \uAD00\uB9AC\uD569\uB2C8\uB2E4."))),
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await act({
                        action: "mission-save",
                        type: "mailTemplates",
                        targetId: item?.id,
                        version: item?.version,
                        data: v,
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
            React.createElement("div", { className: "mission-form" },
                React.createElement(Field, { label: "\uC591\uC2DD \uC774\uB984" },
                    React.createElement("input", { required: true, value: v.name, onChange: (e) => set({ ...v, name: e.target.value }) })),
                React.createElement(Field, { label: "\uC5B8\uC5B4" },
                    React.createElement("select", { value: v.language, onChange: (e) => set({ ...v, language: e.target.value }) }, Object.entries(languages).map(([k, n]) => (React.createElement("option", { key: k, value: k }, n))))),
                React.createElement(Field, { label: "\uC81C\uBAA9" },
                    React.createElement("input", { required: true, value: v.subject, onChange: (e) => set({ ...v, subject: e.target.value }) })),
                React.createElement(Field, { label: "\uBCF8\uBB38" },
                    React.createElement("textarea", { required: true, rows: 12, value: v.body, onChange: (e) => set({ ...v, body: e.target.value }) })),
                React.createElement("p", { className: "hint" },
                    "{{products}}",
                    "\uC5D0 \uC0C1\uD488 \uC0AC\uC591, ",
                    "{{product_summary}}",
                    "\uC5D0 \uC0C1\uD488\uBA85 \uC694\uC57D,",
                    " ",
                    "{{product_count}}",
                    "\uC5D0 \uC0C1\uD488 \uC218, ",
                    "{{company}}",
                    "\uC5D0 \uD68C\uC0AC\uBA85\uC774 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4. \uAC00\uACA9\uACFC \uB0B4\uBD80 \uBA54\uBAA8\uB294 \uC790\uB3D9\uC73C\uB85C \uB123\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "mission-template-actions" },
                React.createElement(Button, { type: "button", onClick: onCancel }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true, loading: busy }, "\uB2E4\uAD6D\uC5B4 \uC591\uC2DD \uC800\uC7A5")))));
}
export function MailPage() {
    const { state, allowed, notify, readonly } = useApp();
    const [recipientPage, setRecipientPage] = useState(1);
    const [draftReady, setDraftReady] = useState(false);
    const [draftLoadKey, setDraftLoadKey] = useState(0);
    const [draftSaving, setDraftSaving] = useState(false);
    const [savedDraft, setSavedDraft] = useState("");
    const [draftError, setDraftError] = useState("");
    const draftVersion = React.useRef(0);
    const [templateId, setTemplateId] = useState(state.mailTemplates[0]?.id || ""), [customerIds, setCustomers] = useState([]), [products, setProducts] = useState(() => {
        const id = new URLSearchParams(location.search).get("productId");
        const product = state.equipment.find((p) => p.id === id && !p.locked);
        return product ? [productDraft(state, product)] : [];
    }), [attachmentIds, setAttachments] = useState([]), [subject, setSubject] = useState(""), [body, setBody] = useState(""), [preview, setPreview] = useState(null), [error, setError] = useState(""), [config, setConfig] = useState(null), [busy, setBusy] = useState(false), [campaigns, setCampaigns] = useState([]), [sender, setSender] = useState(DEFAULT_MAIL_SENDER), [search, setSearch] = useState(""), [countryFilter, setCountryFilter] = useState("__all__"), [groupFilter, setGroupFilter] = useState("__all__"), [recipientFilter, setRecipientFilter] = useState("all"), [productSearch, setProductSearch] = useState(""), [productCandidateIds, setProductCandidateIds] = useState([]), [attachmentSearch, setAttachmentSearch] = useState(""), [tab, setTab] = useState("compose"), [templateEditorId, setTemplateEditorId] = useState(null), [requestId, setRequestId] = useState(crypto.randomUUID());
    const template = state.mailTemplates.find((t) => t.id === templateId) ||
        state.mailTemplates[0];
    const draftText = JSON.stringify({
        templateId,
        customerIds,
        products,
        attachmentIds,
        subject,
        body,
        sender,
    });
    const draftDirty = draftReady && draftText !== savedDraft;
    useUnsaved(draftDirty);
    useEffect(() => {
        let active = true;
        setDraftError("");
        request("/api/mail/draft")
            .then(({ draft }) => {
            if (!active)
                return;
            if (draft) {
                draftVersion.current = draft.version;
                setTemplateId(draft.templateId || state.mailTemplates[0]?.id || "");
                setCustomers(draft.customerIds);
                setAttachments(draft.attachmentIds);
                const productId = new URLSearchParams(location.search).get("productId");
                const product = state.equipment.find((p) => p.id === productId && !p.locked);
                const restored = product && !draft.products.some((p) => p.id === product.id)
                    ? [...draft.products, productDraft(state, product)].slice(0, 30)
                    : draft.products;
                setProducts(restored);
                setSubject(draft.subject);
                setBody(draft.body);
                setSender(draft.sender || DEFAULT_MAIL_SENDER);
                setSavedDraft(JSON.stringify({
                    templateId: draft.templateId || state.mailTemplates[0]?.id || "",
                    customerIds: draft.customerIds,
                    products: draft.products,
                    attachmentIds: draft.attachmentIds,
                    subject: draft.subject,
                    body: draft.body,
                    sender: draft.sender || DEFAULT_MAIL_SENDER,
                }));
            }
            else
                setSavedDraft(products.length ? "" : draftText);
            setDraftReady(true);
        })
            .catch((e) => {
            if (active)
                setDraftError(e.message);
        });
        return () => {
            active = false;
        };
    }, [draftLoadKey]);
    const saveDraft = async () => {
        if (draftSaving || !draftReady)
            return;
        const saved = draftText;
        setDraftSaving(true);
        setDraftError("");
        try {
            const result = await request("/api/mail/draft", {
                method: "PUT",
                body: JSON.stringify({
                    ...JSON.parse(saved),
                    version: draftVersion.current,
                }),
            });
            draftVersion.current = result.draft.version;
            setSavedDraft(saved);
        }
        catch (e) {
            setDraftError(e.message);
        }
        finally {
            setDraftSaving(false);
        }
    };
    useEffect(() => {
        if (!draftDirty || draftSaving || draftError || !allowed("mail", "create"))
            return;
        const timer = setTimeout(saveDraft, 1000);
        return () => clearTimeout(timer);
    }, [draftText, draftReady, savedDraft, draftSaving, draftError]);
    useEffect(() => setRecipientPage(1), [search, countryFilter, groupFilter, recipientFilter]);
    const refresh = () => request("/api/mail/campaigns")
        .then((r) => setCampaigns(r.campaigns))
        .catch(() => { });
    useEffect(() => {
        request("/api/mail/config")
            .then((value) => {
            setConfig(value);
            setSender((current) => value.senders?.includes(current)
                ? current
                : value.sender || DEFAULT_MAIL_SENDER);
        })
            .catch((e) => setError(e.message));
        refresh();
        const id = setInterval(refresh, 10000);
        return () => clearInterval(id);
    }, []);
    const change = () => {
        setPreview(null);
        setRequestId(crypto.randomUUID());
    };
    const payload = {
        customerIds,
        products,
        attachmentIds,
        subject,
        body,
        sender,
        language: template?.language,
    };
    const countries = countryOptionsFromCustomers(state.customers);
    const customerGroups = customerGroupSummary(state.customers);
    const customers = state.customers.filter((c) => {
        const contacts = c.contacts || [];
        const emails = contacts.filter((person) => validEmail(person.email));
        const groupKey = String(c.groupName || "").trim() || "__ungrouped__";
        return (!c.locked &&
            `${c.name} ${c.country || ""} ${c.groupName || ""} ${contacts
                .map((person) => `${person.name || ""} ${person.email || ""}`)
                .join(" ")}`
                .toLowerCase()
                .includes(search.toLowerCase()) &&
            (countryFilter === "__all__" || c.country === countryFilter) &&
            (groupFilter === "__all__" || groupKey === groupFilter) &&
            (recipientFilter === "all" ||
                (recipientFilter === "sendable" && !c.blocked && emails.length > 0) ||
                (recipientFilter === "blocked" && c.blocked) ||
                (recipientFilter === "without" && emails.length === 0)));
    });
    const availableProducts = state.equipment.filter((e) => {
        if (e.locked || products.some((p) => p.id === e.id))
            return false;
        const q = productSearch.trim().toLowerCase();
        return (!q ||
            `${e.maker || ""} ${e.model} ${e.number} ${e.publicSpec || ""}`
                .toLowerCase()
                .includes(q));
    });
    const availableAttachments = state.files.filter((f) => {
        const q = attachmentSearch.trim().toLowerCase();
        return (!f.locked &&
            f.status === "ready" &&
            !attachmentIds.includes(f.id) &&
            /\.(pdf|jpe?g|png|xlsx|docx)$/i.test(f.name) &&
            (!q || f.name.toLowerCase().includes(q)));
    });
    const fileSize = [
        ...attachmentIds,
        ...products.flatMap((p) => p.photoIds || []),
    ].reduce((n, id) => n + (state.files.find((f) => f.id === id)?.size || 0), 0);
    const applyTemplate = () => {
        if (!template)
            return;
        if ((subject.trim() || body.trim()) &&
            !confirm("작성한 제목과 본문을 선택한 양식으로 바꿀까요?"))
            return;
        const content = renderMail(template, products, state.company.name);
        setSubject(content.subject);
        setBody(content.body);
        change();
    };
    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            notify("복사했습니다.");
        }
        catch {
            setError("클립보드에 접근할 수 없습니다. 아래 텍스트를 직접 선택해 복사하세요.");
        }
    };
    const exportMail = async () => {
        setBusy(true);
        setError("");
        try {
            const r = await fetch("/api/mail/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!r.ok)
                throw Error((await r.json()).error);
            const url = URL.createObjectURL(await r.blob()), a = document.createElement("a");
            a.href = url;
            a.download = "sein-mail.eml";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setBusy(false);
        }
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uBA54\uC77C \uBC1C\uC1A1", description: "\uC77C\uBC18 \uC548\uB0B4\uC640 \uC5EC\uB7EC \uC0C1\uD488\uC758 \uC0AC\uC591\u00B7\uC0AC\uC9C4\uC744 \uD568\uAED8 \uC791\uC131\uD574 \uACE0\uAC1D\uBCC4\uB85C \uBC1C\uC1A1\uD569\uB2C8\uB2E4." },
            React.createElement(Button, { onClick: () => setTab("mailbox") }, "\uBA54\uC77C\uD568"),
            React.createElement(Button, { onClick: () => setTab("compose") }, "\uBA54\uC77C \uC791\uC131"),
            React.createElement(Button, { onClick: () => setTab("templates") }, "\uB2E4\uAD6D\uC5B4 \uC591\uC2DD")),
        React.createElement("div", { className: "mission-mail-status" },
            React.createElement("strong", null, config?.enabled
                ? "Microsoft 365 발송 사용 가능"
                : "복사·메일 파일 다운로드 사용 가능"),
            React.createElement("span", null, config?.senders?.length
                ? `발신 주소 ${config.senders.length}개 선택 가능`
                : "공통 발신 주소 미설정"),
            !config?.enabled && (React.createElement("small", null, "\uD68C\uC0AC Microsoft 365 \uC5F0\uACB0 \uD6C4 \uC2DC\uC2A4\uD15C \uBC1C\uC1A1\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."))),
        React.createElement(ErrorNote, { error: error }),
        React.createElement("div", { className: "draft-status", "data-unsaved": draftDirty, role: "status" },
            draftSaving
                ? "임시저장 중…"
                : !draftReady
                    ? draftError
                        ? "임시저장을 불러오지 못했습니다."
                        : "임시저장을 불러오는 중…"
                    : draftDirty
                        ? "저장하지 않은 변경 사항이 있습니다."
                        : draftVersion.current
                            ? "이 계정에 임시저장됨"
                            : "새 메일 · 입력 시 자동 저장",
            React.createElement(Button, { small: true, disabled: !draftReady || !draftDirty || !allowed("mail", "create"), loading: draftSaving, onClick: saveDraft }, "\uC784\uC2DC\uC800\uC7A5")),
        React.createElement(ErrorNote, { error: draftError }),
        !draftReady && draftError && (React.createElement(Button, { onClick: () => setDraftLoadKey((v) => v + 1) }, "\uC784\uC2DC\uC800\uC7A5 \uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30")),
        tab === "templates" && (React.createElement(Panel, null,
            React.createElement("div", { className: "mission-template-heading" },
                React.createElement("div", null,
                    React.createElement("h3", null, "\uB2E4\uAD6D\uC5B4 \uC591\uC2DD \uAD00\uB9AC"),
                    React.createElement("p", { className: "hint" }, "\uBC1C\uC1A1 \uC5B8\uC5B4\uBCC4 \uACF5\uD1B5 \uBB38\uC548\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4. \uC591\uC2DD\uC744 \uC218\uC815\uD574\uB3C4 \uC774\uBBF8 \uBC1C\uC1A1\uD55C \uBA54\uC77C\uC758 \uB0B4\uC6A9\uC740 \uBC14\uB00C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")),
                allowed("mail", "create") && (React.createElement(Button, { onClick: () => setTemplateEditorId("new"), "aria-expanded": templateEditorId === "new" }, "\uC0C8 \uB2E4\uAD6D\uC5B4 \uC591\uC2DD"))),
            templateEditorId && (React.createElement(TemplateForm, { key: templateEditorId, item: templateEditorId === "new"
                    ? undefined
                    : state.mailTemplates.find((item) => item.id === templateEditorId), onDone: () => setTemplateEditorId(null), onCancel: () => setTemplateEditorId(null) })),
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "\uC5B8\uC5B4"),
                            React.createElement("th", null, "\uC591\uC2DD\uBA85"),
                            React.createElement("th", null, "\uC81C\uBAA9"),
                            React.createElement("th", null, "\uAD00\uB9AC"))),
                    React.createElement("tbody", null, state.mailTemplates.map((item) => (React.createElement("tr", { key: item.id },
                        React.createElement("td", null, languages[item.language]),
                        React.createElement("td", null, item.name),
                        React.createElement("td", null, item.subject),
                        React.createElement("td", null,
                            React.createElement("div", { className: "mission-toolbar" },
                                React.createElement(Button, { small: true, onClick: () => {
                                        setTemplateId(item.id);
                                        setTab("compose");
                                    } }, "\uC120\uD0DD"),
                                allowed("mail", "edit") && (React.createElement(Button, { small: true, onClick: () => setTemplateEditorId(item.id), "aria-expanded": templateEditorId === item.id }, "\uC218\uC815")))))))))))),
        tab === "compose" && draftReady && (React.createElement("div", { className: "mission-mail-grid" },
            React.createElement(Panel, null,
                React.createElement("fieldset", { disabled: !allowed("mail", "create"), className: "mission-fieldset" },
                    React.createElement("h3", null,
                        "1. \uACE0\uAC1D \uC120\uD0DD ",
                        React.createElement("small", null,
                            customerIds.length,
                            "\uAC1C \uD68C\uC0AC")),
                    React.createElement("input", { "aria-label": "\uBA54\uC77C \uACE0\uAC1D \uAC80\uC0C9", placeholder: "\uD68C\uC0AC\uBA85\u00B7\uC774\uBA54\uC77C \uAC80\uC0C9", value: search, onChange: (e) => setSearch(e.target.value) }),
                    React.createElement("div", { className: "mission-recipient-filters" },
                        React.createElement("select", { "aria-label": "\uC218\uC2E0\uC790 \uAD6D\uAC00", value: countryFilter, onChange: (event) => setCountryFilter(event.target.value) },
                            React.createElement("option", { value: "__all__" }, "\uC804\uCCB4 \uAD6D\uAC00"),
                            countries.map(([country, label]) => (React.createElement("option", { key: country, value: country },
                                label,
                                country === label ? "" : ` (${country})`)))),
                        React.createElement("select", { "aria-label": "\uC218\uC2E0\uC790 \uACE0\uAC1D \uADF8\uB8F9", value: groupFilter, onChange: (event) => setGroupFilter(event.target.value) },
                            React.createElement("option", { value: "__all__" }, "\uC804\uCCB4 \uADF8\uB8F9"),
                            customerGroups.map((group) => (React.createElement("option", { key: group.key, value: group.key },
                                group.label,
                                " (",
                                group.count,
                                ")")))),
                        React.createElement("select", { "aria-label": "\uC218\uC2E0 \uAC00\uB2A5 \uC0C1\uD0DC", value: recipientFilter, onChange: (event) => setRecipientFilter(event.target.value) },
                            React.createElement("option", { value: "all" }, "\uC218\uC2E0 \uC0C1\uD0DC \uC804\uCCB4"),
                            React.createElement("option", { value: "sendable" }, "\uBC1C\uC1A1 \uAC00\uB2A5\uD55C \uACE0\uAC1D"),
                            React.createElement("option", { value: "blocked" }, "\uC1A1\uC2E0 \uAE08\uC9C0"),
                            React.createElement("option", { value: "without" }, "\uC720\uD6A8 \uC774\uBA54\uC77C \uC5C6\uC74C"))),
                    React.createElement("div", { className: "mission-toolbar" },
                        React.createElement(Button, { small: true, onClick: () => {
                                setCustomers([
                                    ...new Set([
                                        ...customerIds,
                                        ...customers
                                            .filter((c) => !c.blocked &&
                                            (c.contacts || []).some((person) => validEmail(person.email)))
                                            .map((c) => c.id),
                                    ]),
                                ]);
                                change();
                            } }, "\uAC80\uC0C9 \uACB0\uACFC \uC804\uCCB4 \uC120\uD0DD"),
                        React.createElement(Button, { small: true, onClick: () => {
                                setCustomers([]);
                                change();
                            } }, "\uC120\uD0DD \uD574\uC81C")),
                    React.createElement("div", { className: "mission-checklist" }, customers
                        .slice((recipientPage - 1) * 40, recipientPage * 40)
                        .map((c) => (React.createElement("label", { key: c.id },
                        React.createElement("input", { type: "checkbox", disabled: c.blocked ||
                                !(c.contacts || []).some((person) => validEmail(person.email)), checked: customerIds.includes(c.id), onChange: (e) => {
                                setCustomers(e.target.checked
                                    ? [...customerIds, c.id]
                                    : customerIds.filter((id) => id !== c.id));
                                change();
                            } }),
                        React.createElement("span", null,
                            React.createElement("strong", null, c.name),
                            React.createElement("small", null,
                                [c.country, c.groupName]
                                    .filter(Boolean)
                                    .join(" · ") || "국가·그룹 미입력",
                                " · ",
                                c.blocked
                                    ? "송신 금지"
                                    : (c.contacts || []).some((person) => validEmail(person.email))
                                        ? `유효 이메일 ${(c.contacts || []).filter((person) => validEmail(person.email)).length}개`
                                        : "유효 이메일 없음")))))),
                    React.createElement(Pagination, { total: customers.length, size: 40, page: recipientPage, onChange: setRecipientPage }),
                    React.createElement("p", { className: "hint" },
                        "\uC120\uD0DD ",
                        customerIds.length,
                        "\uAC1C \uD68C\uC0AC \u00B7 \uC911\uBCF5 \uC81C\uC678 \uC720\uD6A8 \uC8FC\uC18C",
                        " ",
                        new Set(state.customers
                            .filter((c) => customerIds.includes(c.id) && !c.blocked)
                            .flatMap((c) => c.contacts
                            .filter((p) => validEmail(p.email))
                            .map((p) => p.email.trim().toLowerCase()))).size,
                        "\uAC1C \u00B7 \uC804\uCCB4 \uC120\uD0DD\uC740 \uD604\uC7AC \uD544\uD130\uC758 \uBAA8\uB4E0 \uD398\uC774\uC9C0\uC5D0 \uC801\uC6A9\uB429\uB2C8\uB2E4."),
                    React.createElement("h3", null,
                        "2. \uC0C1\uD488\u00B7\uACF5\uAC1C\uC6A9 \uC0AC\uC591 ",
                        React.createElement("small", null,
                            products.length,
                            "\uAC1C \uCD94\uAC00\uB428")),
                    React.createElement("p", { className: "hint" }, "\uD55C \uBA54\uC77C\uC5D0 \uC0C1\uD488\uC744 \uCD5C\uB300 30\uAC1C\uAE4C\uC9C0 \uB123\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC544\uB798\uC5D0\uC11C \uC5EC\uB7EC \uC0C1\uD488\uC744 \uCCB4\uD06C\uD55C \uB4A4 \uD55C \uBC88\uC5D0 \uCD94\uAC00\uD558\uC138\uC694."),
                    React.createElement("input", { "aria-label": "\uBA54\uC77C \uC0C1\uD488 \uAC80\uC0C9", placeholder: "\uBA54\uC774\uCEE4\u00B7\uBAA8\uB378\u00B7\uC124\uBE44\uBC88\uD638\u00B7\uACF5\uAC1C \uC0AC\uC591 \uAC80\uC0C9", value: productSearch, onChange: (e) => setProductSearch(e.target.value) }),
                    React.createElement("div", { className: "mission-product-picker" },
                        React.createElement("div", { className: "mission-toolbar" },
                            React.createElement(Button, { small: true, disabled: !productCandidateIds.length || products.length >= 30, onClick: () => {
                                    const room = Math.max(0, 30 - products.length);
                                    const additions = productCandidateIds
                                        .slice(0, room)
                                        .map((id) => state.equipment.find((p) => p.id === id))
                                        .filter(Boolean)
                                        .map((product) => productDraft(state, product));
                                    setProducts([...products, ...additions]);
                                    setProductCandidateIds([]);
                                    setProductSearch("");
                                    change();
                                } },
                                "\uC120\uD0DD\uD55C \uC0C1\uD488 ",
                                productCandidateIds.length,
                                "\uAC1C \uCD94\uAC00"),
                            React.createElement(Button, { small: true, onClick: () => setProductCandidateIds(availableProducts
                                    .slice(0, Math.max(0, 30 - products.length))
                                    .map((e) => e.id)) }, "\uAC80\uC0C9 \uACB0\uACFC \uC120\uD0DD"),
                            React.createElement(Button, { small: true, onClick: () => setProductCandidateIds([]) }, "\uCCB4\uD06C \uD574\uC81C")),
                        React.createElement("div", { className: "mission-product-options" }, availableProducts.slice(0, 100).map((e) => (React.createElement("label", { key: e.id },
                            React.createElement("input", { type: "checkbox", checked: productCandidateIds.includes(e.id), disabled: !productCandidateIds.includes(e.id) &&
                                    productCandidateIds.length + products.length >= 30, onChange: (event) => setProductCandidateIds(event.target.checked
                                    ? [...productCandidateIds, e.id]
                                    : productCandidateIds.filter((id) => id !== e.id)) }),
                            React.createElement("span", null,
                                productName(e),
                                " \u00B7 ",
                                e.number)))))),
                    availableProducts.length > 100 && (React.createElement("p", { className: "hint" }, "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uB9CE\uC544 \uC0C1\uC704 100\uAC74\uB9CC \uD45C\uC2DC\uD569\uB2C8\uB2E4.")),
                    products.map((p) => (React.createElement("div", { className: "mission-product", key: p.id },
                        React.createElement("strong", null,
                            productName(p),
                            " \u00B7 ",
                            p.number),
                        React.createElement(Button, { small: true, onClick: () => {
                                setProducts(products.filter((x) => x.id !== p.id));
                                change();
                            } }, "\uC81C\uC678"),
                        React.createElement("textarea", { "aria-label": `${p.number} 공개 사양`, placeholder: "\uACE0\uAC1D\uC5D0\uAC8C \uACF5\uAC1C\uD560 \uC0AC\uC591\uC744 \uC120\uD0DD\uD55C \uC5B8\uC5B4\uB85C \uC785\uB825\uD558\uC138\uC694. \uB0B4\uBD80 \uBA54\uBAA8\u00B7\uAC00\uACA9\uC740 \uC790\uB3D9 \uC0BD\uC785\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", value: p.spec, onChange: (e) => {
                                setProducts(products.map((x) => x.id === p.id ? { ...x, spec: e.target.value } : x));
                                change();
                            } }),
                        React.createElement("div", { className: "mission-product-photos" },
                            React.createElement("small", null, "\uBCF8\uBB38 \uC0AC\uC9C4 \u00B7 \uCD5C\uB300 3\uC7A5"),
                            state.files
                                .filter((f) => !f.locked &&
                                f.status === "ready" &&
                                f.targetType === "equipment" &&
                                f.targetId === p.id &&
                                /^image\/(jpeg|png|webp)$/.test(f.type))
                                .map((f) => (React.createElement("label", { key: f.id },
                                React.createElement("input", { type: "checkbox", checked: (p.photoIds || []).includes(f.id), disabled: !(p.photoIds || []).includes(f.id) &&
                                        (p.photoIds || []).length >= 3, onChange: (event) => {
                                        const photoIds = event.target.checked
                                            ? [...(p.photoIds || []), f.id]
                                            : (p.photoIds || []).filter((id) => id !== f.id);
                                        setProducts(products.map((x) => x.id === p.id ? { ...x, photoIds } : x));
                                        change();
                                    } }),
                                React.createElement("img", { src: `/api/files/${f.id}?thumbnail=1`, loading: "lazy", alt: "" }),
                                React.createElement("span", null, f.name)))))))),
                    React.createElement("h3", null, "3. \uCCA8\uBD80\uD30C\uC77C"),
                    React.createElement("p", { className: "hint" },
                        "\uCD5C\uB300 5\uAC1C \u00B7 \uBCF8\uBB38 \uC0AC\uC9C4 \uD3EC\uD568 10MB / \uD604\uC7AC ",
                        bytes(fileSize)),
                    React.createElement("input", { "aria-label": "\uBA54\uC77C \uCCA8\uBD80 \uAC80\uC0C9", placeholder: "\uD30C\uC77C\uBA85 \uAC80\uC0C9", value: attachmentSearch, onChange: (e) => setAttachmentSearch(e.target.value) }),
                    React.createElement("select", { "aria-label": "\uBA54\uC77C \uCCA8\uBD80 \uCD94\uAC00", value: "", onChange: (e) => {
                            if (e.target.value) {
                                setAttachments([...attachmentIds, e.target.value]);
                                setAttachmentSearch("");
                                change();
                            }
                        } },
                        React.createElement("option", { value: "" }, "\uC790\uB8CC\uC2E4 \uD30C\uC77C \uC120\uD0DD"),
                        availableAttachments.slice(0, 100).map((f) => (React.createElement("option", { key: f.id, value: f.id },
                            f.name,
                            " (",
                            bytes(f.size),
                            ")")))),
                    availableAttachments.length > 100 && (React.createElement("p", { className: "hint" }, "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uB9CE\uC544 \uC0C1\uC704 100\uAC74\uB9CC \uD45C\uC2DC\uD569\uB2C8\uB2E4.")),
                    attachmentIds.map((id) => (React.createElement("div", { className: "mission-toolbar", key: id },
                        React.createElement("a", { href: `/api/files/${id}` }, state.files.find((f) => f.id === id)?.name),
                        React.createElement(Button, { small: true, onClick: () => {
                                setAttachments(attachmentIds.filter((x) => x !== id));
                                change();
                            } }, "\uC81C\uC678")))))),
            React.createElement(Panel, null,
                React.createElement("div", { className: "mission-form" },
                    React.createElement("h3", null, "4. \uBC1C\uC2E0\uC790\u00B7\uC5B8\uC5B4\u00B7\uBB38\uC548"),
                    React.createElement(Field, { label: "\uBC1C\uC2E0\uC790 \uBA54\uC77C" },
                        React.createElement("select", { "aria-label": "\uBC1C\uC2E0\uC790 \uBA54\uC77C", value: sender, onChange: (event) => {
                                setSender(event.target.value);
                                change();
                            } }, (config?.senders || [DEFAULT_MAIL_SENDER]).map((address) => (React.createElement("option", { key: address, value: address }, address))))),
                    React.createElement("select", { "aria-label": "\uBA54\uC77C \uD15C\uD50C\uB9BF \uC120\uD0DD", value: templateId, onChange: (e) => {
                            setTemplateId(e.target.value);
                            change();
                        } }, state.mailTemplates.map((t) => (React.createElement("option", { key: t.id, value: t.id },
                        languages[t.language],
                        " \u00B7 ",
                        t.name)))),
                    React.createElement("div", { className: "mission-toolbar" },
                        allowed("mail", "create") && (React.createElement(Button, { onClick: applyTemplate }, "\uC120\uD0DD \uC0C1\uD488\uC73C\uB85C \uBB38\uC548 \uCC44\uC6B0\uAE30")),
                        allowed("mail", "edit") && template && (React.createElement(Button, { onClick: () => {
                                setTemplateEditorId(template.id);
                                setTab("templates");
                            } }, "\uB2E4\uAD6D\uC5B4 \uC591\uC2DD \uC218\uC815"))),
                    React.createElement("p", { className: "hint" }, "\uC0AC\uC591\u00B7\uC5B8\uC5B4 \uBCC0\uACBD \uD6C4 \uBB38\uC548 \uCC44\uC6B0\uAE30\uB97C \uB204\uB974\uBA74 \uC544\uB798 \uB0B4\uC6A9\uC774 \uC0C8\uB85C \uC791\uC131\uB429\uB2C8\uB2E4. \uC790\uC720 \uC0AC\uC591\uC740 \uC790\uB3D9 \uBC88\uC5ED\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."),
                    React.createElement(Field, { label: "\uC81C\uBAA9" },
                        React.createElement("input", { readOnly: !allowed("mail", "create"), value: subject, onChange: (e) => {
                                setSubject(e.target.value);
                                change();
                            } })),
                    React.createElement(Field, { label: "\uC774\uBC88 \uBC1C\uC1A1 \uBCF8\uBB38" },
                        React.createElement("textarea", { readOnly: !allowed("mail", "create"), rows: 16, value: body, onChange: (e) => {
                                setBody(e.target.value);
                                change();
                            } })),
                    React.createElement("div", { className: "mission-photo-preview" }, products.flatMap((p) => (p.photoIds || []).map((photoId) => (React.createElement("figure", { key: `${p.id}-${photoId}` },
                        React.createElement("img", { src: `/api/files/${photoId}?preview=1`, alt: p.model }),
                        React.createElement("figcaption", null, p.model)))))),
                    allowed("mail", "create") && (React.createElement(Button, { primary: true, loading: busy, onClick: async () => {
                            setError("");
                            setBusy(true);
                            try {
                                setPreview(await request("/api/mail/preview", {
                                    method: "POST",
                                    body: JSON.stringify(payload),
                                }));
                            }
                            catch (e) {
                                setError(e.message);
                            }
                            finally {
                                setBusy(false);
                            }
                        } }, "\uC218\uC2E0\uC790\u00B7\uCCA8\uBD80 \uD655\uC778")),
                    preview && (React.createElement("div", { className: "mission-preview" },
                        React.createElement("strong", null,
                            "\uC720\uD6A8\uD55C \uC218\uC2E0\uC790 ",
                            preview.recipients.length,
                            "\uBA85"),
                        React.createElement("p", null,
                            "\uC1A1\uC2E0\uAE08\uC9C0 ",
                            preview.excluded.blocked,
                            " / \uC798\uBABB\uB41C \uC8FC\uC18C",
                            " ",
                            preview.excluded.invalid,
                            " / \uC911\uBCF5",
                            " ",
                            preview.excluded.duplicates,
                            " \uC81C\uC678"),
                        React.createElement("iframe", { className: "mission-mail-preview-frame", title: "\uCD5C\uC885 \uBA54\uC77C \uBBF8\uB9AC\uBCF4\uAE30", sandbox: "", srcDoc: preview.html }),
                        React.createElement("details", null,
                            React.createElement("summary", null, "\uC218\uC2E0\uC790 \uBAA9\uB85D \uD655\uC778"),
                            React.createElement("textarea", { "aria-label": "\uCD5C\uC885 \uC218\uC2E0\uC790", readOnly: true, rows: 5, value: preview.recipients.join("; ") })),
                        React.createElement("div", { className: "mission-toolbar" },
                            React.createElement(Button, { small: true, onClick: () => copy(preview.recipients.join("; ")) }, "\uC8FC\uC18C \uBCF5\uC0AC (\uC228\uC740\uCC38\uC870)"),
                            React.createElement(Button, { small: true, onClick: () => copy(subject) }, "\uC81C\uBAA9 \uBCF5\uC0AC"),
                            React.createElement(Button, { small: true, onClick: () => copy(body) }, "\uBCF8\uBB38 \uBCF5\uC0AC"),
                            React.createElement(Button, { small: true, loading: busy, onClick: exportMail }, "\uC0AC\uC9C4\u00B7\uCCA8\uBD80 \uD3EC\uD568 \uBA54\uC77C \uD30C\uC77C")),
                        React.createElement("p", { className: "hint" }, "\uBCF8\uBB38 \uBCF5\uC0AC\uB294 \uD14D\uC2A4\uD2B8\uB9CC \uBCF5\uC0AC\uD569\uB2C8\uB2E4. \uC0AC\uC9C4\u00B7\uCCA8\uBD80\uB294 \uBA54\uC77C \uD30C\uC77C\uC744 \uC5F4\uAC70\uB098 \uC9C1\uC811 \uCCA8\uBD80\uD558\uC138\uC694. \uBA54\uC77C \uD30C\uC77C \uC5F4\uAE30\u00B7\uD3B8\uC9D1 \uC9C0\uC6D0\uC740 Outlook \uBC84\uC804\uC5D0 \uB530\uB77C \uB2E4\uB985\uB2C8\uB2E4."),
                        config?.enabled && allowed("mail", "send") && (React.createElement(Button, { primary: true, loading: busy, onClick: async () => {
                                if (!confirm(`${sender}에서 ${preview.recipients.length}명에게 개별 발송합니다. 대기열에 등록할까요?`))
                                    return;
                                setBusy(true);
                                setError("");
                                try {
                                    await request("/api/mail/queue", {
                                        method: "POST",
                                        body: JSON.stringify({
                                            ...payload,
                                            requestId,
                                            previewToken: preview.previewToken,
                                        }),
                                    });
                                    notify("발송 대기열에 등록했습니다.");
                                    setPreview(null);
                                    refresh();
                                }
                                catch (e) {
                                    setError(e.message);
                                }
                                finally {
                                    setBusy(false);
                                }
                            } }, "\uAC1C\uBCC4 \uBC1C\uC1A1 \uC2DC\uC791")),
                        config?.enabled && !allowed("mail", "send") && (React.createElement("p", null, "\uB300\uD45C\uAC00 \uC124\uC815\uC5D0\uC11C \uBA54\uC77C \uBC1C\uC1A1 \uAD8C\uD55C\uC744 \uBD80\uC5EC\uD558\uBA74 \uC804\uC1A1\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")))))))),
        tab === "mailbox" && (React.createElement(Panel, null,
            React.createElement("h3", null, "\uBC1C\uC1A1 \uB0B4\uC5ED"),
            React.createElement("p", { className: "hint" }, "\uAD6C \uAD00\uB9AC\uC790 \uBA54\uC77C\uD568\uCC98\uB7FC \uBC1C\uC1A1 \uC81C\uBAA9\u00B7\uC0C1\uD0DC\u00B7\uB300\uC0C1\uC744 \uD655\uC778\uD569\uB2C8\uB2E4. Microsoft \uC811\uC218\uB294 \uC218\uC2E0\uC790 \uB3C4\uCC29\u00B7\uC77D\uC74C \uD655\uC778\uC774 \uC544\uB2D9\uB2C8\uB2E4."),
            !campaigns.length ? (React.createElement(Empty, { title: "\uBC1C\uC1A1 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" })) : (campaigns.map((c) => (React.createElement("details", { className: "mission-campaign", key: c.id },
                React.createElement("summary", null,
                    c.subject,
                    " \u00B7 ",
                    c.sender || DEFAULT_MAIL_SENDER,
                    " \u00B7",
                    " ",
                    statusNames[c.status],
                    " \u00B7 ",
                    c.counts.accepted || 0,
                    "/",
                    c.total,
                    "\uBA85 \uC811\uC218"),
                React.createElement("div", { className: "mission-toolbar" },
                    React.createElement(Button, { small: true, onClick: () => {
                            const visibleCustomerIds = new Set(state.customers
                                .filter((x) => !x.locked)
                                .map((x) => x.id));
                            const visibleEquipmentIds = new Set(state.equipment
                                .filter((x) => !x.locked)
                                .map((x) => x.id));
                            setCustomers((c.customerIds || []).filter((id) => visibleCustomerIds.has(id)));
                            setProducts((c.products || [])
                                .filter((p) => visibleEquipmentIds.has(p.id))
                                .map((p) => {
                                const current = state.equipment.find((e) => e.id === p.id);
                                const photoIds = (p.photoIds || (p.photoId ? [p.photoId] : []))
                                    .filter((id) => state.files.some((f) => f.id === id &&
                                    !f.locked &&
                                    f.status === "ready"))
                                    .slice(0, 3);
                                return {
                                    ...p,
                                    maker: current?.maker || p.maker || "",
                                    model: current?.model || p.model,
                                    number: current?.number || p.number,
                                    photoIds,
                                };
                            }));
                            setAttachments((c.attachmentIds || []).filter((id) => state.files.some((f) => f.id === id && !f.locked && f.status === "ready")));
                            const matchingTemplate = state.mailTemplates.find((t) => t.language === c.language);
                            if (matchingTemplate)
                                setTemplateId(matchingTemplate.id);
                            if (c.sender &&
                                (config?.senders || []).includes(c.sender))
                                setSender(c.sender);
                            setSubject(c.subject);
                            setBody(c.body);
                            setTab("compose");
                            change();
                            notify("과거 발송 문안을 새 메일로 불러왔습니다.");
                        } }, "\uC774 \uBB38\uC548 \uB2E4\uC2DC \uC0AC\uC6A9"),
                    ["queued", "sending"].includes(c.status) &&
                        allowed("mail", "send") && (React.createElement(Button, { danger: true, onClick: async () => {
                            try {
                                await request(`/api/mail/campaigns/${c.id}/cancel`, {
                                    method: "POST",
                                    body: "{}",
                                });
                                refresh();
                            }
                            catch (e) {
                                setError(e.message);
                            }
                        } }, "\uB0A8\uC740 \uBC1C\uC1A1 \uCDE8\uC18C")),
                    React.createElement("small", null, "\uC9C4\uD589\uC911\uC778 1\uAC74\uC740 \uC774\uBBF8 \uC804\uC1A1\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")),
                React.createElement("div", { className: "table-scroll" },
                    React.createElement("table", null,
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", null, "\uC218\uC2E0\uC790"),
                                React.createElement("th", null, "\uC0C1\uD0DC"),
                                React.createElement("th", null, "\uB0B4\uC6A9"))),
                        React.createElement("tbody", null, c.recipients.map((r) => (React.createElement("tr", { key: r.email },
                            React.createElement("td", null, r.email),
                            React.createElement("td", null, statusNames[r.status]),
                            React.createElement("td", null, r.error)))))))))))))));
}
