# SEIN Restore

## v1.2.0 immutable source
- Browser snapshot: `site/v1-2-0-full/`
- Source archive: `versions/v1.2.0-full/`

## Restore procedure
1. 원하는 immutable 버전의 전체 파일을 `site/full/`에 복사한다.
2. `src/`에도 동일 소스를 맞춘다.
3. `VERSION`과 `SPEC.md`를 해당 버전 기준으로 되돌린다.
4. GitHub Pages가 `site/`를 배포하도록 유지한다.

## Data
브라우저 데이터 백업은 앱의 운영 도구 > 백업 내보내기에서 JSON으로 저장한다.
v1.2 백업은 Core 데이터와 v1.2 확장 상태를 함께 포함한다.
IndexedDB의 실제 파일 바이트는 브라우저 저장소에 있으므로 운영환경에서는 별도 서버/스토리지 설계가 필요하다.
