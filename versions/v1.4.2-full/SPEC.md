# SEIN FULL SYSTEM v1.4.2

## Collapse behavior
- 업무 흐름: 접으면 헤더 한 줄만 남고 단계/빠른 실행은 완전히 숨김.
- 오늘 할 일: 접으면 제목 행만 남김.
- 대시보드 전체: 접으면 페이지 헤더만 남김.
- 대시보드 하위: 핵심 지표, 영업 현황, 매입 진행, 설비 상태 분포, 환율 섹션을 각각 독립적으로 접을 수 있음.
- 접힘 상태는 localStorage에 기억.

## Exchange rate display
대시보드 본체가 환율을 직접 렌더한다.
- USD/KRW
- 100 JPY/KRW
- source / updatedAt
후처리 스크립트에만 의존하지 않는다.

## Functional scope
v1.4.1의 WBS Build/Integration 기능과 권한/회계/Import/Legacy/Mock Adapter 범위를 그대로 유지한다.

## Design
- Pretendard Variable
- warm neutral + mint/teal
- true accordion collapse with minimal header trace
