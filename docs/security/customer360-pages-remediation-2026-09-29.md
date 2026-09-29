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
