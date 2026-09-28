# SEIN FULL SYSTEM v1.4.3

## Freeze fix
v1.4.2의 접기/펼치기 UI에서 MutationObserver가 자신의 DOM 변경을 다시 감지해 enhance 루프를 반복할 수 있는 문제를 수정했다.

### 수정
- collapse button text/aria 동기화를 idempotent 처리
- collapse observer requestAnimationFrame queue guard
- UX v1.4 global observer queue guard
- flow button 동기화를 idempotent 처리
- FX card 재작성 1회 제한
- context bar 삭제/재생성 제거, signature 기반 갱신
- cache-bust asset filename 사용

## Collapse behavior
- 업무 흐름: 헤더만 남기고 본문 숨김
- 오늘 할 일: 제목 행만 유지
- 핵심 지표: 독립 접기/펼치기
- 대시보드 카드: 독립 접기/펼치기
- 대시보드 전체: 페이지 헤더만 유지
- localStorage에 상태 저장

## Functional scope
v1.4.2의 WBS Build/Integration 기능과 디자인 범위를 그대로 유지한다.
