import { krwNet, occurrences } from "./domain.mjs";
export const validEmail = (value) => /^[^\s@;<>]+@[^\s@;<>]+\.[^\s@;<>]+$/.test(String(value || "").trim());
export function seoulDate(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const part = (type) => parts.find((p) => p.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
}
export function eventsOn(events, day = seoulDate()) {
    return events
        .filter((e) => !e.deletedAt)
        .flatMap((e) => occurrences(e, day, day))
        .sort((a, b) => a.start.localeCompare(b.start));
}
export function quoteSummary(quotes, deals) {
    const byDeal = new Map(deals.map((d) => [d.id, d]));
    const latest = new Map();
    for (const q of quotes) {
        if (byDeal.get(q.dealId)?.status !== "진행중")
            continue;
        const old = latest.get(q.dealId);
        if (!old ||
            Number(q.revision) > Number(old.revision) ||
            (Number(q.revision) === Number(old.revision) &&
                q.createdAt > old.createdAt))
            latest.set(q.dealId, q);
    }
    const expected = [...latest.values()];
    const sum = (values) => values.reduce((a, q) => a +
        q.lines.reduce((b, l) => b + krwNet(l.amount, q.currency, q.vat, q.taxRate, q.fx), 0), 0);
    return {
        expected,
        expectedAmount: sum(expected),
        expectedDeals: expected.length,
    };
}
