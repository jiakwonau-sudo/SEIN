# SEIN FULL SYSTEM v1.1.1

Baseline: 미팅 후 받은 Mockup v0.2를 보존하고 WBS 전체 업무 흐름을 브라우저 기능 검증판으로 확장.

## UX
- 찾기 → 열기 → 수정 → 연결 → 저장 → 다음 행동
- 대시보드 6단계 업무 흐름
- 빠른 설비/고객/영업 진입
- 설비·고객·영업·견적·일정 저장 후 다음 행동 제안
- 통합검색
- 자동저장 상태
- 모바일 하단 내비게이션

## Browser-functional scope
- B-001 로그인·4계정·권한
- B-002 상품/설비 CRUD
- B-003 메모·검색·태그
- B-004 폴더형 자료실·파일(IndexedDB, 30MB)
- B-005 고객 CRUD·송신금지
- B-006 영업관리·설비/고객 연결
- B-007 업무 대시보드
- B-008 캘린더 CRUD
- B-009~B-011 회계 UI/수기 편집 흐름
- I-001 Gmail 큐/분할/제외 흐름
- I-002 환율 수동 fallback
- I-003 영상/링크 흐름
- I-004 고객 XLSX/CSV Import
- I-005 Legacy CSV/JSON Pilot
- 백업/복구, 감사 로그

## Production integrations still not connected
- Gmail OAuth 실제 발송
- 하나은행 실시간 환율
- 운영 DB / 서버 인증
- 실제 legacy 500GB 데이터 본 이관

현재 버전은 전체 업무와 UX를 검증하는 browser-functional build이며, 위 외부 연동을 production 완료로 주장하지 않는다.
