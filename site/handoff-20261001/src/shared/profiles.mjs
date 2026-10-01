import { makers, productCategories, tradeTerms } from "./catalog.mjs";
import { expandMaker } from "./maker-aliases.mjs";
export const TONNAGE_RANGES = [
    "1~30",
    "30~50",
    "50~80",
    "80~100",
    "100~200",
    "200~300",
    "300~500",
    "500~1000",
    "1000~1500",
    "1500~2000",
    "2000~",
];
export const STROKE_RANGES = [
    "1~20",
    "20~40",
    "40~60",
    "60~80",
    "80~100",
    "100~150",
    "150~200",
    "200~300",
    "300~400",
    "400~500",
    "500~1000",
    "1000~",
];
export const DIE_HEIGHT_RANGES = [
    "1~100",
    "100~200",
    "200~300",
    "300~400",
    "400~500",
    "500~700",
    "700~1000",
    "1000~",
];
export function numericRange(value) {
    const text = String(value ?? "")
        .replaceAll(",", "")
        .trim();
    if (!text)
        return null;
    const range = text.match(/^(\d+(?:\.\d+)?)\s*[~～-]\s*(\d+(?:\.\d+)?)?$/);
    if (range)
        return {
            min: Number(range[1]),
            max: range[2] ? Number(range[2]) : Infinity,
        };
    const number = Number(text.replace(/\s*(?:ton|톤|mm)$/i, ""));
    return Number.isFinite(number) ? { min: number, max: number } : null;
}
export function rangeMatches(value, selected) {
    const actual = numericRange(value);
    const expected = numericRange(selected);
    return (!!actual &&
        !!expected &&
        actual.min <= expected.max &&
        actual.max >= expected.min);
}
const customerGroupCollator = new Intl.Collator("ko", {
    numeric: true,
    sensitivity: "base",
});
export function customerGroupSummary(customers = []) {
    const groups = new Map();
    for (const customer of customers) {
        const name = String(customer.groupName || "").trim();
        const key = name || "__ungrouped__";
        const group = groups.get(key) || {
            key,
            name,
            label: name || "미분류",
            count: 0,
            withEmail: 0,
            available: 0,
            customers: [],
        };
        group.count += 1;
        group.withEmail += Number((customer.contacts || []).some((contact) => contact.email));
        group.available += Number(!customer.blocked);
        group.customers.push(customer);
        groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => b.count - a.count || customerGroupCollator.compare(a.label, b.label));
}
export const equipmentFields = [
    ["productClass", "대분류", "select", Object.keys(productCategories)],
    ["productSubclass", "중분류", "subclass"],
    ["maker", "메이커 / 브랜드", "suggest", makers],
    ["machineSerial", "기계번호"],
    ["capacityTons", "가압 능력 (톤)", "number-range", TONNAGE_RANGES],
    ["strokeMm", "스트로크 (mm)", "number-range", STROKE_RANGES],
    ["dieHeightMm", "다이하이트 (mm)", "number-range", DIE_HEIGHT_RANGES],
    ["registeredOn", "등록일", "date"],
    ["introductionDate", "소개일", "date"],
    ["originCountry", "국가선택"],
    ["equipmentLocation", "설비 위치"],
    ["transactionImportance", "업체정보 중요도", "stars"],
    ["transactionCountry", "업체정보 국가"],
    ["supplierId", "매입 거래처", "customer"],
    ["introducedCustomerId", "소개 거래처", "customer"],
    ["buyerId", "판매 고객사", "customer"],
    ["purchaseTerms", "구매조건", "suggest", tradeTerms],
    ["purchasePlace", "구매 장소"],
    ["saleTerms", "판매조건", "suggest", tradeTerms],
    ["salePlace", "판매 인도 장소"],
    ["paymentTerms", "결제조건"],
    ["askingPrice", "판매 희망가격", "number"],
    ["askingCurrency", "판매가격 통화", "select", ["KRW", "USD", "JPY", "EUR"]],
    ["listingStatus", "판매 상태", "select", ["판매중", "판매보류", "판매완료"]],
    ["visibility", "홈페이지 노출 상태", "select", ["미정", "노출", "비노출"]],
    ["priceVisibility", "판매가격 노출", "select", ["미정", "노출", "비노출"]],
    ["advertisingNumbers", "광고 사이트 등록번호", "textarea"],
    ["descriptionKo", "상품내용 (국문)", "textarea"],
    ["descriptionEn", "상품내용 (영문)", "textarea"],
    ["descriptionJa", "상품내용 (일문)", "textarea"],
];
export const customerFields = [
    ["importance", "중요도", "stars"],
    ["registeredOn", "등록일", "date"],
    [
        "interestClass",
        "주요 취급품목 대분류",
        "select",
        Object.keys(productCategories),
    ],
    ["interestSubclass", "주요 취급품목 중분류", "subclass"],
    ["wantedClass", "관심 설비 대분류", "select", Object.keys(productCategories)],
    ["wantedSubclass", "관심 설비 중분류", "subclass"],
    ["wantedTonsMin", "관심 설비 최소 톤수", "number"],
    ["wantedTonsMax", "관심 설비 최대 톤수", "number"],
];
export function profileValues(data, old, fields) {
    const merged = { ...old, ...data };
    for (const [parent, child] of [
        ["productClass", "productSubclass"],
        ["interestClass", "interestSubclass"],
        ["wantedClass", "wantedSubclass"],
    ]) {
        if (merged[child] &&
            !productCategories[merged[parent]]?.includes(merged[child]))
            throw Error("대분류에 맞는 중분류를 선택해 주세요.");
    }
    if (merged.wantedTonsMin !== "" &&
        merged.wantedTonsMax !== "" &&
        Number(merged.wantedTonsMin) > Number(merged.wantedTonsMax))
        throw Error("최대 톤수는 최소 톤수 이상이어야 합니다.");
    return Object.fromEntries(fields.map(([key, label, type, options]) => {
        const value = data[key] ?? old?.[key] ?? "";
        if (["number", "number-range"].includes(type) &&
            value !== "" &&
            !(Number.isFinite(Number(value)) && Number(value) >= 0) &&
            !(type === "number-range" && options.includes(String(value))))
            throw Error(`${label}을 확인해 주세요.`);
        if (type === "stars" && ![0, 1, 2, 3].includes(Number(value)))
            throw Error("중요도는 0~3개로 선택해 주세요.");
        if (type === "select" && value && !options.includes(value))
            throw Error(`${label}을 확인해 주세요.`);
        if (type === "date" &&
            value &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
                !Number.isFinite(Date.parse(value)) ||
                new Date(value).toISOString().slice(0, 10) !== value))
            throw Error(`${label}을 확인해 주세요.`);
        return [
            key,
            String(value)
                .trim()
                .slice(0, type === "textarea" ? 5000 : 500),
        ];
    }));
}
// Search only projected, accessible records. Never accept raw server state here.
export function recordText(record) {
    if (!record || record.locked || record.deletedAt)
        return "";
    const excluded = /^(id|.*Id|.*Ids|passwordHash|storageKey|thumbnailKey|version|lock|lockVersion|createdBy|updatedBy|access|permissions)$/;
    const flatten = (value) => typeof value === "object" && value !== null
        ? Object.entries(value)
            .filter(([key]) => !excluded.test(key))
            .map(([, v]) => flatten(v))
            .join(" ")
        : typeof value === "string" || typeof value === "number"
            ? String(value).replace(/<[^>]*>/g, " ")
            : "";
    return flatten(record);
}
const searchRelations = new WeakMap();
function relations(state) {
    if (searchRelations.has(state))
        return searchRelations.get(state);
    const memos = new Map(), files = new Map(), customers = new Map();
    for (const memo of state.memos || []) {
        if (memo.deletedAt || memo.locked)
            continue;
        const key = `${memo.targetType}:${memo.targetId}`;
        if (!memos.has(key))
            memos.set(key, []);
        memos.get(key).push(recordText(memo));
    }
    for (const file of state.files || []) {
        if (file.deletedAt || file.locked)
            continue;
        const key = `${file.targetType}:${file.targetId}`;
        if (!files.has(key))
            files.set(key, []);
        files.get(key).push(file.name);
    }
    for (const customer of state.customers || []) {
        if (!customer.locked && !customer.deletedAt)
            customers.set(customer.id, customer.name);
    }
    const index = { memos, files, customers };
    searchRelations.set(state, index);
    return index;
}
export function searchableText(state, type, record) {
    if (record.locked || record.deletedAt)
        return "";
    const index = relations(state), key = `${type}:${record.id}`;
    return [
        recordText(record),
        type === "equipment" ? expandMaker(record.maker || record.model) : "",
        ...(index.memos.get(key) || []),
        ...(index.files.get(key) || []),
        ...["supplierId", "buyerId", "customerId", "introducedCustomerId"].map((field) => index.customers.get(record[field]) || ""),
    ].join(" ");
}
