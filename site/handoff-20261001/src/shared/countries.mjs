export const UNKNOWN_COUNTRY = "미상";
export const COUNTRY_OPTIONS = [
    [UNKNOWN_COUNTRY, "미상"],
    ["Korea", "대한민국"],
    ["Japan", "일본"],
    ["China", "중국"],
    ["United States", "미국"],
    ["Canada", "캐나다"],
    ["India", "인도"],
    ["Pakistan", "파키스탄"],
    ["Singapore", "싱가포르"],
    ["Taiwan", "대만"],
    ["Turkey", "튀르키예"],
    ["Indonesia", "인도네시아"],
    ["Vietnam", "베트남"],
    ["Bangladesh", "방글라데시"],
    ["Sri Lanka", "스리랑카"],
    ["Malaysia", "말레이시아"],
    ["Thailand", "태국"],
    ["Hong Kong", "홍콩"],
    ["United Arab Emirates", "아랍에미리트"],
    ["Israel", "이스라엘"],
    ["Iran", "이란"],
    ["Uzbekistan", "우즈베키스탄"],
    ["Australia", "호주"],
    ["New Zealand", "뉴질랜드"],
    ["South Africa", "남아프리카공화국"],
    ["Egypt", "이집트"],
    ["Mexico", "멕시코"],
    ["Brazil", "브라질"],
    ["Bolivia", "볼리비아"],
    ["Germany", "독일"],
    ["Italy", "이탈리아"],
    ["United Kingdom", "영국"],
    ["France", "프랑스"],
    ["Spain", "스페인"],
    ["Netherlands", "네덜란드"],
    ["Belgium", "벨기에"],
    ["Switzerland", "스위스"],
    ["Austria", "오스트리아"],
    ["Ukraine", "우크라이나"],
    ["Russia", "러시아"],
    ["Poland", "폴란드"],
    ["Czech Republic", "체코"],
    ["Slovakia", "슬로바키아"],
    ["Slovenia", "슬로베니아"],
    ["Croatia", "크로아티아"],
    ["Serbia", "세르비아"],
    ["Romania", "루마니아"],
    ["Bulgaria", "불가리아"],
    ["Greece", "그리스"],
    ["Denmark", "덴마크"],
    ["Sweden", "스웨덴"],
    ["Finland", "핀란드"],
    ["Ireland", "아일랜드"],
    ["Lithuania", "리투아니아"],
    ["Armenia", "아르메니아"],
    ["Philippines", "필리핀"],
];
const countryLabels = new Map(COUNTRY_OPTIONS);
const countryCollator = new Intl.Collator("ko", {
    numeric: true,
    sensitivity: "base",
});
export function countryOptionsFromCustomers(customers = []) {
    return [...new Set(customers.map((customer) => customer.country).filter(Boolean))]
        .sort((a, b) => {
        if (a === UNKNOWN_COUNTRY)
            return 1;
        if (b === UNKNOWN_COUNTRY)
            return -1;
        return countryCollator.compare(countryLabels.get(a) || a, countryLabels.get(b) || b);
    })
        .map((value) => [value, countryLabels.get(value) || value]);
}
const COUNTRY_ALIASES = new Map([
    ["south korea", "Korea"],
    ["republic of korea", "Korea"],
    ["대한민국", "Korea"],
    ["한국", "Korea"],
    ["일본", "Japan"],
    ["중국", "China"],
    ["usa", "United States"],
    ["u.s.a", "United States"],
    ["u.s.", "United States"],
    ["미국", "United States"],
    ["u.k", "United Kingdom"],
    ["uk", "United Kingdom"],
    ["england", "United Kingdom"],
    ["bolibia", "Bolivia"],
    ["nederland", "Netherlands"],
]);
export function normalizeCountry(value) {
    const country = String(value || "").trim();
    if (!country || country === "국가선택")
        return "";
    return COUNTRY_ALIASES.get(country.toLocaleLowerCase("en")) || country;
}
export function countryFromGroup(groupName) {
    const group = String(groupName || "").trim();
    if (!group)
        return "";
    if (/일본/.test(group) &&
        !/일본\s*외|일본\s*제외|미국\s*,?\s*일본\s*제외/.test(group))
        return "Japan";
    if (/중국/.test(group) && !/중국\s*외|중국\s*제외/.test(group))
        return "China";
    if (/미국/.test(group) &&
        !/미국[^)]*제외|한국\s*외|해외\s*\(미국\s*제외/.test(group))
        return "United States";
    if (/한국/.test(group) && !/한국\s*외|한국.*해외/.test(group))
        return "Korea";
    return "";
}
export function customerCountry(customer = {}) {
    return (countryFromGroup(customer.groupName) ||
        normalizeCountry(customer.country) ||
        UNKNOWN_COUNTRY);
}
export function applyCustomerCountries(state) {
    let changed = 0;
    for (const customer of state.customers || []) {
        const country = customerCountry(customer);
        if (customer.country !== country) {
            customer.country = country;
            changed += 1;
        }
    }
    return changed;
}
