# Microsoft 365 상품 메일 연결

작성일: 2026-09-19. 시스템 발송 코드는 구현되어 있으나 회사 Microsoft 365 인증정보가 없어 실제 계정 연결·수신 검수는 아직 수행하지 않았다. 검토용 로컬 모드는 설정값이 있어도 고객 메일을 보내지 않는다.

## 현재 사용할 수 있는 기능

- 상품의 모델명·관리번호·공개용 사양·대표 사진을 선택한다. 매입가·판매가·내부 메모는 자동 문안에 포함하지 않는다.
- 한국어·영어·일본어·중국어 간체 템플릿을 선택하고 제목·본문을 수정한다. 공개용 사양의 자동 번역은 제공하지 않는다.
- 수신자 중복·잘못된 주소·송신금지 고객을 제외한 결과를 확인한다. 실제 유효 수신자는 1~999명이다.
- 발신 주소는 `info@seinmachinery.com`을 포함해 관리자가 허용한 공용 사서함 중 선택한다. 고객은 국가·고객 그룹·수신 가능 상태로 좁혀 선택할 수 있다.
- 주소·제목·본문을 따로 복사하거나 사진·첨부가 포함된 `.eml`을 다운로드한다. 복사한 주소는 Outlook의 **숨은 참조(Bcc)** 에 붙여 넣는다. 텍스트 복사에는 사진·첨부가 따라가지 않는다.
- `.eml`의 작성 화면 열기·수정·첨부 표시는 Outlook 버전에 따라 달라 실제 사내 버전 검수가 필요하다. 지원하지 않는 버전은 텍스트 복사 후 사진·파일을 직접 첨부한다.

## 비용과 발송 범위

Graph의 일반 API는 기존 사용자 라이선스 범위에 포함되는 방식이다. 이번 구현은 별도 유료 발송 업체를 추가하지 않는다. 다만 회사의 실제 Microsoft 365 라이선스·공용 사서함 상태·서버 호스팅 비용까지 무료로 확정한 것은 아니다. [Microsoft Graph 과금 개요](https://learn.microsoft.com/en-us/graph/metered-api-overview)

Exchange Online은 메시지/수신자/테넌트 외부 수신자 제한과 스팸 정책을 적용한다. 앱은 수신자당 별도 메일, 기본 3초 간격(분당 최대 20회), 최근 24시간 최대 999명의 처리 제한을 둔다. 실제 회사 정책이 더 엄격하면 그 제한을 따른다. 반복적인 대량 상업 발송에 적합한지 관리자가 확인해야 한다. [Exchange Online 제한](https://learn.microsoft.com/en-us/office365/servicedescriptions/exchange-online-service-description/exchange-online-limits)

## 관리자 연결 순서

1. Microsoft Entra에 회사 단일 테넌트 앱을 등록한다. Tenant ID, Client ID, 서버용 Client Secret을 준비한다. 비밀값은 서버의 환경변수/비밀 저장소에 직접 등록하고 문서·저장소·브라우저 변수에 넣지 않는다.
2. Exchange Online **RBAC for Applications**로 지정한 공통 사서함만 접근 가능한 리소스 범위를 만든다. `Application Mail.Send`와 `Application Mail.ReadWrite` 역할이 필요하다. 후자는 임시 메일 생성과 첨부 업로드에 사용한다.
3. Exchange의 서비스 주체 연결에는 Enterprise applications의 **서비스 주체 Object ID**를 사용한다. App registrations의 Object ID와 혼동하지 않는다. `New-ServicePrincipal`, `New-ManagementScope`, `New-ManagementRoleAssignment`로 구성하며, 실제 회사 사서함에 맞춘 명령은 관리자가 확정한다.
4. `Test-ServicePrincipalAuthorization -Identity <서비스 주체 ID> -Resource <공통 사서함>`으로 허용을 확인하고 다른 직원 사서함은 범위 밖인지 확인한다. 이 검사는 별도로 부여된 Entra 권한을 검사하지 않으므로, 범위 없는 Entra Mail.Send/Mail.ReadWrite 권한이 함께 남아 전체 사서함으로 권한이 넓어지지 않도록 확인한다.
5. 아래 환경변수를 서버에 설정한다. 연결 검수가 끝나기 전까지 `MS_MAIL_ENABLED=false`를 유지한다.

```dotenv
MS_TENANT_ID=<회사 테넌트 ID>
MS_CLIENT_ID=<앱 Client ID>
MS_CLIENT_SECRET=<서버 비밀 저장소에만 등록>
MS_MAIL_SENDER=<기본 공통 사서함 주소>
MS_MAIL_SENDERS=info@seinmachinery.com,<추가 공통 사서함 주소>
MS_MAIL_ENABLED=false
MS_MAIL_INTERVAL_MS=3000
MS_MAX_MESSAGE_BYTES=20000000
```

`MS_MAIL_SENDERS`에 추가한 모든 주소는 2~4단계에서 동일하게 Exchange RBAC 허용 범위와 발송 권한을 확인해야 한다. 화면에 보이는 주소라고 해서 Microsoft 365 권한이 자동으로 생기지는 않는다.

RBAC는 기존 Application Access Policy를 대체하는 현행 방식이다. 권한 전파에는 시간이 걸릴 수 있다. [Microsoft 공식 구성 문서](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac), [앱 전용 인증](https://learn.microsoft.com/en-us/graph/auth-v2-service)

6. 운영 모드(`APP_MODE=supabase`)에서 계속 실행되는 Node 서버 **1개**를 사용한다. 브라우저를 닫아도 서버가 발송 대기열을 처리한다. 요청이 있을 때만 켜지는 서버리스 배포에는 별도 상시 워커가 필요하다.
7. 대표가 `계정 및 설정 → 권한`에서 필요한 직원에게 상품 메일 조회·작성 및 **발송** 권한을 부여한다. 기존 계정에는 새 메뉴 권한이 자동 부여되지 않는다. 발송 권한은 일반 작성 권한과 별도다.
8. 담당자가 지정한 내부 테스트 수신자로 실제 연결 검수를 할 때만 `MS_MAIL_ENABLED=true`로 바꾸고 서버를 재시작한다. 고객 명단의 전체 발송을 연결 시험에 사용하지 않는다.

## 운영 전 수신 검수

- 네 언어 제목·본문, 한글 파일명, 공개용 사양, 가격 자동 삽입 제외 확인.
- 한 사람씩 받는 메일이며 다른 고객 주소가 노출되지 않는지 확인.
- 사진과 소형 첨부, 3MB 이상 첨부의 수신 확인. 앱 제한은 첨부 5개·원본 사진 포함 총 10MB다. Microsoft 공용/위임 사서함에는 대용량 첨부 관련 알려진 문제가 있으므로 실제 사서함 검수가 필요하다. [첨부 업로드 문서](https://learn.microsoft.com/en-us/graph/outlook-large-attachments)
- 보낸 편지함·반송·스팸함 및 실제 회사 제한을 확인. 앱의 **Microsoft 접수** 상태는 최종 배달·열람 확인을 뜻하지 않는다.
- 대기 취소, 발송 권한 철회, 서버 재시작 후 이미 처리한 수신자 중복 발송 방지 확인.

발송 응답이 불명확하거나 서버가 처리 도중 중단된 건은 자동 재전송하지 않고 `확인 필요`로 남긴다. Outlook 보낸 편지함/메시지 추적으로 먼저 확인한다. 취소 시 대기 중인 수신자 처리는 중지하지만 이미 전송 요청 중인 한 건은 완료될 수 있다. 비밀번호 잠금 자료는 장시간 발송 작업에서 자동 해제하지 않으므로 발송 직전 재검사에서 제외될 수 있다.
