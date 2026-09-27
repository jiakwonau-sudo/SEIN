# SEIN FULL SYSTEM v1.2.0

Baseline: 킥오프 후 Mockup v0.2를 보존하고 WBS의 Build/Integration 요구사항을 browser-functional 수준으로 고도화한다.

## UX / Design
- 찾기 → 열기 → 수정 → 연결 → 저장 → 다음 행동 흐름 유지
- Premium visual system: warm neutral surface + mint/teal accent, larger spacing, refined table/form/modal/card states
- 통합검색, 자동저장 상태, 모바일 하단 내비게이션 유지

## 구현 범위
- B-001 로그인·4계정·대표자/카테고리 권한
- B-002 상품/설비 CRUD, 단계, 메모, 사진/파일, 영상 URL/30MB 직접 영상
- B-003 메모·검색·태그 + 메모 작성자/대표자 수정권한
- B-004 폴더형 자료실, 실제 폴더 생성/삭제, 공용/대표자 전용 권한, 업/다운로드
- B-005 고객 CRUD·검색·메모·송신금지
- B-006 영업관리, 고객+복수설비, 공유메모, 예정/확정 금액
- B-007 업무 대시보드
- B-008 캘린더 CRUD
- B-009 금전출납부: 정규화 필드, 합계, 첨부, 감사필드, 행 추가/삭제
- B-010 일별 회계: 수기 CRUD, 일별 손익 계산
- B-011 월별 손익: Jan-Dec+Total, 항목 추가/삭제, 연도 누적
- I-001 Gmail: Mock Adapter로 연결/배치/실패/재시도 흐름
- I-002 환율: Hana FX Mock Adapter + 장애 fallback 흐름
- I-003 영상/링크: YouTube URL + 30MB 이하 직접 영상
- I-004 고객 XLSX/CSV Import: 컬럼 매핑, 검증, 중복 제거, 오류 CSV, 정상행 적용
- I-005 Legacy Pilot: manifest 기반 이관/중복/오류 분류, 결과 CSV, 자료실 placeholder 이관
- 운영 DB: Supabase Mock Adapter
- Core + v1.2 확장 데이터 JSON 백업/복구
- 감사 로그

## External service policy
사용자 지시에 따라 실제 외부 서비스 연결은 이번 버전에서 하지 않는다.
Gmail, 하나은행 환율, Supabase/운영 DB 등은 UI와 상태 전이를 검증하는 Mock Adapter다.

## 데이터 저장
- Core: localStorage
- v1.2 확장 상태: localStorage
- 실제 업로드 파일: IndexedDB
- GitHub Pages는 정적 프론트엔드 배포다.

## Scope truth
v1.2.0은 고객 시연·기능 검증을 위한 고도화된 FULL prototype이다.
실제 외부 인증·서버 보안·실서비스 데이터 전송을 완료했다고 주장하지 않는다.
