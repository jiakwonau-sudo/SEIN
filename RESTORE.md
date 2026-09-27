# SEIN Restore — v1.3.0

- Browser immutable snapshot: `site/v1-3-0-full/`
- Full source archive: `versions/v1.3.0-full/`
- Release branch: `release/v1.3.0-full`

Restore by copying the immutable runtime files back to `site/full/` and `src/`, then restoring VERSION/SPEC/README/RESTORE from the archived version.

Browser data backup is exported from 운영 도구. Uploaded file bytes remain in IndexedDB until a production storage layer is connected.
