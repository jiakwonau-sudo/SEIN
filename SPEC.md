# SEIN FULL SYSTEM v1.3.0

Baseline: 킥오프 후 Mockup v0.2.

## Validation model
사용자 지시에 따라 JQA는 사용하지 않는다.
WBS Definition of Done을 기준으로 10회 반복 검증/수정을 수행했다.

## WBS Build / Integration
- B-001: 4계정, 대표자 전용, 카테고리 권한
- B-002: 설비 CRUD, 핵심필드, 메모, 파일, 단계태그, 필터
- B-003: 검색, 태그, 메모 작성자/대표자 수정권한
- B-004: 폴더형 자료실, 30MB 파일, 업/다운로드, 상속 권한
- B-005: 고객 CRUD, 검색, 메모, 송신금지
- B-006: 고객+복수설비, 공유메모, 예정/확정 금액, 중복 설비 방지
- B-007: 현재 카테고리 기준 매입/판매예정/판매확정 KPI
- B-008: 캘린더 CRUD, 월 이동, 날짜 기반 이동
- B-009: Ledger CRUD, 연쇄 잔액 재계산, 첨부, 감사필드
- B-010: 일별 회계 CRUD, 손익 계산
- B-011: Jan-Dec+Total, 항목관리, 연도 추가/누적 조회
- I-001: Gmail Mock Adapter, 송신금지 제외, 배치, 실패/재시도
- I-002: Hana FX Mock Adapter, 동기화, 장애 fallback
- I-003: YouTube URL 검증, 30MB 이하 직접 영상
- I-004: Excel/CSV 컬럼 매핑, 필수값/이메일/중복 검증, 오류 CSV, 정상행 적용
- I-005: Legacy manifest MIGRATED/DUPLICATE/ERROR, 위험경로 차단, 폴더 경로 보존, 결과 CSV

## Additional agreed scope
- 견적 메모
- Browser Back
- 백업/복구
- 감사 로그
- Premium + crisp Pretendard UI
- 모바일 하단 navigation

## External service policy
실제 Gmail OAuth, 하나은행 API, Supabase/운영 DB 연결은 사용자 지시에 따라 하지 않는다.
해당 영역은 Mock Adapter로 시연한다.

## Storage truth
- Core/extension state: localStorage
- actual browser file bytes: IndexedDB
- deployment: GitHub Pages static frontend
- production server security / real external transmission is not claimed.
