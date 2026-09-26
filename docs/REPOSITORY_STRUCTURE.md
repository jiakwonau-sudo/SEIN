# Repository Structure

- `baseline/` original kickoff-era mockup, never overwrite
- `src/` current development source
- `versions/v1.0-full/` immutable full recovery snapshot
- `site/` static deployment tree
  - `/original/`
  - `/full/`
  - `/v1-0-full/`
- `SPEC.md` WBS/requirements mapping
- `JQA.md` QA / release gate
- `RESTORE.md` recovery instructions

Rule: a release is not complete unless source snapshot + Drive full package + live immutable URL all exist.