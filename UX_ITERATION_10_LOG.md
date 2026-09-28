# SEIN v1.4.0 — UX 10 Iteration Log

## Pre-work
- Added collapsible "업무를 끊기지 않게 이어갑니다" section.
- Collapse state is remembered in localStorage.
- Added verified market FX snapshot:
  - USD/KRW 1357.75
  - JPY/KRW 8.61248
  - 100 JPY/KRW 861.248
  - Timestamp 2026-09-28 09:08 KST
- Snapshot is applied once per browser session so FX Mock/Fallback simulation remains usable.

## UX iterations
1. Mobile More sheet for Quote / Files / Calendar / Accounting / Ops.
2. Ctrl/Cmd+K global search and Escape dismissal.
3. Actionable Today panel from open deals, send-blocked customers, upcoming 7-day events.
4. Persist goods view/filter, accounting tab/year, calendar month.
5. Horizontal table overflow cue and keyboard-focusable table regions.
6. Required-field markers, inline invalid state, save enable rules.
7. aria-live status feedback, visible focus rings, reduced-motion.
8. Result counts, no-result guidance, reset-stage recovery.
9. Modal autofocus, Tab focus trap, sticky header/footer, destructive action separation.
10. Context bar for category/page/user orientation.

## Validation policy
- JQA intentionally not used.
- Static JavaScript syntax and required-feature markers.
- GitHub Pages deploy status.
- HTTP 200 verification for current and immutable URLs.
