# SEIN FULL SYSTEM v1.4.0

Baseline: Mockup v0.2 + v1.3.0 기능 완성본.

## Requested changes
- "업무를 끊기지 않게 이어갑니다" 섹션 접기/펼치기
- 접힘 상태 localStorage 기억
- 실제 시장환율 스냅샷 표시
  - USD/KRW 1,357.75
  - JPY/KRW 8.61248
  - 100 JPY/KRW 861.248
  - 기준 2026-09-28 09:08 KST
- 환율 Mock/Fallback 조작과 충돌하지 않도록 실환율 스냅샷은 세션 시작 시 1회 적용

## UX 10 iterations
1. 모바일 더보기 바텀시트
2. Ctrl/Cmd+K 검색, Esc 닫기
3. 대시보드 오늘 할 일
4. 필터/회계/캘린더 작업맥락 기억
5. 표 가로 스크롤 힌트와 포커스
6. 필수값 인라인 검증/저장 활성 조건
7. aria-live/focus ring/reduced-motion
8. 검색 결과 건수/0건 회복 액션
9. 모달 focus trap 및 긴 폼 ergonomics
10. 카테고리/페이지/계정 컨텍스트 바

## Functional scope
v1.3.0의 B-001~B-011, I-001~I-005 browser-functional 범위를 유지한다.
Gmail, Hana FX simulation, Supabase DB는 실제 전송/서버 연결이 아닌 Mock Adapter다.
시장환율은 실제 확인된 시점의 스냅샷이며 실시간 API 연동이라고 표시하지 않는다.

## Storage
- Core/UX state: localStorage/sessionStorage
- browser file bytes: IndexedDB
- deployment: GitHub Pages
