import React, { useEffect, useRef, useState } from "react";
import { Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Upload, Download, FileText, FileSpreadsheet, FileImage, File, MoreHorizontal, ArrowLeft, ArrowUpRight, Trash2, RotateCcw, LockKeyhole, Pencil, X, Check, Copy, MoveRight, Search, CheckCircle2, AlertTriangle, LoaderCircle, } from "lucide-react";
import { useViewState } from "./hooks.js";
import { seoulDate } from "../shared/workflow.mjs";
import { STAGES } from "../shared/domain.mjs";
import { MemoPanel } from "./business.js";
import { useApp, Button, IconButton, Badge, Field, SearchField, Select, Empty, PageHead, Panel, Modal, ErrorNote, ConfirmDialog, LockDialog, UnlockDialog, LockMark, SortableTh, sortTableRows, bytes, date, request, } from "./ui.js";
const typeOf = (f) => f.type?.startsWith("image/")
    ? "image"
    : f.type === "application/pdf"
        ? "pdf"
        : /\.(dwg|dxf)$/i.test(f.name)
            ? "drawing"
            : /\.(xlsx?|csv)$/i.test(f.name)
                ? "excel"
                : "document";
function FileIcon({ file, small = false }) {
    const t = typeOf(file), Icon = {
        image: FileImage,
        pdf: FileText,
        drawing: File,
        excel: FileSpreadsheet,
        document: File,
    }[t];
    return (React.createElement("span", { className: `file-icon ${t} ${small ? "small" : ""}` },
        React.createElement(Icon, { size: small ? 17 : 23 })));
}
const folderChildren = (folders, id) => {
    const ids = new Set([id]);
    let more = true;
    while (more) {
        more = false;
        for (const f of folders)
            if (ids.has(f.parentId) && !ids.has(f.id)) {
                ids.add(f.id);
                more = true;
            }
    }
    return ids;
};
const selectedRoots = (items, folders) => items.filter((item) => {
    let pid = item.parentId;
    const seen = new Set();
    while (pid && !seen.has(pid)) {
        seen.add(pid);
        if (items.some((x) => x.isFolder && x.id === pid))
            return false;
        pid = folders.find((f) => f.id === pid)?.parentId;
    }
    return true;
});
export function DrivePage() {
    const { state, category, open, allowed, act, notify, navigate } = useApp();
    const [folderId, setFolderId] = useViewState("folder", null), [expanded, setExpanded] = useState(new Set()), [q, setQ] = useViewState("query", ""), [kind, setKind] = useViewState("kind", "all"), [sort, setSort] = useViewState("sort", { key: "name", direction: "asc" }), [selected, setSelected] = useState([]), [drop, setDrop] = useState(false);
    const folders = state.folders.filter((f) => f.categoryId === category.id), files = state.files.filter((f) => f.categoryId === category.id && !f.targetId);
    useEffect(() => {
        setExpanded(new Set());
        setSelected([]);
    }, [category.id]);
    useEffect(() => setSelected([]), [folderId, q, kind]);
    const current = folders.find((f) => f.id === folderId);
    useEffect(() => {
        if (folderId && (!current || current.locked))
            setFolderId(null);
    }, [folderId, current?.id, current?.locked]);
    useEffect(() => {
        const parents = new Set();
        let parent = current?.parentId;
        while (parent && !parents.has(parent)) {
            parents.add(parent);
            parent = folders.find((f) => f.id === parent)?.parentId;
        }
        setExpanded((previous) => new Set([...previous, ...parents]));
    }, [folderId]);
    let path = [];
    for (let p = current, seen = new Set(); p && !seen.has(p.id); p = folders.find((f) => f.id === p.parentId)) {
        path.unshift(p);
        seen.add(p.id);
    }
    const descendant = folderChildren(folders, folderId);
    const visibleFolders = folders.filter((f) => (q ? descendant.has(f.parentId) : f.parentId === folderId) &&
        f.name.toLowerCase().includes(q.toLowerCase()));
    const visibleFiles = files.filter((f) => (q ? descendant.has(f.parentId) : f.parentId === folderId) &&
        f.name.toLowerCase().includes(q.toLowerCase()) &&
        (kind === "all" || typeOf(f) === kind));
    const fileSortValue = (item) => ({
        name: item.name || "",
        size: item.isFolder ? null : Number(item.size || 0),
        updated: item.updatedAt || item.createdAt || "",
        owner: state.users.find((user) => user.id === item.createdBy)?.name || "",
    })[sort.key];
    const sorted = [
        ...(kind === "all"
            ? sortTableRows(visibleFolders.map((folder) => ({ ...folder, isFolder: true })), fileSortValue, sort.direction)
            : []),
        ...sortTableRows(visibleFiles, fileSortValue, sort.direction),
    ];
    const selectFolder = (f) => {
        if (f.locked) {
            open(React.createElement(UnlockDialog, { type: "folders", item: f }));
            return;
        }
        setFolderId(f.id);
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(f.id))
                next.delete(f.id);
            else
                next.add(f.id);
            return next;
        });
    };
    const openItem = (f) => {
        if (f.locked) {
            open(React.createElement(UnlockDialog, { type: f.isFolder ? "folders" : "files", item: f }));
            return;
        }
        if (f.isFolder) {
            setFolderId(f.id);
            setExpanded(new Set(expanded).add(f.id));
        }
        else
            open(React.createElement(FilePreview, { file: f }));
    };
    const zip = async (all = false) => {
        try {
            const r = await fetch("/api/zip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: all
                        ? files.filter((f) => f.parentId === folderId).map((f) => f.id)
                        : selected.filter((id) => files.some((f) => f.id === id)),
                    folderIds: all
                        ? folderId
                            ? [folderId]
                            : folders.filter((f) => !f.parentId).map((f) => f.id)
                        : selected.filter((id) => folders.some((f) => f.id === id)),
                }),
            });
            if (!r.ok)
                throw Error((await r.json()).error);
            const url = URL.createObjectURL(await r.blob());
            const a = document.createElement("a");
            a.href = url;
            a.download = `${current?.name || category.name}.zip`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            notify("ZIP 다운로드를 시작했습니다.");
        }
        catch (e) {
            notify(e.message, "warning");
        }
    };
    const bulkDelete = () => open(React.createElement(ConfirmDialog, { title: `${selected.length}개 항목을 휴지통으로 이동할까요?`, description: "\uD3F4\uB354\uC5D0 \uD3EC\uD568\uB41C \uC790\uB8CC\uB3C4 \uD568\uAED8 \uC228\uACA8\uC9D1\uB2C8\uB2E4. 30\uC77C \uC774\uB0B4\uC5D0 \uBCF5\uAD6C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", label: "\uD734\uC9C0\uD1B5 \uC774\uB3D9", danger: true, onConfirm: async () => {
            await act({
                action: "batch",
                data: {
                    commands: selectedRoots(sorted.filter((f) => selected.includes(f.id)), folders).map((f) => ({
                        action: "delete",
                        type: f.isFolder ? "folders" : "files",
                        targetId: f.id,
                        version: f.version,
                    })),
                },
            });
            setSelected([]);
        } }));
    const tree = (parent = null, depth = 0) => folders
        .filter((f) => f.parentId === parent)
        .map((f) => {
        const children = folders.some((x) => x.parentId === f.id), isExpanded = expanded.has(f.id);
        return (React.createElement("div", { key: f.id, role: "treeitem", "aria-expanded": children ? isExpanded : undefined, "aria-selected": folderId === f.id },
            React.createElement("button", { className: `tree-node ${folderId === f.id ? "selected" : ""} depth-${Math.min(depth, 2)}`, style: { paddingLeft: 12 + depth * 18 }, onClick: () => selectFolder(f), title: f.name },
                children ? (isExpanded ? (React.createElement(ChevronDown, { size: 13 })) : (React.createElement(ChevronRight, { size: 13 }))) : (React.createElement("span", { className: "tree-arrow-placeholder" })),
                isExpanded ? React.createElement(FolderOpen, { size: 19 }) : React.createElement(Folder, { size: 19 }),
                React.createElement("span", null, f.name),
                React.createElement(LockMark, { item: f })),
            children && isExpanded && (React.createElement("div", { role: "group" }, tree(f.id, depth + 1)))));
    });
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: category.id === "tax-documents"
                ? "세금계산서"
                : category.type === "drive"
                    ? "제품 드라이브"
                    : "자료실", description: `${category.name} · 폴더별로 자료를 정리하고 빠르게 찾아보세요.` },
            category.id === "tax-documents" && (React.createElement(Button, { onClick: () => {
                    const [year, month] = seoulDate().split("-");
                    const folder = folders.find((f) => f.id === `tax-${year}-${Number(month)}`);
                    if (folder) {
                        selectFolder(folder);
                        setExpanded(new Set(["tax-root", `tax-${year}`, folder.id]));
                    }
                } }, "\uC774\uBC88 \uB2EC \uD3F4\uB354")),
            category.id !== "tax-documents" && (React.createElement(Button, { onClick: () => navigate("tax") }, "\uACF5\uD1B5 \uC138\uAE08\uACC4\uC0B0\uC11C")),
            allowed("files", "create") && (React.createElement(Button, { icon: Plus, onClick: () => open(React.createElement(FolderForm, { parentId: folderId })) }, folderId ? "새 하위 폴더" : "새 폴더")),
            folderId && allowed("files", "delete") && (React.createElement(Button, { danger: true, icon: Trash2, onClick: () => open(React.createElement(ConfirmDialog, { title: `“${current.name}” 폴더를 휴지통으로 이동할까요?`, description: "\uD558\uC704 \uD3F4\uB354\uC640 \uD30C\uC77C\uB3C4 \uD568\uAED8 \uC228\uACA8\uC9D1\uB2C8\uB2E4. 30\uC77C \uC774\uB0B4\uC5D0 \uD734\uC9C0\uD1B5\uC5D0\uC11C \uBCF5\uAD6C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", label: "\uD3F4\uB354 \uC0AD\uC81C", danger: true, onConfirm: async () => {
                        await act({
                            action: "delete",
                            type: "folders",
                            targetId: current.id,
                            version: current.version,
                        });
                        setFolderId(null);
                        setSelected([]);
                    } })) }, "\uD604\uC7AC \uD3F4\uB354 \uC0AD\uC81C")),
            allowed("files", "upload") && (React.createElement(Button, { primary: true, icon: Upload, onClick: () => open(React.createElement(UploadDialog, { parentId: folderId })) }, "\uD30C\uC77C \uC5C5\uB85C\uB4DC"))),
        React.createElement("div", { className: "filters" },
            React.createElement(SearchField, { value: q, onChange: setQ, placeholder: "\uC774 \uD3F4\uB354 \uBC0F \uD558\uC704 \uD3F4\uB354\uC5D0\uC11C \uAC80\uC0C9" }),
            React.createElement(Select, { "aria-label": "\uD30C\uC77C \uD615\uC2DD", value: kind, onChange: (e) => setKind(e.target.value) },
                React.createElement("option", { value: "all" }, "\uC804\uCCB4 \uD615\uC2DD"),
                React.createElement("option", { value: "image" }, "\uC774\uBBF8\uC9C0"),
                React.createElement("option", { value: "pdf" }, "PDF"),
                React.createElement("option", { value: "drawing" }, "\uB3C4\uBA74 (DWG\u00B7DXF)"),
                React.createElement("option", { value: "excel" }, "Excel"),
                React.createElement("option", { value: "document" }, "\uAE30\uD0C0 \uBB38\uC11C"))),
        React.createElement("div", { className: "drive-layout" },
            React.createElement(Panel, { className: "folder-sidebar" },
                React.createElement("div", { className: "folder-tree-heading" },
                    "\uD3F4\uB354 ",
                    React.createElement("small", null, folders.length)),
                React.createElement("button", { className: `tree-root ${folderId === null ? "selected" : ""}`, onClick: () => {
                        setFolderId(null);
                        setQ("");
                    } },
                    React.createElement(FolderOpen, { size: 20 }),
                    React.createElement("span", null,
                        category.name,
                        " ",
                        React.createElement("small", null, "(\uC804\uCCB4)"))),
                React.createElement("div", { role: "tree", "aria-label": "\uD3F4\uB354 \uD0D0\uC0C9" }, tree()),
                React.createElement("div", { className: "tree-help" }, "\uD3F4\uB354\uB97C \uB2E4\uC2DC \uB204\uB974\uBA74 \uD558\uC704 \uBAA9\uB85D\uC774 \uC811\uD799\uB2C8\uB2E4.")),
            React.createElement("div", { className: "drive-content" },
                React.createElement("div", { className: "drive-path" },
                    React.createElement("button", { onClick: () => setFolderId(null) },
                        React.createElement(Folder, { size: 15 }),
                        category.name),
                    path.map((p) => (React.createElement(React.Fragment, { key: p.id },
                        React.createElement(ChevronRight, { size: 13 }),
                        React.createElement("button", { onClick: () => setFolderId(p.id) }, p.name)))),
                    React.createElement("span", null,
                        sorted.length,
                        "\uAC1C \uD56D\uBAA9")),
                selected.length > 0 && (React.createElement("div", { className: "selection-bar" },
                    React.createElement("strong", null,
                        selected.length,
                        "\uAC1C \uC120\uD0DD"),
                    React.createElement(Button, { small: true, icon: Download, onClick: () => zip() }, "ZIP \uB2E4\uC6B4\uB85C\uB4DC"),
                    allowed("files", "edit") && (React.createElement(Button, { small: true, icon: MoveRight, onClick: () => open(React.createElement(MoveDialog, { items: sorted.filter((f) => selected.includes(f.id)) })) }, "\uC774\uB3D9")),
                    allowed("files", "delete") && (React.createElement(Button, { small: true, danger: true, icon: Trash2, onClick: bulkDelete }, "\uC0AD\uC81C")),
                    React.createElement(IconButton, { icon: X, label: "\uC120\uD0DD \uD574\uC81C", onClick: () => setSelected([]) }))),
                React.createElement(Panel, { className: `drive-table ${drop ? "drag-over" : ""}` },
                    React.createElement("div", { onDragOver: (e) => {
                            if (allowed("files", "upload")) {
                                e.preventDefault();
                                setDrop(true);
                            }
                        }, onDragLeave: () => setDrop(false), onDrop: (e) => {
                            e.preventDefault();
                            setDrop(false);
                            if (!allowed("files", "upload"))
                                return;
                            const items = [...e.dataTransfer.items];
                            if (items.some((i) => i.webkitGetAsEntry?.()?.isDirectory)) {
                                notify("폴더 전체 업로드는 지원하지 않습니다. 파일을 선택해 주세요.", "warning");
                                return;
                            }
                            open(React.createElement(UploadDialog, { parentId: folderId, initialFiles: [...e.dataTransfer.files] }));
                        } },
                        React.createElement("div", { className: "table-scroll" },
                            React.createElement("table", null,
                                React.createElement("thead", null,
                                    React.createElement("tr", null,
                                        React.createElement("th", { className: "checkbox-cell" },
                                            React.createElement("input", { type: "checkbox", "aria-label": "\uD56D\uBAA9 \uC804\uCCB4 \uC120\uD0DD", checked: sorted.length > 0 &&
                                                    sorted.every((f) => selected.includes(f.id)), onChange: (e) => setSelected(e.target.checked ? sorted.map((f) => f.id) : []) })),
                                        React.createElement(SortableTh, { column: "name", sort: sort, onSort: setSort }, "\uC774\uB984"),
                                        React.createElement(SortableTh, { column: "size", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uD06C\uAE30"),
                                        React.createElement(SortableTh, { column: "updated", sort: sort, onSort: setSort, defaultDirection: "desc" }, "\uC218\uC815\uC77C"),
                                        React.createElement(SortableTh, { column: "owner", sort: sort, onSort: setSort }, "\uB4F1\uB85D\uC790"),
                                        React.createElement("th", null))),
                                React.createElement("tbody", null, sorted.map((f) => (React.createElement("tr", { key: f.id, className: "clickable", tabIndex: 0, onKeyDown: (e) => {
                                        if (e.target === e.currentTarget &&
                                            (e.key === "Enter" || e.key === " ")) {
                                            e.preventDefault();
                                            e.currentTarget.click();
                                        }
                                    }, onClick: () => openItem(f) },
                                    React.createElement("td", { onClick: (e) => e.stopPropagation() },
                                        React.createElement("input", { type: "checkbox", "aria-label": `${f.name} 선택`, checked: selected.includes(f.id), onChange: (e) => setSelected(e.target.checked
                                                ? [...selected, f.id]
                                                : selected.filter((id) => id !== f.id)) })),
                                    React.createElement("td", null,
                                        React.createElement("div", { className: "file-name" },
                                            f.isFolder ? (React.createElement("span", { className: "folder-tile" },
                                                React.createElement(Folder, { size: 23 }))) : (React.createElement(FileIcon, { file: f })),
                                            React.createElement("span", null,
                                                React.createElement("strong", null, f.name),
                                                f.locked && React.createElement("small", null, "\uBE44\uBC00\uBC88\uD638\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4"),
                                                f.status === "uploading" && (React.createElement("small", null, "\uC5C5\uB85C\uB4DC \uC911")),
                                                f.referenceOnly && (React.createElement("small", null, "\uBAA9\uC5C5 \uCC38\uC870 \u00B7 \uC6D0\uBCF8 \uBBF8\uCCA8\uBD80"))),
                                            React.createElement(LockMark, { item: f }))),
                                    React.createElement("td", { className: "subtle" }, f.isFolder ? "—" : f.locked ? "잠김" : bytes(f.size)),
                                    React.createElement("td", { className: "subtle nowrap" }, date(f.updatedAt)),
                                    React.createElement("td", { className: "subtle" }, state.users.find((u) => u.id === f.createdBy)
                                        ?.name || "—"),
                                    React.createElement("td", { onClick: (e) => e.stopPropagation() },
                                        React.createElement(IconButton, { icon: MoreHorizontal, label: `${f.name} 더 보기`, onClick: () => open(React.createElement(ItemActions, { item: f })) })))))))),
                        !sorted.length && (React.createElement(Empty, { title: q ? "검색 결과가 없습니다" : "아직 파일이 없습니다", description: q
                                ? "검색어나 형식을 변경해 보세요."
                                : "파일을 이곳으로 끌어 놓거나 업로드 버튼으로 추가하세요.", action: allowed("files", "upload") &&
                                !q && (React.createElement(Button, { small: true, icon: Upload, onClick: () => open(React.createElement(UploadDialog, { parentId: folderId })) }, "\uD30C\uC77C \uC5C5\uB85C\uB4DC")) }))),
                    React.createElement("div", { className: "table-foot" },
                        React.createElement("span", null,
                            "\uD3F4\uB354 ",
                            visibleFolders.length,
                            "\uAC1C \u00B7 \uD30C\uC77C ",
                            visibleFiles.length,
                            "\uAC1C"),
                        React.createElement("button", { className: "text-button", onClick: () => zip(true) },
                            React.createElement(Download, { size: 13 }),
                            "\uD3F4\uB354 \uC804\uCCB4 ZIP"))),
                React.createElement("div", { className: "drive-tip" },
                    React.createElement(Upload, { size: 15 }),
                    React.createElement("span", null, "\uD30C\uC77C\uB2F9 \uCD5C\uB300 50MB \u00B7 \uC5EC\uB7EC \uD30C\uC77C\uC744 \uD55C \uBC88\uC5D0 \uC120\uD0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."),
                    React.createElement("small", null, "ZIP \uCD5C\uB300 100\uAC1C / 200MB"))))));
}
function FolderForm({ parentId = null, item }) {
    const { category, state, act, close } = useApp();
    const [name, setName] = useState(item?.name || ""), [error, setError] = useState("");
    return (React.createElement(Modal, { title: item ? "폴더 이름 변경" : "새 폴더", onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                try {
                    await act({
                        action: "save",
                        type: "folders",
                        targetId: item?.id,
                        version: item?.version,
                        data: {
                            name,
                            parentId: item?.parentId || parentId,
                            categoryId: item?.categoryId || category.id,
                        },
                    });
                    close();
                }
                catch (e) {
                    setError(e.message);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement("p", { className: "hint" },
                    "\uC704\uCE58:",
                    " ",
                    state.folders.find((f) => f.id === (item?.parentId || parentId))
                        ?.name || category.name),
                React.createElement(Field, { label: "\uD3F4\uB354\uBA85", required: true },
                    React.createElement("input", { autoFocus: true, required: true, maxLength: 200, value: name, onChange: (e) => setName(e.target.value), placeholder: "\uD3F4\uB354 \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694" })),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { type: "button", onClick: close }, "\uCDE8\uC18C"),
                React.createElement(Button, { primary: true }, item ? "저장" : "폴더 만들기")))));
}
export function UploadDialog({ parentId = null, targetType, targetId, initialFiles = [], }) {
    const { category, close, reload, notify } = useApp();
    const [files, setFiles] = useState(initialFiles.map((file) => ({ file, status: "pending", progress: 0 }))), [stage, setStage] = useState(""), [busy, setBusy] = useState(false);
    const input = useRef();
    const xhrRef = useRef(null), cancelled = useRef(false);
    useEffect(() => () => {
        cancelled.current = true;
        xhrRef.current?.abort();
    }, []);
    const start = async () => {
        cancelled.current = false;
        setBusy(true);
        let success = 0;
        for (let i = 0; i < files.length; i++) {
            if (cancelled.current)
                break;
            const f = files[i];
            if (f.status === "done")
                continue;
            if (f.file.size > 50_000_000) {
                setFiles((v) => v.map((x, j) => j === i
                    ? { ...x, status: "failed", error: "파일당 50MB를 초과했습니다." }
                    : x));
                continue;
            }
            setFiles((v) => v.map((x, j) => (j === i ? { ...x, status: "uploading" } : x)));
            try {
                const body = new FormData();
                body.append("file", f.file);
                body.append("categoryId", category.id);
                if (parentId)
                    body.append("parentId", parentId);
                if (targetId) {
                    body.append("targetId", targetId);
                    body.append("targetType", targetType);
                }
                if (stage)
                    body.append("stage", stage);
                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhrRef.current = xhr;
                    xhr.timeout = 120000;
                    xhr.ontimeout = () => reject(Error("업로드 시간이 초과되었습니다. 목록을 확인한 후 다시 시도해 주세요."));
                    xhr.onabort = () => reject(Error("업로드를 중단했습니다. 이미 저장된 파일은 유지됩니다."));
                    xhr.open("POST", "/api/upload");
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable)
                            setFiles((v) => v.map((x, j) => j === i
                                ? { ...x, progress: Math.round((e.loaded / e.total) * 100) }
                                : x));
                    };
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300)
                            resolve();
                        else {
                            try {
                                reject(Error(JSON.parse(xhr.responseText).error));
                            }
                            catch {
                                reject(Error("업로드에 실패했습니다."));
                            }
                        }
                    };
                    xhr.onerror = () => reject(Error("연결이 끊겼습니다. 다시 시도해 주세요."));
                    xhr.send(body);
                });
                setFiles((v) => v.map((x, j) => j === i ? { ...x, status: "done", progress: 100 } : x));
                success++;
            }
            catch (e) {
                setFiles((v) => v.map((x, j) => j === i ? { ...x, status: "failed", error: e.message } : x));
            }
        }
        await reload();
        setBusy(false);
        if (success)
            notify(`${success}개 파일을 업로드했습니다.`);
    };
    return (React.createElement(Modal, { title: "\uD30C\uC77C \uC5C5\uB85C\uB4DC", subtitle: "\uC6D0\uBCF8 \uD30C\uC77C\uC744 \uADF8\uB300\uB85C \uBCF4\uAD00\uD569\uB2C8\uB2E4. \uD30C\uC77C\uB2F9 \uCD5C\uB300 50MB.", onClose: () => {
            if (!busy)
                close();
        } },
        React.createElement("div", { className: "modal-body" },
            React.createElement("input", { ref: input, type: "file", multiple: true, className: "sr-only", onChange: (e) => setFiles([
                    ...files,
                    ...[...e.target.files].map((file) => ({
                        file,
                        status: "pending",
                        progress: 0,
                    })),
                ]) }),
            React.createElement("button", { className: "upload-drop", disabled: busy, onClick: () => input.current.click() },
                React.createElement(Upload, { size: 28 }),
                React.createElement("strong", null, "\uD30C\uC77C \uC120\uD0DD"),
                React.createElement("span", null, "\uC5EC\uB7EC \uD30C\uC77C \uC120\uD0DD \uAC00\uB2A5 \u00B7 \uD3F4\uB354 \uC804\uCCB4 \uC5C5\uB85C\uB4DC \uC81C\uC678")),
            targetType === "equipment" && (React.createElement(Field, { label: "\uC0AC\uC9C4 \uB2E8\uACC4 (\uC120\uD0DD)" },
                React.createElement("select", { disabled: busy, value: stage, onChange: (e) => setStage(e.target.value) },
                    React.createElement("option", { value: "" }, "\uB2E8\uACC4 \uC9C0\uC815 \uC548 \uD568"),
                    STAGES.map((s) => (React.createElement("option", { key: s }, s)))))),
            React.createElement("div", { className: "upload-list" }, files.map((f, i) => (React.createElement("div", { key: i },
                React.createElement(File, { size: 19 }),
                React.createElement("span", null,
                    React.createElement("strong", null, f.file.name),
                    React.createElement("small", null,
                        bytes(f.file.size),
                        f.error && React.createElement("b", { className: "text-red" },
                            " \u00B7 ",
                            f.error)),
                    f.status === "uploading" && (React.createElement("div", { className: "meter" },
                        React.createElement("i", { style: { width: f.progress + "%" } })))),
                f.status === "done" ? (React.createElement(CheckCircle2, { size: 18, className: "text-green" })) : f.status === "failed" ? (React.createElement(AlertTriangle, { size: 18, className: "text-amber" })) : f.status === "uploading" ? (React.createElement("small", null,
                    f.progress,
                    "%")) : (React.createElement(IconButton, { icon: X, label: "\uC5C5\uB85C\uB4DC \uC81C\uC678", disabled: busy, onClick: () => setFiles(files.filter((_, j) => j !== i)) }))))))),
        React.createElement("footer", { className: "modal-foot" },
            busy && (React.createElement(Button, { danger: true, onClick: () => {
                    cancelled.current = true;
                    xhrRef.current?.abort();
                } }, "\uC5C5\uB85C\uB4DC \uC911\uB2E8")),
            React.createElement(Button, { disabled: busy, onClick: close }, "\uB2EB\uAE30"),
            React.createElement(Button, { primary: true, icon: Upload, loading: busy, disabled: !files.some((f) => f.status !== "done"), onClick: start }, files.some((f) => f.status === "failed")
                ? "실패 파일 재시도"
                : "업로드 시작"))));
}
function ItemActions({ item }) {
    const { open, close, act, allowed } = useApp();
    const type = item.isFolder ? "folders" : "files";
    return (React.createElement(Modal, { title: item.name, onClose: close },
        React.createElement("div", { className: "modal-body action-menu" },
            item.isFolder && !item.locked && (React.createElement(Button, { icon: FileText, onClick: () => open(React.createElement(Modal, { title: item.name, subtitle: "\uD3F4\uB354 \uC5C5\uBB34 \uBA54\uBAA8", onClose: close },
                    React.createElement("div", { className: "modal-body" },
                        React.createElement(MemoPanel, { type: "folders", id: item.id })))) }, "\uD3F4\uB354 \uBA54\uBAA8")),
            item.locked ? (React.createElement(Button, { icon: LockKeyhole, onClick: () => open(React.createElement(UnlockDialog, { type: type, item: item })) }, "\uC7A0\uAE08 \uD574\uC81C")) : (React.createElement(React.Fragment, null,
                !item.isFolder && !item.referenceOnly && (React.createElement("a", { className: "btn", href: `/api/files/${item.id}` },
                    React.createElement(Download, { size: 16 }),
                    "\uC6D0\uBCF8 \uB2E4\uC6B4\uB85C\uB4DC")),
                item.referenceOnly && (React.createElement("p", { className: "hint" }, "\uACE0\uAC1D \uCEE8\uD38C \uBAA9\uC5C5\uC5D0\uC11C \uC774\uAD00\uD55C \uD30C\uC77C \uC815\uBCF4\uC785\uB2C8\uB2E4. \uC6D0\uBCF8 \uD30C\uC77C\uC740 \uD3EC\uD568\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")),
                allowed("files", "edit") && (React.createElement(React.Fragment, null,
                    React.createElement(Button, { icon: Pencil, onClick: () => open(item.isFolder ? (React.createElement(FolderForm, { item: item })) : (React.createElement(RenameFile, { item: item }))) }, "\uC774\uB984 \uBCC0\uACBD"),
                    React.createElement(Button, { icon: MoveRight, onClick: () => open(React.createElement(MoveDialog, { items: [item] })) }, "\uD3F4\uB354 \uC774\uB3D9"))),
                allowed("locks", "edit") && (React.createElement(Button, { icon: LockKeyhole, onClick: () => open(React.createElement(LockDialog, { type: type, item: item })) }, "\uC811\uADFC \uC124\uC815")),
                allowed("files", "delete") && (React.createElement(Button, { danger: true, icon: Trash2, onClick: () => open(React.createElement(ConfirmDialog, { title: "\uD734\uC9C0\uD1B5\uC73C\uB85C \uC774\uB3D9\uD560\uAE4C\uC694?", description: `${item.name} · 30일 이내에 복구할 수 있습니다.`, danger: true, label: "\uD734\uC9C0\uD1B5 \uC774\uB3D9", onConfirm: () => act({
                            action: "delete",
                            type,
                            targetId: item.id,
                            version: item.version,
                        }) })) }, "\uD734\uC9C0\uD1B5 \uC774\uB3D9")))))));
}
function RenameFile({ item }) {
    const { act, close } = useApp();
    const [name, set] = useState(item.name), [error, setError] = useState("");
    return (React.createElement(Modal, { title: "\uD30C\uC77C \uC774\uB984 \uBCC0\uACBD", onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                try {
                    await act({
                        action: "file-edit",
                        type: "files",
                        targetId: item.id,
                        version: item.version,
                        data: { name },
                    });
                    close();
                }
                catch (e) {
                    setError(e.message);
                }
            } },
            React.createElement("div", { className: "modal-body" },
                React.createElement(Field, { label: "\uD30C\uC77C\uBA85" },
                    React.createElement("input", { value: name, onChange: (e) => set(e.target.value), autoFocus: true, required: true })),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { primary: true }, "\uC800\uC7A5")))));
}
function MoveDialog({ items }) {
    const { state, category, act, close } = useApp();
    const [parentId, set] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    const forbidden = new Set(items
        .filter((x) => x.isFolder)
        .flatMap((f) => [...folderChildren(state.folders, f.id)]));
    return (React.createElement(Modal, { title: `${items.length}개 항목 이동`, onClose: close },
        React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await act({
                        action: "batch",
                        data: {
                            commands: selectedRoots(items, state.folders).map((item) => ({
                                action: item.isFolder ? "save" : "file-edit",
                                type: item.isFolder ? "folders" : "files",
                                targetId: item.id,
                                version: item.version,
                                data: item.isFolder
                                    ? { ...item, parentId: parentId || null }
                                    : { parentId: parentId || null },
                            })),
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
                React.createElement(Field, { label: "\uC774\uB3D9\uD560 \uD3F4\uB354" },
                    React.createElement("select", { value: parentId, onChange: (e) => set(e.target.value) },
                        React.createElement("option", { value: "" },
                            category.name,
                            " (\uCD5C\uC0C1\uC704)"),
                        state.folders
                            .filter((f) => f.categoryId === category.id &&
                            !f.locked &&
                            !forbidden.has(f.id))
                            .map((f) => (React.createElement("option", { key: f.id, value: f.id }, f.name))))),
                React.createElement("p", { className: "hint" }, "\uC0C1\uC704 \uD3F4\uB354\uC758 \uC7A0\uAE08 \uC815\uCC45\uC744 \uD655\uC778\uD55C \uD6C4 \uC774\uB3D9\uD574 \uC8FC\uC138\uC694."),
                React.createElement(ErrorNote, { error: error })),
            React.createElement("footer", { className: "modal-foot" },
                React.createElement(Button, { primary: true, loading: busy }, "\uC774\uB3D9")))));
}
export function FilePreview({ file: initialFile }) {
    const { close, open, allowed, act, state, notify } = useApp();
    const file = state.files.find((f) => f.id === initialFile.id) || initialFile;
    const t = typeOf(file);
    return (React.createElement(Modal, { title: file.name, subtitle: `${bytes(file.size)} · ${date(file.createdAt)}`, wide: true, drawer: true, onClose: close },
        React.createElement("div", { className: "file-preview" }, file.referenceOnly ? (React.createElement("div", { className: "empty" },
            React.createElement(FileIcon, { file: file }),
            React.createElement("strong", null, "\uBAA9\uC5C5\uC5D0\uC11C \uC774\uAD00\uD55C \uCC38\uC870 \uD30C\uC77C\uC785\uB2C8\uB2E4"),
            React.createElement("p", null, "\uD30C\uC77C\uBA85\u00B7\uC704\uCE58\u00B7\uC6A9\uB7C9\u00B7\uB4F1\uB85D\uC77C\uB9CC \uBAA9\uC5C5\uC5D0 \uC788\uC5C8\uC73C\uBA70 \uC2E4\uC81C \uC6D0\uBCF8\uC740 \uD3EC\uD568\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC6D0\uBCF8\uC744 \uD655\uBCF4\uD558\uBA74 \uC774 \uD3F4\uB354\uC5D0 \uC5C5\uB85C\uB4DC\uD574 \uC8FC\uC138\uC694."))) : t === "image" ? (React.createElement("img", { src: `/api/files/${file.id}?preview=1`, alt: file.name })) : t === "pdf" ? (React.createElement("iframe", { src: `/api/files/${file.id}?preview=1`, title: file.name })) : (React.createElement("div", { className: "empty" },
            React.createElement(FileIcon, { file: file }),
            React.createElement("strong", null, "\uB2E4\uC6B4\uB85C\uB4DC\uD558\uC5EC \uD655\uC778\uD558\uB294 \uBB38\uC11C\uC785\uB2C8\uB2E4"),
            React.createElement("p", null, "CAD\u00B7Office\u00B7HWP \uD30C\uC77C\uC740 \uC6D0\uBCF8 \uD504\uB85C\uADF8\uB7A8\uC5D0\uC11C \uC5F4\uC5B4 \uC8FC\uC138\uC694."),
            React.createElement("a", { className: "btn primary", href: `/api/files/${file.id}` },
                React.createElement(Download, { size: 15 }),
                "\uC6D0\uBCF8 \uB2E4\uC6B4\uB85C\uB4DC")))),
        React.createElement("div", { className: "file-memo" },
            React.createElement("details", null,
                React.createElement("summary", null, "\uD30C\uC77C \uC5C5\uBB34 \uBA54\uBAA8"),
                React.createElement(MemoPanel, { type: "files", id: file.id }))),
        React.createElement("footer", { className: "modal-foot" },
            typeOf(file) === "image" && allowed("files", "edit") ? (React.createElement("select", { "aria-label": "\uC0AC\uC9C4 \uB2E8\uACC4 \uBCC0\uACBD", value: file.stage || "", onChange: async (e) => {
                    try {
                        await act({
                            action: "file-edit",
                            type: "files",
                            targetId: file.id,
                            version: file.version,
                            data: { stage: e.target.value },
                        });
                    }
                    catch (error) {
                        notify(error.message, "warning");
                    }
                } },
                React.createElement("option", { value: "" }, "\uC0AC\uC9C4 \uB2E8\uACC4 \uBBF8\uC9C0\uC815"),
                STAGES.map((s) => (React.createElement("option", { key: s }, s))))) : (file.stage && React.createElement(Badge, null, file.stage)),
            allowed("locks", "edit") && (React.createElement(Button, { icon: LockKeyhole, onClick: () => open(React.createElement(LockDialog, { type: "files", item: file })) }, "\uC811\uADFC \uC124\uC815")),
            !file.referenceOnly && (React.createElement("a", { className: "btn primary", href: `/api/files/${file.id}` },
                React.createElement(Download, { size: 15 }),
                "\uC6D0\uBCF8 \uB2E4\uC6B4\uB85C\uB4DC")))));
}
export function FilesPanel({ targetType, targetId, photos = false }) {
    const { state, open, allowed } = useApp();
    const [stage, setStage] = useState("전체");
    const files = state.files.filter((f) => f.targetType === targetType &&
        f.targetId === targetId &&
        (!photos || typeOf(f) === "image") &&
        (stage === "전체" || f.stage === stage));
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "section-heading" },
            React.createElement("h3", null,
                photos ? "단계별 사진" : "첨부 자료",
                " ",
                React.createElement("span", null, files.length)),
            allowed("files", "upload") && (React.createElement(Button, { small: true, icon: Upload, onClick: () => open(React.createElement(UploadDialog, { targetType: targetType, targetId: targetId })) }, "\uD30C\uC77C \uCD94\uAC00"))),
        photos && (React.createElement("div", { className: "photo-filters" }, ["전체", ...STAGES].map((s) => (React.createElement("button", { className: stage === s ? "active" : "", key: s, onClick: () => setStage(s) }, s))))),
        files.length ? (React.createElement("div", { className: photos ? "photo-grid" : "attachment-list" }, files.map((f) => photos ? (React.createElement("button", { key: f.id, onClick: () => open(f.locked ? (React.createElement(UnlockDialog, { type: "files", item: f })) : (React.createElement(FilePreview, { file: f }))) },
            f.locked ? (React.createElement(LockKeyhole, { size: 30 })) : (React.createElement("img", { src: `/api/files/${f.id}?thumbnail=1&preview=1`, alt: f.name, loading: "lazy" })),
            React.createElement("span", null, f.name),
            f.stage && React.createElement(Badge, null, f.stage))) : (React.createElement("div", { key: f.id },
            React.createElement(FileIcon, { file: f, small: true }),
            React.createElement("button", { onClick: () => open(f.locked ? (React.createElement(UnlockDialog, { type: "files", item: f })) : (React.createElement(FilePreview, { file: f }))) },
                React.createElement("strong", null, f.name),
                React.createElement("small", null, bytes(f.size))),
            React.createElement(LockMark, { item: f }),
            !f.locked && (React.createElement("a", { href: `/api/files/${f.id}`, className: "icon-btn", "aria-label": `${f.name} 다운로드` },
                React.createElement(Download, { size: 16 })))))))) : (React.createElement(Empty, { title: photos ? "등록된 사진이 없습니다" : "첨부된 파일이 없습니다", description: "\uC790\uB8CC\uB97C \uCD94\uAC00\uD558\uBA74 \uC774 \uC5C5\uBB34\uC640 \uD568\uAED8 \uBCF4\uAD00\uB429\uB2C8\uB2E4." }))));
}
export function TrashPage() {
    const { state, act, notify, allowed } = useApp();
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHead, { title: "\uD734\uC9C0\uD1B5", description: "\uC0AD\uC81C\uD55C \uC790\uB8CC\uB97C 30\uC77C \uB3D9\uC548 \uBCF4\uAD00\uD569\uB2C8\uB2E4. \uC0C1\uC704 \uD3F4\uB354\uBD80\uD130 \uBCF5\uAD6C\uD574 \uC8FC\uC138\uC694." }),
        React.createElement(Panel, null,
            React.createElement("div", { className: "table-scroll" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "\uC790\uB8CC \uC774\uB984"),
                            React.createElement("th", null, "\uC885\uB958"),
                            React.createElement("th", null, "\uC0AD\uC81C\uC77C"),
                            React.createElement("th", null, "\uBCF4\uAD00 \uAE30\uD55C"),
                            React.createElement("th", null))),
                    React.createElement("tbody", null, state.trash.map((f) => (React.createElement("tr", { key: f.type + f.id },
                        React.createElement("td", null,
                            React.createElement("strong", null, f.name)),
                        React.createElement("td", null, {
                            files: "파일",
                            folders: "폴더",
                            equipment: "설비",
                            customers: "고객사",
                        }[f.type]),
                        React.createElement("td", null, date(f.deletedAt)),
                        React.createElement("td", null, date(new Date(new Date(f.deletedAt).getTime() + 30 * 86400000))),
                        React.createElement("td", null,
                            React.createElement(Button, { disabled: !allowed("files", "delete"), small: true, icon: RotateCcw, onClick: async () => {
                                    try {
                                        await act({
                                            action: "restore",
                                            type: f.type,
                                            targetId: f.id,
                                            version: f.version,
                                        });
                                    }
                                    catch (e) {
                                        notify(e.message, "warning");
                                    }
                                } }, "\uBCF5\uAD6C")))))))),
            !state.trash.length && (React.createElement(Empty, { title: "\uD734\uC9C0\uD1B5\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4", description: "\uC0AD\uC81C\uB41C \uC77C\uBC18 \uC790\uB8CC\uB294 \uC774\uACF3\uC5D0\uC11C \uBCF5\uAD6C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." })))));
}
