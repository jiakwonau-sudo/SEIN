# Customer 360 Pages Remediation — 2026-09-29

## Decision
Customer 360 now uses **administrator local file import + browser-local storage**. No real customer snapshot is required or permitted in the public GitHub Pages artifact.

## Security changes
- Removed the tracked Customer 360 snapshot directory from the current public tree.
- Removed automatic network loading of `/full/data/customer360/*` from the Customer 360 browser layer.
- Added a defense-in-depth Pages build step that removes the restricted directory before artifact upload and fails if customer/memo payload filenames remain.
- Added `.gitignore` protection for the local-only snapshot directory.
- Preserved the existing administrator JSON/GZIP import path and existing browser-local persistence.
- Added a synthetic-only smoke test. No customer source text or secrets are emitted by the test.

## Branch validation
- Customer layer contains no `fetch()` call and no bundled-data loader markers: **PASS**
- Administrator local import control remains available: **PASS**
- Synthetic payload mapping (1 customer / 1 memo) executes successfully: **PASS**
- Browser-local persistence hook remains present in the existing app state layer: **PASS**
- Public source tree after this commit contains no tracked `site/full/data/customer360/` files: validated by tree check after commit.

## Production validation
After merge to `main`, `.github/workflows/verify-pages.yml` verifies that:
- `/full/data/customer360/manifest.json` returns HTTP 404.
- `/full/data/customer360/customers-001.json` returns HTTP 404.
- The verification result is recorded in `.github/pages-status.md`.

## Residual risk
Because the repository is public, deleting the files from the current tree does **not** purge copies from historical commits. A separate history rewrite / exposure-response decision is required if historical Git object access must also be eliminated.


## Legacy browser-state remediation
A follow-up P1 review identified that browsers which loaded the retired public snapshot could retain that customer state in localStorage/IndexedDB after the server-side payload was removed.

The remediation now loads `customer360-migration.v1.5.1.js` **before** `app.full.js` hydration:
- If the legacy auto-seed marker exists and there is no later administrator import in the audit trail, stored customer state is cleared and the Customer 360 memo IndexedDB is deleted.
- If audit evidence shows a later administrator import, that administrator-imported state is preserved and only the retired legacy marker is removed.
- Browsers without the legacy marker are untouched.
- Tests use synthetic records only.


## Legacy remediation v1.5.2
Follow-up review hardened the browser cleanup further:
- Treats later `CUSTOMER_CREATE`, `CUSTOMER_UPDATE`, `CUSTOMER_DELETE`, `CUSTOMER_BLOCK_TOGGLE`, `CUSTOMER_IMPORT`, and `CUSTOMER360_IMPORT` audit events as evidence of legitimate post-seed work. In that case the browser-local customer state is preserved to avoid destructive data loss.
- The legacy seed marker is removed only after IndexedDB deletion reports success.
- A blocked or failed IndexedDB deletion keeps the seed marker so the next load retries, and Customer 360 memo reads/imports fail closed until cleanup is safe.
- The migration promise is consumed by the Customer 360 memo DB adapter, preventing a race with the asynchronous IndexedDB deletion.
- Tests remain synthetic-only and now cover post-seed CRUD/import preservation plus blocked/error deletion retries.

### Privacy trade-off
If a browser contains both the retired seed and documented later customer work, the full local browser state is preserved because this legacy format has no reliable per-record provenance. The server/public Pages exposure remains blocked; this preservation rule avoids silently deleting legitimate user work.
