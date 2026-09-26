# SEIN — 세인코퍼레이션 통합 관리 시스템

이 저장소는 세인코퍼레이션 백오피스 프로젝트의 단일 기준 저장소입니다.

## 기준
- `baseline/mockup-v0.2-after-kickoff.html` — 2026-09-17 킥오프 후 전달 목업을 기준선으로 보존
- `index.html`, `app.full.css`, `app.full.js` — 현재 FULL SYSTEM 개발본
- `versions/v1.0-full/` — v1.0 불변 스냅샷
- `SPEC.md` — WBS/요구사항 매핑
- `JQA.md` — QA 및 Release Gate
- `RESTORE.md` — 100% 복구 절차

## 버전 원칙
1. 각 릴리스는 `versions/<version>/`에 완전 복구 가능한 전체 소스를 보존합니다.
2. 과거 버전은 덮어쓰지 않습니다.
3. 배포 전 JQA/회귀 검수를 통과해야 합니다.
4. Drive FULL ZIP + GitHub snapshot + 실행 URL 세 가지를 한 세트로 봅니다.
