# SEIN FULL SYSTEM v1.1

Baseline: 미팅 후 받은 Mockup v0.2를 보존하고 전체 요구사항 기능 레이어를 확장.

## UX v1.1
- 찾기 → 열기 → 수정 → 연결 → 저장 → 다음 행동
- 대시보드 6단계 업무 흐름
- 빠른 설비/고객/영업 진입
- 설비·고객·영업·견적·일정 저장 후 다음 행동 제안
- 통합검색 / 자동저장 상태 / 모바일 하단 내비

## 구현 상태
- B-001~B-011: 브라우저 저장형 기능 구현
- I-001 Gmail: 큐/분할/제외 흐름 구현, 실제 OAuth 전송 미연결
- I-002 환율: 수동 fallback 구현, 실제 하나은행 연동 미연결
- I-003 파일/영상/링크: 구현 범위 내 처리
- I-004 고객 XLSX/CSV Import: 구현
- I-005 Legacy CSV/JSON Pilot: 구현
- 운영 DB: 미연결, localStorage + IndexedDB 검증판
