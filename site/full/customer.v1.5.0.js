/* SEIN customer benchmark layer v1.5.0
 * Benchmarked from sein-source-customers-2026-09-28.
 * Customer data snapshot from sein-source-customers-2026-09-28 is bundled with this deployed version.
 */
(function(){
'use strict';
const VERSION='1.5.0';
const PAGE_SIZE=30;
const MEMO_DB='sein-customer360';
const MEMO_STORE='customer-memos';
const UI_KEY='sein.customer360.ui.v1';
const DATA_ROOT='./data/customer360';
const DATA_SEED_KEY='sein.customer360.seed.2026-09-28';
const DEFAULT_COLUMNS=['importance','group','department','phone','email','interest','date','receive','memo'];
const COLS={
  importance:'중요도',group:'그룹 / 고객 구분',department:'부서 / 직함',phone:'전화번호',email:'이메일',interest:'주요 취급품목',date:'등록일',receive:'수신 여부',memo:'메모'
};
let ui=loadUi();
let selected=new Set();

function api(){return window.SEIN_INTERNAL||{}}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim())}
function text(v){return String(v??'').trim()}
function loadUi(){try{return Object.assign({q:'',country:'',group:'',status:'',email:'',origin:'',page:1,sort:'date',dir:'desc',columns:[...DEFAULT_COLUMNS]},JSON.parse(localStorage.getItem(UI_KEY)||'{}'))}catch{return {q:'',country:'',group:'',status:'',email:'',origin:'',page:1,sort:'date',dir:'desc',columns:[...DEFAULT_COLUMNS]}}}
function saveUi(){try{localStorage.setItem(UI_KEY,JSON.stringify(ui))}catch{}}
function initials(s){
  const lead=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  return String(s||'').split('').map(ch=>{const n=ch.charCodeAt(0)-0xAC00;return n>=0&&n<11172?lead[Math.floor(n/588)]:ch}).join('');
}
function searchable(c){
  const contacts=Array.isArray(c.contacts)?c.contacts:[];
  return [c.co,c.p,c.d,c.t,c.tel,c.mail,c.country,c.group,c.kind,c.productInterest,c.interestClass,c.interestSubclass,c.memo,c.legacySourceId,...contacts.flatMap(p=>[p.name,p.department,p.position,p.phone,p.email])].join(' ').toLowerCase();
}
function matchQuery(c,q){if(!q)return true;const hay=searchable(c);const n=q.toLowerCase().replace(/\s+/g,'');return hay.includes(q.toLowerCase())||initials(hay).replace(/\s+/g,'').includes(n)}
function memoCount(c){const n=Number(c.memoCount||0);return n||(c.memo?1:0)}
function customerStatus(c){if(c.flag==='block'||c.blocked)return 'blocked';if(!validEmail(c.mail))return 'nomail';return 'available'}
function allCountries(){return [...new Set(CUSTOMERS.map(c=>text(c.country)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'))}
function allGroups(){return [...new Set(CUSTOMERS.map(c=>text(c.group)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'))}
function stats(){return {total:CUSTOMERS.length,legacy:CUSTOMERS.filter(c=>c.legacySourceId).length,email:CUSTOMERS.filter(c=>validEmail(c.mail)).length,available:CUSTOMERS.filter(c=>customerStatus(c)==='available').length,blocked:CUSTOMERS.filter(c=>customerStatus(c)==='blocked').length,groups:allGroups().length}}
function filtered(){
  let rows=CUSTOMERS.filter(c=>matchQuery(c,ui.q));
  if(ui.country)rows=rows.filter(c=>text(c.country)===ui.country);
  if(ui.group)rows=rows.filter(c=>text(c.group)===ui.group);
  if(ui.status)rows=rows.filter(c=>customerStatus(c)===ui.status);
  if(ui.email==='with')rows=rows.filter(c=>validEmail(c.mail));
  if(ui.email==='without')rows=rows.filter(c=>!validEmail(c.mail));
  if(ui.origin==='legacy')rows=rows.filter(c=>!!c.legacySourceId);
  if(ui.origin==='manual')rows=rows.filter(c=>!c.legacySourceId);
  const mult=ui.dir==='asc'?1:-1;
  rows.sort((a,b)=>{
    const av=sortVal(a,ui.sort),bv=sortVal(b,ui.sort);
    if(typeof av==='number'&&typeof bv==='number')return (av-bv)*mult;
    return String(av??'').localeCompare(String(bv??''),'ko',{numeric:true,sensitivity:'base'})*mult;
  });
  return rows;
}
function sortVal(c,key){
  const map={company:c.co,person:c.p,country:c.country,importance:Number(c.importance||0),group:`${c.group||''} ${c.kind||''}`,department:`${c.d||''} ${c.t||''}`,phone:c.tel,email:c.mail,interest:`${c.interestClass||''} ${c.interestSubclass||''} ${c.productInterest||''}`,date:c.registeredOn||'',receive:customerStatus(c)==='available'?1:0,memo:memoCount(c)};
  return map[key]??'';
}
function sortTh(key,label){const on=ui.sort===key;return `<th><button class="c360-sort" data-sort="${key}">${esc(label)} ${on?(ui.dir==='asc'?'↑':'↓'):''}</button></th>`}
function visible(key){return ui.columns.includes(key)}
function badgeStatus(c){const s=customerStatus(c);return s==='blocked'?'<span class="badge b-red">송신 금지</span>':s==='nomail'?'<span class="badge b-gray">이메일 없음</span>':'<span class="badge b-green">송신 가능</span>'}
function interest(c){return [c.interestClass,c.interestSubclass,c.productInterest].filter(Boolean).join(' · ')||'—'}
function richLabel(c){const extras=Math.max(0,(c.contacts?.length||1)-1);return `${esc(c.p||'—')}${extras?` <span class="c360-more">+${extras}</span>`:''}`}

window.pageCustomer=function(){
  const s=stats(),rows=filtered();
  const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE)); if(ui.page>pages)ui.page=pages;
  const slice=rows.slice((ui.page-1)*PAGE_SIZE,ui.page*PAGE_SIZE);
  const countries=allCountries(),groups=allGroups();
  const isAdmin=api().getCurrentUser?.()?.role==='admin';
  return `<div class="page-head c360-head"><div><h1 class="page-title">고객 관리 <span class="full-chip">Customer 360 · v${VERSION}</span></h1><div class="page-sub">첨부 소스의 고객관리 구조를 벤치마킹한 확장판 · 복수 담당자 · 그룹 · 중요도 · 관심 품목 · 메모 이력</div></div><div class="actions"><button class="btn" id="bulkMail">선택 메일 큐</button><button class="btn" id="copyInfo" ${selected.size?'':'disabled'}>선택 이메일 복사 ${selected.size?`(${selected.size})`:''}</button>${isAdmin?'<button class="btn" id="c360Import">원본 고객 데이터 가져오기</button>':''}<button class="btn primary" id="newCustomer">＋ 고객사 등록</button></div></div>
  <div class="c360-stats">
    <button data-quick="all" class="${!ui.origin&&!ui.status&&!ui.email?'on':''}"><b>${s.total.toLocaleString()}</b><span>전체</span></button>
    <button data-quick="legacy" class="${ui.origin==='legacy'?'on':''}"><b>${s.legacy.toLocaleString()}</b><span>구버전 이관</span></button>
    <button data-quick="email" class="${ui.email==='with'?'on':''}"><b>${s.email.toLocaleString()}</b><span>이메일 등록</span></button>
    <button data-quick="available" class="${ui.status==='available'?'on':''}"><b>${s.available.toLocaleString()}</b><span>송신 가능</span></button>
    <button data-quick="blocked" class="${ui.status==='blocked'?'on':''}"><b>${s.blocked.toLocaleString()}</b><span>송신 금지</span></button>
    <button data-quick="groups"><b>${s.groups.toLocaleString()}</b><span>고객 그룹</span></button>
  </div>
  <div class="filters c360-filters">
    <div class="field c360-search"><span class="ic">⌕</span><input id="customer360Search" value="${esc(ui.q)}" placeholder="회사·담당자·국가·취급품목·메모 검색 (초성 지원)"></div>
    <div class="field"><select id="c360Country"><option value="">전체 국가</option>${countries.map(x=>`<option ${ui.country===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
    <div class="field"><select id="c360Group"><option value="">전체 그룹</option>${groups.map(x=>`<option ${ui.group===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
    <div class="field"><select id="c360Status"><option value="">전체 수신상태</option><option value="available" ${ui.status==='available'?'selected':''}>송신 가능</option><option value="blocked" ${ui.status==='blocked'?'selected':''}>송신 금지</option><option value="nomail" ${ui.status==='nomail'?'selected':''}>이메일 없음</option></select></div>
    <details class="c360-cols"><summary>열 설정</summary><div>${Object.entries(COLS).map(([k,l])=>`<label><input type="checkbox" data-col="${k}" ${visible(k)?'checked':''}>${esc(l)}</label>`).join('')}<button type="button" id="c360ColsReset">기본값</button></div></details>
  </div>
  <div class="card c360-card"><div class="tbl-wrap"><table class="tbl c360-table"><thead><tr><th class="checkbox-cell"><input type="checkbox" id="chkAll" aria-label="현재 페이지 전체 선택"></th>${sortTh('company','회사명')}${sortTh('person','담당자명')}${sortTh('country','국가')}${visible('importance')?sortTh('importance','중요도'):''}${visible('group')?sortTh('group','그룹 / 구분'):''}${visible('department')?sortTh('department','부서 / 직함'):''}${visible('phone')?sortTh('phone','전화번호'):''}${visible('email')?sortTh('email','이메일'):''}${visible('interest')?sortTh('interest','주요 취급품목'):''}${visible('date')?sortTh('date','등록일'):''}${visible('receive')?sortTh('receive','수신 여부'):''}${visible('memo')?sortTh('memo','메모'):''}</tr></thead><tbody>${slice.length?slice.map(c=>rowHtml(c)).join(''):`<tr><td colspan="14" class="c360-empty">조건에 맞는 고객이 없습니다.</td></tr>`}</tbody></table></div></div>
  <div class="c360-foot"><span>검색 결과 <b>${rows.length.toLocaleString()}</b>개 · 페이지 ${ui.page}/${pages}</span><div><button class="btn xs" id="c360Prev" ${ui.page<=1?'disabled':''}>이전</button><button class="btn xs" id="c360Next" ${ui.page>=pages?'disabled':''}>다음</button></div></div>
  <div class="c360-privacy">첨부 원본 고객 데이터 스냅샷이 이 버전에 포함되어 자동 로드됩니다 · 고객 1,753건 · 메모 3,075건.</div>`;
};

function rowHtml(c){
  const i=CUSTOMERS.indexOf(c),importance='★'.repeat(Math.max(0,Math.min(3,Number(c.importance||0))))||'—';
  return `<tr data-c360-id="${esc(c.id)}" data-i="${i}" class="${customerStatus(c)==='blocked'?'row-red':''}"><td class="checkbox-cell"><input type="checkbox" class="cchk" data-i="${i}" data-id="${esc(c.id)}" ${selected.has(c.id)?'checked':''}></td><td class="strong c360-company">${esc(c.co||'—')}</td><td>${richLabel(c)}</td><td>${esc(c.country||'—')}</td>${visible('importance')?`<td class="c360-stars">${importance}</td>`:''}${visible('group')?`<td>${esc(c.group||'—')}<small>${c.kind?` · ${esc(c.kind)}`:''}</small></td>`:''}${visible('department')?`<td>${esc(c.d||'—')}<small>${c.t?` · ${esc(c.t)}`:''}</small></td>`:''}${visible('phone')?`<td class="nowrap">${esc(c.tel||'—')}</td>`:''}${visible('email')?`<td>${c.mail?`<span class="c360-email">${esc(c.mail)}</span>`:'<span class="muted">—</span>'}</td>`:''}${visible('interest')?`<td class="c360-interest">${esc(interest(c))}</td>`:''}${visible('date')?`<td class="nowrap">${esc(c.registeredOn||'—')}</td>`:''}${visible('receive')?`<td>${badgeStatus(c)}</td>`:''}${visible('memo')?`<td><button class="c360-memo" data-open-customer="${esc(c.id)}">${memoCount(c).toLocaleString()}건</button></td>`:''}</tr>`;
}

window.bindCustomer=function(){
  const rerender=()=>{saveUi();api().render?.()};
  const q=document.querySelector('#customer360Search'); if(q){q.oninput=e=>{ui.q=e.target.value;ui.page=1;saveUi();clearTimeout(q._t);q._t=setTimeout(()=>api().render?.(),180)}}
  for(const [id,key] of [['#c360Country','country'],['#c360Group','group'],['#c360Status','status']]){const el=document.querySelector(id);if(el)el.onchange=e=>{ui[key]=e.target.value;ui.page=1;rerender()}}
  document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{const k=b.dataset.quick;if(k==='all'){ui.origin='';ui.status='';ui.email=''}if(k==='legacy')ui.origin=ui.origin==='legacy'?'':'legacy';if(k==='email')ui.email=ui.email==='with'?'':'with';if(k==='available')ui.status=ui.status==='available'?'':'available';if(k==='blocked')ui.status=ui.status==='blocked'?'':'blocked';if(k==='groups'){ui.group='';document.querySelector('#c360Group')?.focus()}ui.page=1;rerender()});
  document.querySelectorAll('.c360-sort').forEach(b=>b.onclick=()=>{const k=b.dataset.sort;if(ui.sort===k)ui.dir=ui.dir==='asc'?'desc':'asc';else{ui.sort=k;ui.dir=['date','importance','memo','receive'].includes(k)?'desc':'asc'}rerender()});
  document.querySelectorAll('[data-col]').forEach(c=>c.onchange=()=>{ui.columns=[...document.querySelectorAll('[data-col]:checked')].map(x=>x.dataset.col);saveUi();api().render?.()});
  const reset=document.querySelector('#c360ColsReset');if(reset)reset.onclick=()=>{ui.columns=[...DEFAULT_COLUMNS];rerender()};
  const prev=document.querySelector('#c360Prev'),next=document.querySelector('#c360Next');if(prev)prev.onclick=()=>{ui.page=Math.max(1,ui.page-1);rerender()};if(next)next.onclick=()=>{ui.page++;rerender()};
  document.querySelectorAll('.cchk').forEach(ch=>ch.onchange=e=>{const id=e.target.dataset.id;if(e.target.checked)selected.add(id);else selected.delete(id);updateCopyButton()});
  const all=document.querySelector('#chkAll');if(all)all.onchange=e=>{document.querySelectorAll('.cchk').forEach(ch=>{ch.checked=e.target.checked;const id=ch.dataset.id;if(e.target.checked)selected.add(id);else selected.delete(id)});updateCopyButton()};
  document.querySelectorAll('[data-open-customer]').forEach(b=>b.onclick=e=>{e.stopPropagation();openDetail(b.dataset.openCustomer)});
  document.querySelectorAll('tr[data-c360-id]').forEach(tr=>{tr.onclick=e=>{if(e.target.closest('input,button,a,select'))return;openDetail(tr.dataset.c360Id)}});
  const copy=document.querySelector('#copyInfo');if(copy)copy.onclick=copySelectedEmails;
  const imp=document.querySelector('#c360Import');if(imp)imp.onclick=pickImport;
  queueMicrotask(()=>document.querySelectorAll('tr[data-c360-id]').forEach(tr=>{tr.ondblclick=e=>{e.preventDefault();openDetail(tr.dataset.c360Id)}}));
};

function updateCopyButton(){const b=document.querySelector('#copyInfo');if(b){b.disabled=!selected.size;b.textContent=`선택 이메일 복사${selected.size?` (${selected.size})`:''}`}}
async function copySelectedEmails(){const emails=CUSTOMERS.filter(c=>selected.has(c.id)&&customerStatus(c)==='available').flatMap(c=>[c.mail,...(c.contacts||[]).map(p=>p.email)]).filter(validEmail);const uniq=[...new Set(emails)];if(!uniq.length)return api().toast?.('복사할 유효 이메일이 없습니다');try{await navigator.clipboard.writeText(uniq.join('; '));api().toast?.(`${uniq.length}개 이메일을 복사했습니다`)}catch{api().toast?.('브라우저 복사 권한을 확인해 주세요')}}

function openDetail(id){const c=CUSTOMERS.find(x=>String(x.id)===String(id));if(!c)return;const extras=(c.contacts||[]).slice(1);const body=`<div class="modal-head"><div><h3 class="modal-title">${esc(c.co)}</h3><div class="modal-sub">Customer 360 · ${esc(c.country||'국가 미등록')} · ${esc(c.group||'그룹 없음')}</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body c360-detail"><div class="c360-detail-grid"><section><h4>기본 정보</h4><dl><dt>담당자</dt><dd>${esc(c.p||'—')}</dd><dt>부서 / 직함</dt><dd>${esc([c.d,c.t].filter(Boolean).join(' / ')||'—')}</dd><dt>전화</dt><dd>${esc(c.tel||'—')}</dd><dt>이메일</dt><dd>${esc(c.mail||'—')}</dd><dt>수신 상태</dt><dd>${badgeStatus(c)}</dd></dl></section><section><h4>영업 프로필</h4><dl><dt>중요도</dt><dd>${'★'.repeat(Number(c.importance||0))||'—'}</dd><dt>고객 구분</dt><dd>${esc(c.kind||'—')}</dd><dt>그룹</dt><dd>${esc(c.group||'—')}</dd><dt>주요 취급품목</dt><dd>${esc(interest(c))}</dd><dt>등록일</dt><dd>${esc(c.registeredOn||'—')}</dd></dl></section></div>${extras.length?`<section class="c360-section"><h4>추가 담당자 ${extras.length}명</h4><div class="c360-contact-list">${extras.map(p=>`<div><b>${esc(p.name||'이름 없음')}</b><span>${esc([p.department,p.position].filter(Boolean).join(' · ')||'')}</span><span>${esc(p.phone||'')}</span><span>${esc(p.email||'')}</span></div>`).join('')}</div></section>`:''}<section class="c360-section"><div class="c360-section-head"><h4>메모 이력 <span>${Number(c.memoCount||0).toLocaleString()}건</span></h4><button class="btn xs" id="c360LoadMemos">전체 메모 보기</button></div>${c.memo?`<div class="c360-latest-memo">${esc(c.memo)}</div>`:'<div class="muted">대표 메모 없음</div>'}<div id="c360MemoHistory"></div></section></div><div class="modal-foot"><button class="btn" onclick="closeModal()">닫기</button></div>`;api().openModal?.(body,'wide');setTimeout(()=>{const b=document.querySelector('#c360LoadMemos');if(b)b.onclick=()=>loadMemoHistory(c.id)},0)}
async function loadMemoHistory(id){const box=document.querySelector('#c360MemoHistory');if(!box)return;box.innerHTML='<div class="muted">메모 불러오는 중…</div>';const list=await getMemos(id);box.innerHTML=list.length?`<div class="c360-memo-list">${list.slice().sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||''))).map(m=>`<article><time>${esc((m.updatedAt||m.createdAt||'').replace('T',' ').slice(0,16))}</time><p>${esc(m.body||m.text||'')}</p></article>`).join('')}</div>`:'<div class="muted">저장된 메모 이력이 없습니다.</div>'}

function pickImport(){const inp=document.createElement('input');inp.type='file';inp.accept='.json,.gz,.gzip,application/json,application/gzip';inp.onchange=()=>importPackage(inp.files?.[0]);inp.click()}
async function importPackage(file){if(!file)return;try{api().toast?.('고객 데이터 읽는 중…');let raw;if(/\.(gz|gzip)$/i.test(file.name)){if(!('DecompressionStream'in window))throw new Error('이 브라우저는 gzip 해제를 지원하지 않습니다. JSON 파일을 사용해 주세요.');raw=await new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).text()}else raw=await file.text();const payload=JSON.parse(raw);const mapped=mapPayload(payload);if(!mapped.customers.length)throw new Error('고객 데이터가 없습니다.');if(!confirm(`고객 ${mapped.customers.length.toLocaleString()}건을 현재 브라우저 고객 데이터로 교체할까요? 기존 브라우저 고객 데이터는 덮어씁니다.`))return;await putMemoPayload(mapped.memos);CUSTOMERS.splice(0,CUSTOMERS.length,...mapped.customers);selected.clear();ui={...ui,q:'',country:'',group:'',status:'',email:'',origin:'legacy',page:1};saveUi();api().saveAll?.(false);api().log?.('CUSTOMER360_IMPORT',`${file.name} / ${mapped.customers.length} customers / ${mapped.memos.length} memos`);api().render?.();api().toast?.(`${mapped.customers.length.toLocaleString()}개 고객사를 불러왔습니다`)}catch(e){console.error(e);api().toast?.(`가져오기 실패: ${e.message}`)}}

function mapPayload(payload){
  const src=Array.isArray(payload)?payload:(payload.customers||payload.state?.customers||[]);
  const memos=payload.memos||payload.state?.memos||[];
  const by=new Map();for(const m of memos){if(m?.targetType&&m.targetType!=='customers')continue;const id=m.targetId||m.customerId;if(!id)continue;if(!by.has(id))by.set(id,[]);by.get(id).push(m)}
  const customers=src.map((c,idx)=>{
    if(c.co!==undefined){return Object.assign({id:c.id||`CU-${idx+1}`,contacts:c.contacts||[],memoCount:c.memoCount||0},c)}
    const contacts=Array.isArray(c.contacts)?c.contacts:[];const p=contacts[0]||{};const ms=by.get(c.id)||[];const latest=ms.slice().sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')))[0];return {id:c.id||`CU-${idx+1}`,co:c.name||'',p:p.name||'',d:p.department||'',t:p.position||'',tel:p.phone||'',mail:p.email||'',country:c.country||'',flag:c.blocked?'block':(!validEmail(p.email)?'nomail':''),memo:c.note||(latest?.body||latest?.text||''),memoCount:ms.length,group:c.groupName||'',kind:c.kind||'',importance:Number(c.importance||0),productInterest:c.productInterest||'',interestClass:c.interestClass||'',interestSubclass:c.interestSubclass||'',registeredOn:c.registeredOn||c.createdAt?.slice?.(0,10)||'',legacySourceId:c.legacySourceId||c.id||'',contacts,legacyConsent:c.legacyConsent||'',legacyOrigin:c.legacyOrigin||''}
  });
  return {customers,memos};
}

function openMemoDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(MEMO_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(MEMO_STORE))req.result.createObjectStore(MEMO_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function putMemoPayload(memos){const groups=new Map();for(const m of memos){if(m?.targetType&&m.targetType!=='customers')continue;const id=m.targetId||m.customerId;if(!id)continue;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(m)}const db=await openMemoDb();await new Promise((resolve,reject)=>{const tx=db.transaction(MEMO_STORE,'readwrite'),st=tx.objectStore(MEMO_STORE);st.clear();for(const [id,list] of groups)st.put(list,String(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function getMemos(id){try{const db=await openMemoDb();return await new Promise((resolve,reject)=>{const req=db.transaction(MEMO_STORE).objectStore(MEMO_STORE).get(String(id));req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)})}catch{return []}}

async function autoLoadBundledData(){
  try{
    const marker=localStorage.getItem(DATA_SEED_KEY);
    if(marker==='1753:3075' && CUSTOMERS.length>1000)return;
    const mr=await fetch(`${DATA_ROOT}/manifest.json`,{cache:'no-store'});
    if(!mr.ok)throw new Error(`manifest HTTP ${mr.status}`);
    const manifest=await mr.json();
    const load=async names=>{
      const parts=[];
      for(const name of names||[]){
        const r=await fetch(`${DATA_ROOT}/${name}`,{cache:'no-store'});
        if(!r.ok)throw new Error(`${name} HTTP ${r.status}`);
        parts.push(await r.json());
      }
      return parts.flat();
    };
    const customers=await load(manifest.customerFiles);
    const memos=await load(manifest.memoFiles);
    if(customers.length!==Number(manifest.customerCount||customers.length))throw new Error('customer count mismatch');
    if(memos.length!==Number(manifest.memoCount||memos.length))throw new Error('memo count mismatch');
    const mapped=mapPayload({customers,memos});
    await putMemoPayload(mapped.memos);
    CUSTOMERS.splice(0,CUSTOMERS.length,...mapped.customers);
    selected.clear();
    ui={...ui,q:'',country:'',group:'',status:'',email:'',origin:'legacy',page:1};
    saveUi();
    localStorage.setItem(DATA_SEED_KEY,`${mapped.customers.length}:${mapped.memos.length}`);
    api().saveAll?.(false);
    api().log?.('CUSTOMER360_BUNDLED_SEED',`${mapped.customers.length} customers / ${mapped.memos.length} memos`);
    if(window.state?.page==='customer')api().render?.();
  }catch(e){
    console.error('Customer 360 bundled data load failed',e);
    api().toast?.(`고객 원본 데이터 자동 로드 실패: ${e.message}`);
  }
}

window.SEIN_CUSTOMER360={version:VERSION,mapPayload,stats,filtered,getMemos};
setTimeout(autoLoadBundledData,0);

// Repaint once after the layer loads so a restored customer page immediately uses Customer 360.
try{if(window.state?.page==='customer')api().render?.()}catch{}
})();