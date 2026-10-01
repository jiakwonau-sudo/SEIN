const INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
export function hangulInitials(value = "") {
    return String(value)
        .split("")
        .map((char) => {
        const code = char.charCodeAt(0) - 0xac00;
        return code >= 0 && code <= 11171
            ? INITIALS[Math.floor(code / 588)]
            : char;
    })
        .join("");
}
export function normalizeSearch(value = "") {
    return String(value)
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[\s\-_.()[\]{}]+/g, "");
}
export function editDistance(left, right) {
    const a = [...normalizeSearch(left)], b = [...normalizeSearch(right)], row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let previous = row[0];
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const old = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
            previous = old;
        }
    }
    return row[b.length];
}
const preparedCache = new Map();
function prepare(value) {
    const raw = String(value || "");
    if (preparedCache.has(raw))
        return preparedCache.get(raw);
    const entry = {
        raw,
        text: normalizeSearch(raw),
        initials: null,
        words: null,
    };
    // Bound memory when records change during long sessions.
    if (preparedCache.size >= 10000)
        preparedCache.delete(preparedCache.keys().next().value);
    preparedCache.set(raw, entry);
    return entry;
}
function boundedDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max)
        return max + 1;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let previous = row[0];
        row[0] = i;
        let minimum = i;
        for (let j = 1; j <= b.length; j++) {
            const old = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
            previous = old;
            minimum = Math.min(minimum, row[j]);
        }
        if (minimum > max)
            return max + 1;
    }
    return row[b.length];
}
function scorePrepared(q, entry) {
    const { text } = entry;
    if (!q)
        return 0;
    if (text === q)
        return 100;
    if (text.startsWith(q))
        return 90;
    if (text.includes(q))
        return 80;
    const initials = (entry.initials ??= normalizeSearch(hangulInitials(entry.raw)));
    if (initials.startsWith(q))
        return 75;
    if (initials.includes(q))
        return 70;
    if (q.length < 2)
        return -1;
    const tolerance = q.length >= 5 ? 2 : 1;
    let distance = boundedDistance(q, text.slice(0, q.length + 2), tolerance);
    const words = (entry.words ??= [
        ...new Set(entry.raw
            .split(/[\s/·|,()[\]{}_-]+/)
            .filter(Boolean)
            .map(normalizeSearch)),
    ]);
    for (const word of words) {
        distance = Math.min(distance, boundedDistance(q, word, Math.min(distance, tolerance)));
        if (distance === 0)
            break;
    }
    return distance <= tolerance ? 60 - distance * 5 : -1;
}
export function searchScore(query, value) {
    return scorePrepared(normalizeSearch(query), prepare(value));
}
export function rankSearch(query, items, limit = 20) {
    const q = normalizeSearch(query);
    return items
        .map((item, index) => ({
        item,
        index,
        score: scorePrepared(q, prepare(item.searchText)),
    }))
        .filter((x) => x.score >= 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .slice(0, limit)
        .map((x) => x.item);
}
