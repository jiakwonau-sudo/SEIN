# RESTORE
1. `index.html`, `app.full.css`, `app.full.js`를 동일 폴더에 둔다.
2. 정적 웹서버로 해당 폴더를 서비스한다.
3. 로그인 PIN은 검증판 기준 1234.
4. 브라우저 데이터는 localStorage(`sein.full.v1.data`)와 IndexedDB(`sein-full-files`)에 저장된다.
5. 운영 DB로 전환할 때 UI를 교체하지 않고 저장 어댑터만 교체한다.
6. 운영 전에는 인증, Gmail OAuth, 환율 공급원, DB 백업 정책을 별도 확정해야 한다.