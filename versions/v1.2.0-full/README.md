# SEIN — 세인코퍼레이션 통합 관리 시스템

세인코퍼레이션 백오피스 프로젝트의 단일 기준 저장소.

## Current
- Current FULL: `site/full/`
- Current version: `v1.2.0-full`
- Immutable snapshot: `site/v1-2-0-full/`
- Baseline: `baseline/mockup-v0.2-after-kickoff.html`

## v1.2.0
WBS Build/Integration 요구사항을 browser-functional 수준으로 메웠다.
실제 외부 서비스 연결은 사용자 지시에 따라 Mock Adapter로 구현한다.

주요 보강:
- 회계 3종 고도화
- 폴더형 자료실/권한
- 견적 메모
- 메모 수정권한
- 영상/링크 등록
- Excel Import 매핑/검증/오류리포트
- Legacy migration pilot
- Gmail/FX/DB Mock Adapter
- 확장 백업/복구
- Premium CSS

## Version rule
1. 과거 `site/v*-full/` 경로는 덮어쓰지 않는다.
2. `site/full/`만 현재 개발본을 가리킨다.
3. 각 릴리스는 `versions/<version>/`에도 전체 소스를 보존한다.
