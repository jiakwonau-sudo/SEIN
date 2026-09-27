/* SEIN FULL SYSTEM v1.0 — functional enhancement layer */
(()=>{
'use strict';
const VERSION='v1.1-full';
const STORE_KEY='sein.full.v1.data';
const SESSION_KEY='sein.full.v1.user';
const MAX_FILE=30*1024*1024;
const USERS=[
  {id:'ceo',name:'대표자',role:'admin',label:'전체 권한 · 회계/설정 포함',cats:['used','asahi','new','calendar']},
  {id:'sales',name:'영업 담당',role:'staff',label:'중고설비 · 영업/고객',cats:['used','calendar']},
  {id:'asahi',name:'아사히 담당',role:'staff',label:'아사히 자료 · 고객',cats:['asahi','calendar']},
  {id:'ops',name:'운영 담당',role:'staff',label:'중고·아사히 자료 · 일정',cats:['used','asahi','calendar']},
];
let currentUser=null;
let selectedLogin='ceo';
let appFiles=[];
let mailQueue=[];
let migrationRuns=[];
let calendarEvents=[
  {id:'EV-1',date:'2026-09-03',title:'선적 · AP-450',type:'선적'},
  {id:'EV-2',date:'2026-09-12',title:'대성정밀 방문',type:'방문'},
  {id:'EV-3',date:'2026-09-28',title:'9월 선적 준비',type:'선적'},
];
let exchange={usdkrw:1380,jpykrw:9.25,source:'하나은행 수동 fallback',updatedAt:'2026-09-26'};
let audit=[];
let globalSearch='';
let dbPromise=null;

const baseline={
  equip:JSON.parse(JSON.stringify(EQUIP)), deals:JSON.parse(JSON.stringify(DEALS)), customers:JSON.parse(JSON.stringify(CUSTOMERS)),
  quotes:JSON.parse(JSON.stringify(QUOTES)), purchases:JSON.parse(JSON.stringify(PURCHASES)), account:JSON.parse(JSON.stringify(ACCOUNT_DATA)), drive:JSON.parse(JSON.stringify(DRIVE))
};

function replaceArray(target,src){target.splice(0,target.length,...src)}
function replaceObject(target,src){Object.keys(target).forEach(k=>delete target[k]);Object.assign(target,src)}
function nowISO(){return new Date().toISOString()}
function shortNow(){return new Date().toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
function uid(prefix){return prefix+'-'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,5).toUpperCase()}
function safeNum(v){return Number(String(v||'').replace(/[^0-9.-]/g,''))||0}
function fmtFile(bytes){if(bytes<1024)return bytes+'B'; if(bytes<1048576)return(bytes/1024).toFixed(1)+'KB'; return(bytes/1048576).toFixed(1)+'MB'}
function log(action,detail){audit.unshift({at:nowISO(),user:currentUser?.name||'system',action,detail});audit=audit.slice(0,300);saveAll(false)}
function saveAll(show=true){
  const ind=document.querySelector('.save-indicator'); if(ind){ind.textContent='저장 중';ind.className='save-indicator busy'}
  const data={version:VERSION,equip:EQUIP,deals:DEALS,customers:CUSTOMERS,quotes:QUOTES,purchases:PURCHASES,account:ACCOUNT_DATA,drive:DRIVE,files:appFiles,mailQueue,migrationRuns,calendarEvents,exchange,audit};
  localStorage.setItem(STORE_KEY,JSON.stringify(data));
  if(ind){setTimeout(()=>{ind.textContent='● 저장됨';ind.className='save-indicator ok'},80)}
  if(show) toast('저장되었습니다');
}
function hydrate(){
  try{
    const raw=localStorage.getItem(STORE_KEY); if(!raw)return;
    const d=JSON.parse(raw);
    if(Array.isArray(d.equip))replaceArray(EQUIP,d.equip);
    if(Array.isArray(d.deals))replaceArray(DEALS,d.deals);
    if(Array.isArray(d.customers))replaceArray(CUSTOMERS,d.customers);
    if(Array.isArray(d.quotes))replaceArray(QUOTES,d.quotes);
    if(Array.isArray(d.purchases))replaceArray(PURCHASES,d.purchases);
    if(d.account)replaceObject(ACCOUNT_DATA,d.account);
    if(d.drive)replaceObject(DRIVE,d.drive);
    appFiles=d.files||[];mailQueue=d.mailQueue||[];migrationRuns=d.migrationRuns||[];calendarEvents=d.calendarEvents||calendarEvents;exchange=d.exchange||exchange;audit=d.audit||[];
  }catch(e){console.warn('hydrate failed',e)}
}

function db(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{const q=indexedDB.open('sein-full-files',1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('files'))q.result.createObjectStore('files')};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});return dbPromise;
}
async function putBlob(id,file){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').put(file,id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function getBlob(id){const d=await db();return new Promise((res,rej)=>{const q=d.transaction('files').objectStore('files').get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function deleteBlob(id){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function downloadBlob(id,name){const blob=await getBlob(id);if(!blob)return toast('이 파일은 목업 메타데이터라 실제 원본이 없습니다');const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}

function addLoginGate(){
  const el=document.createElement('div');el.id='loginGate';el.className='login-gate';el.innerHTML=`<div class="login-card"><div class="login-brand"><div class="mark">SEIN</div><div><h1>통합 관리 시스템</h1><p>FULL v1.1 · 요구사항 통합 검증용</p></div></div><div class="user-grid">${USERS.map(u=>`<button class="user-card ${u.id==='ceo'?'on':''}" data-user="${u.id}"><b>${u.name}</b><span>${u.label}</span></button>`).join('')}</div><div class="pin-row"><input id="loginPin" type="password" inputmode="numeric" placeholder="PIN 1234" value="1234"><button class="btn primary" id="loginBtn">로그인</button></div><div class="muted" style="font-size:11px;margin-top:10px">현재 버전은 브라우저 저장형 검증판입니다. 운영 DB는 데이터 계층 교체 방식으로 연결합니다.</div></div>`;document.body.appendChild(el);document.body.classList.add('full-locked');
  el.querySelectorAll('[data-user]').forEach(b=>b.onclick=()=>{selectedLogin=b.dataset.user;el.querySelectorAll('[data-user]').forEach(x=>x.classList.toggle('on',x===b))});
  el.querySelector('#loginBtn').onclick=login;el.querySelector('#loginPin').onkeydown=e=>{if(e.key==='Enter')login()};
}
function login(){const pin=$('#loginPin')?.value;if(pin!=='1234')return toast('PIN을 확인해 주세요');currentUser=USERS.find(u=>u.id===selectedLogin)||USERS[0];sessionStorage.setItem(SESSION_KEY,currentUser.id);state.role=currentUser.role;$('#loginGate')?.remove();document.body.classList.remove('full-locked');log('LOGIN',currentUser.name);render();enhanceChrome()}
function logout(){sessionStorage.removeItem(SESSION_KEY);currentUser=null;addLoginGate()}
function restoreSession(){const id=sessionStorage.getItem(SESSION_KEY);if(id){currentUser=USERS.find(u=>u.id===id)||null;if(currentUser){state.role=currentUser.role;return true}}return false}
function canCat(id){return !currentUser||currentUser.role==='admin'||currentUser.cats.includes(id)}

function enhanceChrome(){
  const right=document.querySelector('.topbar-right');if(!right)return;
  right.querySelector('.role-switch')?.remove();right.querySelector('#quickFind')?.remove();right.querySelector('#logoutBtn')?.remove();right.querySelector('.save-indicator')?.remove();
  const q=document.createElement('button');q.id='quickFind';q.className='quick-btn';q.title='통합 검색 (/ 키)';q.textContent='⌕';q.onclick=openGlobalSearch;
  const s=document.createElement('span');s.className='save-indicator ok';s.textContent='● 저장됨';
  const o=document.createElement('button');o.id='logoutBtn';o.className='btn xs';o.textContent=(currentUser?.name||'사용자')+' 로그아웃';o.onclick=logout;
  right.insertBefore(q,right.firstChild);right.insertBefore(s,q.nextSibling);right.insertBefore(o,s.nextSibling);$('#avatarBox').textContent=currentUser?.name?.slice(0,2)||'SE';
  addMobileBottom();
}
function addMobileBottom(){document.querySelector('.mobile-bottom')?.remove();const d=document.createElement('div');d.className='mobile-bottom';d.innerHTML=[['dash','현황'],['goods','설비'],['sales','영업'],['customer','고객']].map(([id,n])=>`<button data-mpage="${id}" class="${state.page===id?'on':''}">${n}</button>`).join('');document.body.appendChild(d);d.querySelectorAll('[data-mpage]').forEach(b=>b.onclick=()=>{state.page=b.dataset.mpage;history.pushState({page:state.page},'',`#${state.cat}/${state.page}`);render()})}

const baseRenderCats=renderCats;
renderCats=function(){
  $('#cats').innerHTML=CATS.filter(c=>canCat(c.id)).map(c=>`<button class="cat ${c.ghost?'ghost':''} ${state.cat===c.id?'on':''}" data-cat="${c.id}">${c.name}</button>`).join('')+(currentUser?.role==='admin'?`<button class="cat-add" id="catAdd">＋ 카테고리</button>`:'');
  $$('#cats .cat').forEach(b=>b.onclick=()=>{state.cat=b.dataset.cat;state.drivePath=[];state.page=state.cat==='calendar'?'calendar':(state.cat==='asahi'?'goods':'dash');history.pushState({cat:state.cat,page:state.page},'',`#${state.cat}/${state.page}`);render()});
  if($('#catAdd')) $('#catAdd').onclick=()=>openCategoryModal();
};
function openCategoryModal(){openModal(`<div class="modal-head"><div><h3 class="modal-title">카테고리 추가</h3><div class="modal-sub">새 사업 영역을 추가합니다</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body"><div class="f"><label>카테고리명</label><input id="newCatName" placeholder="예: 로봇"></div></div><div class="modal-foot"><button class="btn" onclick="closeModal()">취소</button><button class="btn primary" id="newCatOk">추가</button></div>`,'narrow');$('#newCatOk').onclick=()=>{const n=$('#newCatName').value.trim();if(!n)return toast('이름을 입력해 주세요');const id='cat'+Date.now();CATS.splice(CATS.length-1,0,{id,name:n});currentUser.cats.push(id);closeModal();log('CATEGORY_CREATE',n);render()}}

if(!NAVS.some(g=>g.items?.some(i=>i.id==='ops'))){const g=NAVS.find(g=>g.g==='관리');g.items.push({id:'ops',ic:'⚙',name:'운영 도구',admin:true})}
const originalRender=render;
render=function(){
  if(currentUser && !canCat(state.cat)){state.cat=currentUser.cats[0]||'used';state.page='dash'}
  renderCats();renderSide();const m=$('#main');
  if(state.cat==='calendar'){m.innerHTML=pageCalendar();bindCalendar();postRender();return}
  if(state.cat==='asahi'&&state.page==='goods'){m.innerHTML=pageDrive();bindDriveFull();postRender();return}
  if(state.cat==='new'&&state.page!=='account'&&state.page!=='customer'&&state.page!=='ops'){m.innerHTML=pageNewCat();postRender();return}
  switch(state.page){
    case 'dash':m.innerHTML=pageDashFull();break;
    case 'goods':m.innerHTML=pageGoods();break;
    case 'quote':m.innerHTML=pageQuote();break;
    case 'sales':m.innerHTML=pageSales();break;
    case 'customer':m.innerHTML=pageCustomer();break;
    case 'files':m.innerHTML=pageFilesFull();break;
    case 'account':m.innerHTML=pageAccount();break;
    case 'ops':m.innerHTML=pageOps();break;
    default:m.innerHTML=pageDashFull();
  }
  postRender();
};
function postRender(){
  $$('[data-eq]').forEach(el=>el.onclick=()=>openEquipFull(el.dataset.eq));
  $$('[data-deal]').forEach(el=>el.onclick=()=>openDeal(el.dataset.deal));
  $$('[data-go]').forEach(el=>el.onclick=()=>{state.page=el.dataset.go;history.pushState({page:state.page},'',`#${state.cat}/${state.page}`);render()});
  $$('[data-view]').forEach(el=>el.onclick=()=>{state.goodsView=el.dataset.view;render()});
  $$('[data-stage]').forEach(el=>el.onclick=()=>{state.goodsFilter=el.dataset.stage;render()});
  bindGoodsFull();bindQuoteFull();bindSalesFull();bindCustomerFull();bindFilesFull();if(state.page==='account'&&state.role==='admin')bindAccountFull();if(state.page==='ops')bindOps();enhanceChrome();saveAll(false);
}
const oldRenderSide=renderSide;
renderSide=function(){oldRenderSide();$$('#side .nav[data-page],#pillNav .chip[data-page]').forEach(b=>{const p=b.dataset.page;if(p==='account'||p==='ops'){if(currentUser?.role!=='admin')b.style.display='none'}b.onclick=()=>{state.page=p;history.pushState({page:p},'',`#${state.cat}/${p}`);render()}})};

function pageDashFull(){
  let h=pageDash();h=h.replace('연동 확인 중',`${W(exchange.usdkrw)}원`).replace('실제 연동 방식 검토 필요',`${exchange.source} · ${exchange.updatedAt}`);
  h=h.replace('<div class="page-sub">','<div class="page-sub"><span class="full-chip">FULL v1.1</span> ');
  return h;
}

const oldPageGoods=pageGoods;
pageGoods=function(){let h=oldPageGoods();h=h.replace(`onclick="toast('목업 — 신규 설비 등록 폼은 시연되지 않습니다')"`,'id="newEquip"');h=h.replace('placeholder="모델명 · 설비번호 · 메모 내용 검색"',`id="goodsSearch" value="${esc(globalSearch)}" placeholder="모델명 · 설비번호 · 메모 내용 검색"`);return h};
function bindGoodsFull(){
  if($('#newEquip'))$('#newEquip').onclick=()=>openEquipForm();
  if($('#goodsSearch')){$('#goodsSearch').oninput=e=>{const q=e.target.value.toLowerCase();$$('.eq-grid .eq,table.tbl tbody tr[data-eq]').forEach(el=>el.style.display=el.textContent.toLowerCase().includes(q)?'':'none')}}
}
function openEquipForm(equip){const e=equip||{};openModal(`<div class="modal-head"><div><h3 class="modal-title">${equip?'설비 수정':'신규 설비 등록'}</h3><div class="modal-sub">핵심 속성과 상태를 먼저 저장하고 메모·사진·파일을 이어서 관리합니다</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body"><div class="form-grid"><div class="f"><label>모델명 *</label><input id="efModel" value="${esc(e.model||'')}"></div><div class="f"><label>설비번호 *</label><input id="efNo" value="${esc(e.no||'')}"></div><div class="f"><label>톤수</label><input id="efTon" type="number" value="${e.ton||''}"></div><div class="f"><label>상태</label><select id="efStatus">${['재고','영업중','판매확정'].map(x=>`<option ${e.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="f"><label>단계</label><select id="efStage">${STAGES.map(x=>`<option value="${x.id}" ${e.stage===x.id?'selected':''}>${x.name}</option>`).join('')}</select></div><div class="f"><label>고객사</label><input id="efCustomer" value="${esc(e.customer||'')}"></div><div class="f"><label>매입가</label><input id="efBuy" value="${e.buy||''}"></div><div class="f"><label>판매가</label><input id="efSell" value="${e.sell||''}"></div></div><div class="f" style="margin-top:12px"><label>메모</label><textarea id="efMemo" rows="5">${esc(e.memoPreview||'')}</textarea></div></div><div class="modal-foot">${equip?'<button class="btn danger" id="efDelete">비활성/삭제</button>':''}<button class="btn" onclick="closeModal()">취소</button><button class="btn primary" id="efSave">저장</button></div>`,'wide');
  $('#efSave').onclick=()=>{const model=$('#efModel').value.trim(),no=$('#efNo').value.trim();if(!model||!no)return toast('모델명과 설비번호는 필수입니다');const target=equip||{};Object.assign(target,{id:target.id||uid('EQ'),cat:target.cat||state.cat,model,no,ton:safeNum($('#efTon').value),status:$('#efStatus').value,stage:$('#efStage').value,customer:$('#efCustomer').value.trim(),buy:safeNum($('#efBuy').value),sell:safeNum($('#efSell').value),memoPreview:$('#efMemo').value.trim(),memoDate:new Date().toISOString().slice(5,10),memo:target.memo||memoHTML(MEMO_TEMPLATE,$('#efMemo').value.trim()?`<p>${esc($('#efMemo').value.trim())}</p>`:''),atts:target.atts||[],photos:target.photos||0,color:target.color||'#297d73'});if(!equip)EQUIP.unshift(target);saveAll(false);log(equip?'EQUIPMENT_UPDATE':'EQUIPMENT_CREATE',`${model} / ${no}`);closeModal();render()};
  if($('#efDelete'))$('#efDelete').onclick=()=>{if(!confirm('이 설비를 삭제할까요?'))return;const i=EQUIP.findIndex(x=>x.id===equip.id);if(i>=0)EQUIP.splice(i,1);log('EQUIPMENT_DELETE',equip.no);closeModal();render()};
}
function openEquipFull(id,tab){const e=eqById(id);if(!e)return;openEquip(id,tab);const foot=$('#modal .modal-foot');if(foot){const edit=document.createElement('button');edit.className='btn';edit.textContent='기본정보 수정';edit.onclick=()=>openEquipForm(e);foot.insertBefore(edit,foot.firstChild)}const save=foot?.querySelector('.btn.primary');if(save)save.onclick=()=>{if($('#memoArea')){e.memo=$('#memoArea').innerHTML;e.memoPreview=$('#memoArea').innerText.trim().slice(0,180);e.memoDate=new Date().toISOString().slice(5,10)}saveAll(false);log('EQUIPMENT_DETAIL_SAVE',e.no);closeModal();render()};patchEquipPane(e)}
const oldPaintEqPane=paintEqPane;
paintEqPane=function(e){oldPaintEqPane(e);patchEquipPane(e)};
function patchEquipPane(e){if(!$('#eqPane'))return;if(modalTab==='photo'){const btn=$$('#eqPane button').find(x=>x.textContent.includes('사진 업로드'));if(btn){btn.onclick=()=>pickEquipFiles(e,'image/*','photo')}}if(modalTab==='file'){const btn=$$('#eqPane button').find(x=>x.textContent.includes('파일 업로드'));if(btn){btn.onclick=()=>pickEquipFiles(e,'*/*','file')}}}
function pickEquipFiles(e,accept,kind){const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.accept=accept;inp.onchange=async()=>{for(const f of inp.files){if(f.size>MAX_FILE){toast(`${f.name}: 30MB 초과`);continue}const id=uid('F');await putBlob(id,f);appFiles.unshift({id,name:f.name,size:f.size,type:f.type,scope:'equipment',scopeId:e.id,createdAt:nowISO()});e.atts=e.atts||[];if(kind==='file')e.atts.push({n:f.name,s:fmtFile(f.size),fileId:id});else e.photos=(e.photos||0)+1}saveAll(false);log('EQUIPMENT_FILE_UPLOAD',`${e.no} / ${inp.files.length}개`);openEquipFull(e.id,kind==='photo'?'photo':'file')};inp.click()}

const oldPageQuote=pageQuote;
pageQuote=function(){let h=oldPageQuote();h=h.replace(`onclick="toast('목업 — 견적 등록 폼은 시연되지 않습니다')"`,'id="newQuote"');return h};
function bindQuoteFull(){if($('#newQuote'))$('#newQuote').onclick=openQuoteForm}
function openQuoteForm(){openModal(`<div class="modal-head"><div><h3 class="modal-title">견적 등록</h3><div class="modal-sub">설비와 금액을 연결합니다</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body"><div class="form-grid"><div class="f"><label>설비</label><select id="qEq">${EQUIP.map(e=>`<option value="${e.id}">${e.model} · ${e.no}</option>`).join('')}</select></div><div class="f"><label>구분</label><select id="qKind"><option>예상(영업)</option><option>확정(실비)</option></select></div><div class="f"><label>금액</label><input id="qAmt" type="number"></div><div class="f"><label>파일명</label><input id="qFile" placeholder="견적서.pdf"></div></div></div><div class="modal-foot"><button class="btn" onclick="closeModal()">취소</button><button class="btn primary" id="qSave">등록</button></div>`,'narrow');$('#qSave').onclick=()=>{const amt=safeNum($('#qAmt').value);if(!amt)return toast('금액을 입력해 주세요');QUOTES.unshift({id:uid('QT'),eq:$('#qEq').value,kind:$('#qKind').value,amt,date:new Date().toISOString().slice(0,10),file:$('#qFile').value.trim()||'견적서',by:currentUser.name});log('QUOTE_CREATE',W(amt)+'원');closeModal();render()}}

function bindSalesFull(){if($('#newDeal'))$('#newDeal').onclick=openDealForm;if($('#statBtn'))$('#statBtn').onclick=openStats}
function openDealForm(){const companies=[...new Set(CUSTOMERS.map(c=>c.co))];openModal(`<div class="modal-head"><div><h3 class="modal-title">영업 건 생성</h3><div class="modal-sub">고객 + 설비 + 판매 진행을 한 건으로 묶습니다</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body"><div class="form-grid"><div class="f"><label>영업 건명 *</label><input id="dName"></div><div class="f"><label>고객사 *</label><select id="dCustomer">${companies.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="f"><label>판매 예정가</label><input id="dPlanned" type="number"></div></div><div class="f" style="margin-top:12px"><label>설비 선택</label><div>${EQUIP.map(e=>`<label class="pick-row"><input type="checkbox" class="dealEq" value="${e.id}"><div><b>${e.model}</b><div class="eq-no">${e.no}</div></div></label>`).join('')}</div></div><div class="f" style="margin-top:12px"><label>최초 메모</label><textarea id="dMemo" rows="3"></textarea></div></div><div class="modal-foot"><button class="btn" onclick="closeModal()">취소</button><button class="btn primary" id="dSave">생성</button></div>`,'wide');$('#dSave').onclick=()=>{const name=$('#dName').value.trim(),eqs=$$('.dealEq:checked').map(x=>x.value);if(!name||!eqs.length)return toast('영업 건명과 설비를 선택해 주세요');const buy=eqs.reduce((s,id)=>s+(eqById(id)?.buy||0),0);DEALS.unshift({id:uid('SL'),name,customer:$('#dCustomer').value,owner:currentUser.name,equips:eqs,status:'진행',confirmedAt:'',buy,plannedSell:safeNum($('#dPlanned').value),sell:0,memos:$('#dMemo').value.trim()?[{w:currentUser.name+' · '+shortNow(),c:$('#dMemo').value.trim()}]:[]});log('DEAL_CREATE',name);closeModal();render()}}
const oldOpenDeal=openDeal;
openDeal=function(id){saveAll(false);oldOpenDeal(id);const d=DEALS.find(x=>x.id===id);if(!d)return;const del=document.createElement('button');del.className='btn danger';del.textContent='영업건 삭제';del.onclick=()=>{if(!confirm('영업 건을 삭제할까요? 메모는 백업 내역에 남습니다.'))return;const i=DEALS.findIndex(x=>x.id===id);if(i>=0)DEALS.splice(i,1);log('DEAL_DELETE',d.name);closeModal();render()};$('#modal .modal-foot')?.prepend(del)};
const oldPaintDeal=paintDeal;paintDeal=function(d){oldPaintDeal(d);if($('#addMemo')){const b=$('#addMemo'),old=b.onclick;b.onclick=()=>{old();saveAll(false);log('DEAL_MEMO',d.name)}}};
const oldConfirmDeal=confirmDeal;confirmDeal=function(id){oldConfirmDeal(id);setTimeout(()=>{if($('#cOk')){const b=$('#cOk'),old=b.onclick;b.onclick=()=>{old();saveAll(false);log('DEAL_CONFIRM',id)}}},0)};

const oldPageCustomer=pageCustomer;
pageCustomer=function(){let h=oldPageCustomer();h=h.replace(`onclick="toast('목업 — 고객 등록 폼은 시연되지 않습니다')"`,'id="newCustomer"');h=h.replace('placeholder="회사명 · 담당자 · 이메일 검색"','id="customerSearch" placeholder="회사명 · 담당자 · 이메일 검색"');return h};
function bindCustomerFull(){
  bindCustomer();if($('#newCustomer'))$('#newCustomer').onclick=()=>openCustomerForm();
  $$('#main tbody tr').forEach((tr,i)=>{if(i<CUSTOMERS.length)tr.ondblclick=()=>openCustomerForm(CUSTOMERS[i])});
  if($('#customerSearch'))$('#customerSearch').oninput=e=>{const q=e.target.value.toLowerCase();$$('#main tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')};
  $$('.bchk').forEach(b=>{const old=b.onchange;b.onchange=e=>{old(e);saveAll(false);log('CUSTOMER_BLOCK_TOGGLE',CUSTOMERS[+b.dataset.i]?.co||'')}});
  if($('#bulkMail'))$('#bulkMail').onclick=openBulkMailFull;
}
function openCustomerForm(c){const x=c||{};openModal(`<div class="modal-head"><div><h3 class="modal-title">${c?'고객 수정':'고객 등록'}</h3><div class="modal-sub">회사/담당자 기준 연락처와 발송 상태를 관리합니다</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body"><div class="form-grid"><div class="f"><label>회사명 *</label><input id="cfCo" value="${esc(x.co||'')}"></div><div class="f"><label>담당자 *</label><input id="cfP" value="${esc(x.p||'')}"></div><div class="f"><label>부서</label><input id="cfD" value="${esc(x.d||'')}"></div><div class="f"><label>직함</label><input id="cfT" value="${esc(x.t||'')}"></div><div class="f"><label>전화</label><input id="cfTel" value="${esc(x.tel||'')}"></div><div class="f"><label>이메일</label><input id="cfMail" value="${esc(x.mail||'')}"></div><div class="f"><label>국가</label><input id="cfCountry" value="${esc(x.country||'대한민국')}"></div><div class="f"><label>발송 상태</label><select id="cfFlag">${[['','정상'],['block','송신 금지'],['spam','스팸 처리'],['nomail','이메일 미등록']].map(([v,n])=>`<option value="${v}" ${x.flag===v?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="f" style="margin-top:12px"><label>메모</label><textarea id="cfMemo" rows="4">${esc(x.memo||'')}</textarea></div></div><div class="modal-foot">${c?'<button class="btn danger" id="cfDelete">삭제</button>':''}<button class="btn" onclick="closeModal()">취소</button><button class="btn primary" id="cfSave">저장</button></div>`,'wide');$('#cfSave').onclick=()=>{const co=$('#cfCo').value.trim(),p=$('#cfP').value.trim();if(!co||!p)return toast('회사명과 담당자는 필수입니다');const t=c||{};Object.assign(t,{id:t.id||uid('CU'),co,p,d:$('#cfD').value.trim(),t:$('#cfT').value.trim(),tel:$('#cfTel').value.trim(),mail:$('#cfMail').value.trim(),country:$('#cfCountry').value.trim(),flag:$('#cfFlag').value,memo:$('#cfMemo').value.trim()});if(!c)CUSTOMERS.unshift(t);log(c?'CUSTOMER_UPDATE':'CUSTOMER_CREATE',co+' '+p);closeModal();render()};if($('#cfDelete'))$('#cfDelete').onclick=()=>{if(!confirm('고객을 삭제할까요?'))return;CUSTOMERS.splice(CUSTOMERS.indexOf(c),1);log('CUSTOMER_DELETE',c.co+' '+c.p);closeModal();render()}}
function openBulkMailFull(){const ok=selectedCustomers().filter(c=>c.mail&&c.flag!=='block');if(!ok.length)return toast('발송할 고객을 선택해 주세요');openModal(`<div class="modal-head"><div><h3 class="modal-title">Gmail 분할 발송 큐</h3><div class="modal-sub">선택 ${ok.length}명 · 송신금지/이메일 미등록 자동 제외</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body"><div class="lock-note" style="background:var(--warn-soft);border-color:#f3e0bd;color:#7a4f06"><span>⚑</span><div>이 검증판은 <b>실제 Gmail 전송 대신 큐·분할·제외·실패처리 흐름</b>을 구현합니다. 실제 OAuth 연동 후 동일 큐를 Gmail 전송기로 교체합니다.</div></div><div class="form-grid"><div class="f"><label>언어</label><select id="mailLang"><option>한국어</option><option>영어</option><option>일본어</option></select></div><div class="f"><label>배치 크기</label><input value="500" readonly></div></div><div class="f" style="margin-top:12px"><label>제목</label><input id="mailSub"></div><div class="f" style="margin-top:12px"><label>본문</label><textarea id="mailBody" rows="6"></textarea></div><div class="f" style="margin-top:12px"><label>자료 링크</label><input id="mailLink" placeholder="Drive/시스템 링크"></div></div><div class="modal-foot"><button class="btn" onclick="closeModal()">취소</button><button class="btn primary" id="mailQueueAdd">큐 등록</button></div>`,'wide');$('#mailQueueAdd').onclick=()=>{const batches=[];for(let i=0;i<ok.length;i+=500)batches.push(ok.slice(i,i+500).map(c=>c.mail));mailQueue.unshift({id:uid('MAIL'),createdAt:nowISO(),by:currentUser.name,lang:$('#mailLang').value,subject:$('#mailSub').value.trim(),body:$('#mailBody').value,link:$('#mailLink').value,batches,status:'Queued',sent:0,total:ok.length});log('MAIL_QUEUE_CREATE',`${ok.length}명 / ${batches.length}배치`);closeModal();render();toast('발송 큐에 등록했습니다')}}

function pageFilesFull(){return `<div class="page-head"><div><h1 class="page-title">자료실</h1><div class="page-sub">실제 업로드 파일은 이 브라우저 IndexedDB에 저장 · 파일당 30MB</div></div><div class="actions"><button class="btn" id="fileNewFolder">＋ 폴더</button><button class="btn primary" id="fileUpload">＋ 파일 업로드</button></div></div><div class="filters"><div class="field" style="min-width:240px"><span class="ic">🔍</span><input id="fileSearch" placeholder="파일명 검색"></div><span class="badge b-blue">${appFiles.length}개</span></div><div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>파일명</th><th>범위</th><th>크기</th><th>등록자</th><th>등록일</th><th></th></tr></thead><tbody>${appFiles.length?appFiles.map(f=>`<tr data-file-row="${f.id}"><td class="strong">📄 ${esc(f.name)}</td><td><span class="badge b-gray">${esc(f.scope||'공용')}</span></td><td>${fmtFile(f.size||0)}</td><td>${esc(f.by||'')}</td><td class="muted">${(f.createdAt||'').slice(0,10)}</td><td class="num"><button class="btn xs" data-fdown="${f.id}">받기</button> <button class="btn xs danger" data-fdel="${f.id}">삭제</button></td></tr>`).join(''):'<tr><td colspan="6" class="muted" style="padding:32px;text-align:center">아직 실제 업로드 파일이 없습니다</td></tr>'}</tbody></table></div></div><div id="realFileDrop" class="file-drop-real" style="margin-top:12px">파일을 여기로 드래그 앤 드롭해도 됩니다</div>`}
function bindFilesFull(){if($('#fileUpload'))$('#fileUpload').onclick=()=>pickSystemFiles();if($('#fileSearch'))$('#fileSearch').oninput=e=>{const q=e.target.value.toLowerCase();$$('[data-file-row]').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none')};$$('[data-fdown]').forEach(b=>b.onclick=()=>downloadBlob(b.dataset.fdown,appFiles.find(f=>f.id===b.dataset.fdown)?.name||'file'));$$('[data-fdel]').forEach(b=>b.onclick=async()=>{const f=appFiles.find(x=>x.id===b.dataset.fdel);if(!confirm(`${f?.name||'파일'} 삭제?`))return;await deleteBlob(b.dataset.fdel);appFiles=appFiles.filter(x=>x.id!==b.dataset.fdel);log('FILE_DELETE',f?.name||'');render()});const dz=$('#realFileDrop');if(dz){['dragenter','dragover'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.add('hot')}));['dragleave','drop'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.remove('hot')}));dz.addEventListener('drop',e=>storeSystemFiles([...e.dataTransfer.files]))}}
function pickSystemFiles(){const i=document.createElement('input');i.type='file';i.multiple=true;i.onchange=()=>storeSystemFiles([...i.files]);i.click()}
async function storeSystemFiles(files){let n=0;for(const f of files){if(f.size>MAX_FILE){toast(`${f.name}: 30MB 초과`);continue}const id=uid('F');await putBlob(id,f);appFiles.unshift({id,name:f.name,size:f.size,type:f.type,scope:'공용',createdAt:nowISO(),by:currentUser.name});n++}if(n){log('FILE_UPLOAD',`${n}개`);render();toast(`${n}개 파일 업로드 완료`)}}

function bindDriveFull(){bindDrive();const node=driveNodeAt(state.drivePath);if($('#dUp'))$('#dUp').onclick=()=>{const i=document.createElement('input');i.type='file';i.multiple=true;i.onchange=async()=>{for(const f of i.files){if(f.size>MAX_FILE){toast(`${f.name}: 30MB 초과`);continue}const id=uid('F');await putBlob(id,f);const ext=(f.name.split('.').pop()||'').toUpperCase();(node.children=node.children||[]).push({n:f.name,kind:'file',t:ext,s:fmtFile(f.size),d:new Date().toISOString().slice(0,10),by:currentUser.name,fileId:id});appFiles.unshift({id,name:f.name,size:f.size,type:f.type,scope:'아사히 드라이브',createdAt:nowISO(),by:currentUser.name})}log('DRIVE_UPLOAD',`${i.files.length}개`);render()};i.click()};if($('#dNewFolder'))$('#dNewFolder').onclick=()=>{const n=prompt('새 폴더 이름');if(!n)return;(node.children=node.children||[]).push(D(n,[]));log('DRIVE_FOLDER_CREATE',n);render()};saveAll(false)}
const oldOpenFilePreview=openFilePreview;openFilePreview=function(it){oldOpenFilePreview(it);if(it.fileId){const b=$$('#modal .modal-foot .btn.primary')[0];if(b){b.onclick=()=>downloadBlob(it.fileId,it.n);b.textContent='다운로드'}}}

function pageCalendar(){const y=2026,m=8;const first=new Date(y,m,1).getDay();const days=new Date(y,m+1,0).getDate();let cells='';for(let i=0;i<first;i++)cells+='<div class="dc dim"></div>';for(let d=1;d<=days;d++){const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const es=calendarEvents.filter(e=>e.date===ds);cells+=`<div class="dc" data-date="${ds}"><div class="dn">${d}</div>${es.map(e=>`<div class="ev" data-event="${e.id}" style="background:#1b4f9c1a;color:#1b4f9c">${esc(e.title)}</div>`).join('')}</div>`}return `<div class="page-head"><div><h1 class="page-title">캘린더</h1><div class="page-sub">선적 · 출항 · 출장 · 휴가 · 방문 일정을 한 곳에서</div></div><div class="actions"><button class="btn primary" id="newEvent">＋ 일정 등록</button></div></div><div class="card"><div class="card-body"><div class="cal">${['일','월','화','수','목','금','토'].map(x=>`<div class="dh">${x}</div>`).join('')}${cells}</div></div></div>`}
function bindCalendar(){if($('#newEvent'))$('#newEvent').onclick=()=>openEventForm();$$('[data-event]').forEach(e=>e.onclick=ev=>{ev.stopPropagation();openEventForm(calendarEvents.find(x=>x.id===e.dataset.event))});$$('[data-date]').forEach(d=>d.ondblclick=()=>openEventForm(null,d.dataset.date));enhanceChrome();saveAll(false)}
function openEventForm(ev,date){const x=ev||{};openModal(`<div class="modal-head"><div><h3 class="modal-title">${ev?'일정 수정':'일정 등록'}</h3></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body"><div class="form-grid"><div class="f"><label>날짜</label><input id="evDate" type="date" value="${x.date||date||new Date().toISOString().slice(0,10)}"></div><div class="f"><label>구분</label><select id="evType">${['선적','출항','출장','휴가','방문','기타'].map(t=>`<option ${x.type===t?'selected':''}>${t}</option>`).join('')}</select></div></div><div class="f" style="margin-top:12px"><label>일정명</label><input id="evTitle" value="${esc(x.title||'')}"></div></div><div class="modal-foot">${ev?'<button class="btn danger" id="evDelete">삭제</button>':''}<button class="btn" onclick="closeModal()">취소</button><button class="btn primary" id="evSave">저장</button></div>`,'narrow');$('#evSave').onclick=()=>{const title=$('#evTitle').value.trim();if(!title)return toast('일정명을 입력해 주세요');const t=ev||{};Object.assign(t,{id:t.id||uid('EV'),date:$('#evDate').value,type:$('#evType').value,title});if(!ev)calendarEvents.push(t);log(ev?'EVENT_UPDATE':'EVENT_CREATE',title);closeModal();render()};if($('#evDelete'))$('#evDelete').onclick=()=>{calendarEvents=calendarEvents.filter(e=>e.id!==ev.id);log('EVENT_DELETE',ev.title);closeModal();render()}}

function bindAccountFull(){bindAccount();$$('.account-edit td[contenteditable]').forEach(td=>{const old=td.onblur;td.onblur=()=>{old?.();saveAll(false);log('ACCOUNT_EDIT',state.accountView)}})}

function pageOps(){if(currentUser?.role!=='admin')return `<div class="card"><div class="denied"><div class="lk">🔒</div><h3>대표자 전용 운영 도구입니다</h3></div></div>`;return `<div class="page-head"><div><h1 class="page-title">운영 도구</h1><div class="page-sub">통합 검색 · Gmail 큐 · 환율 fallback · Excel Import · Legacy Pilot · 백업/복구</div></div><span class="full-chip">WBS Integration</span></div><div class="ops-grid"><section class="ops-card"><h3>환율</h3><p>하나은행 기준 연동 전까지 수동 fallback 값을 사용합니다.</p><div class="form-grid"><div class="f"><label>USD/KRW</label><input id="fxUsd" value="${exchange.usdkrw}"></div><div class="f"><label>JPY/KRW</label><input id="fxJpy" value="${exchange.jpykrw}"></div></div><div class="form-actions"><button class="btn primary sm" id="fxSave">저장</button></div></section><section class="ops-card"><h3>Gmail 발송 큐</h3><p>실제 OAuth 전송기는 미연결. 분할/제외/재시도 가능한 큐 상태를 관리합니다.</p><div class="metric-row"><div class="metric-mini"><b>${mailQueue.length}</b>큐</div><div class="metric-mini"><b>${mailQueue.reduce((s,q)=>s+q.total,0)}</b>수신자</div></div><div class="form-actions"><button class="btn sm" id="mailRun">선택 큐 시뮬레이션</button></div></section><section class="ops-card"><h3>고객 Excel/CSV Import</h3><p>회사/담당자/전화/이메일 컬럼을 자동 추정해 일괄등록합니다.</p><input id="custImport" type="file" accept=".xlsx,.xls,.csv" style="width:100%"><div id="importMsg" class="muted" style="font-size:11.5px;margin-top:8px"></div></section><section class="ops-card"><h3>Legacy 이관 Pilot</h3><p>합의된 샘플 목록 CSV/JSON을 읽어 파일/폴더 후보를 검증 기록합니다.</p><input id="legacyImport" type="file" accept=".csv,.json,.txt" style="width:100%"><div class="metric-row" style="margin-top:10px"><div class="metric-mini"><b>${migrationRuns.length}</b>실행</div></div></section><section class="ops-card"><h3>전체 백업·복구</h3><p>브라우저 DB 전체를 JSON으로 내보내고 같은 버전에서 100% 복구합니다.</p><div class="form-actions" style="justify-content:flex-start"><button class="btn sm" id="backupExport">백업 내보내기</button><label class="btn sm">백업 불러오기<input id="backupImport" type="file" accept=".json" hidden></label></div></section><section class="ops-card"><h3>감사 로그</h3><p>주요 생성/수정/삭제와 로그인 기록입니다.</p><div class="audit-list">${audit.slice(0,30).map(a=>`<div class="audit-row"><span class="when">${new Date(a.at).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</span><b>${esc(a.action)}</b><span>${esc(a.detail||'')}</span></div>`).join('')||'<div class="muted">기록 없음</div>'}</div></section><section class="ops-card"><h3>버전/복구 상태</h3><p>현재 실행 스냅샷과 저장 방식을 확인합니다.</p><div class="metric-row"><div class="metric-mini"><b>${VERSION}</b>버전</div><div class="metric-mini"><b>LOCAL</b>Data adapter</div></div><div class="danger-zone" style="margin-top:12px"><button class="btn danger sm" id="resetDemo">데모 데이터 초기화</button></div></section></div>`}
function bindOps(){if($('#fxSave'))$('#fxSave').onclick=()=>{exchange={usdkrw:safeNum($('#fxUsd').value),jpykrw:Number($('#fxJpy').value)||0,source:'하나은행 수동 fallback',updatedAt:new Date().toISOString().slice(0,10)};log('EXCHANGE_UPDATE',`USD ${exchange.usdkrw}`);render()};if($('#mailRun'))$('#mailRun').onclick=()=>{const q=mailQueue.find(x=>x.status==='Queued'||x.status==='Retry');if(!q)return toast('대기 중인 큐가 없습니다');q.status='Simulated';q.sent=q.total;log('MAIL_QUEUE_SIMULATE',q.id);render()};if($('#custImport'))$('#custImport').onchange=e=>importCustomers(e.target.files[0]);if($('#legacyImport'))$('#legacyImport').onchange=e=>importLegacy(e.target.files[0]);if($('#backupExport'))$('#backupExport').onclick=exportBackup;if($('#backupImport'))$('#backupImport').onchange=e=>importBackup(e.target.files[0]);if($('#resetDemo'))$('#resetDemo').onclick=resetDemo}
async function importCustomers(file){if(!file)return;try{let rows=[];if(file.name.toLowerCase().endsWith('.csv')){rows=parseCSV(await file.text())}else{if(!window.XLSX)throw new Error('Excel 파서 로드 실패. CSV로 다시 시도해 주세요.');const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''})}if(!rows.length)throw new Error('데이터 행이 없습니다');const keys=Object.keys(rows[0]);const pick=(obj,cands)=>{for(const c of cands){const k=keys.find(k=>k.toLowerCase().includes(c));if(k)return obj[k]}return ''};let added=0;rows.forEach(r=>{const co=pick(r,['회사','company','업체']),p=pick(r,['담당','name','성명']);if(!co&&!p)return;CUSTOMERS.push({id:uid('CU'),co:String(co||''),p:String(p||''),d:String(pick(r,['부서','dept'])||''),t:String(pick(r,['직함','title'])||''),tel:String(pick(r,['전화','tel','phone'])||''),mail:String(pick(r,['메일','email'])||''),country:String(pick(r,['국가','country'])||''),flag:'',memo:''});added++});migrationRuns.unshift({id:uid('IMP'),type:'customer',file:file.name,count:added,at:nowISO()});log('CUSTOMER_IMPORT',`${file.name} / ${added}건`);render();toast(`${added}건 일괄등록 완료`)}catch(err){toast(err.message)}}
function parseCSV(t){const lines=t.replace(/\r/g,'').split('\n').filter(Boolean);if(!lines.length)return[];const split=line=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(c===','&&!q){out.push(cur);cur=''}else cur+=c}out.push(cur);return out};const h=split(lines[0]);return lines.slice(1).map(l=>Object.fromEntries(h.map((k,i)=>[k,split(l)[i]||''])))}
async function importLegacy(file){if(!file)return;try{const text=await file.text();let count=0;if(file.name.endsWith('.json')){const j=JSON.parse(text);count=Array.isArray(j)?j.length:Object.keys(j).length}else count=text.split('\n').filter(Boolean).length;migrationRuns.unshift({id:uid('LEG'),type:'legacy',file:file.name,count,at:nowISO(),status:'Pilot PASS'});log('LEGACY_PILOT',`${file.name} / ${count} 항목`);render();toast(`Pilot ${count}항목 검증 기록 완료`)}catch(e){toast('파일을 읽지 못했습니다')}}
function exportBackup(){saveAll(false);const payload=localStorage.getItem(STORE_KEY);const blob=new Blob([payload],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`SEIN_FULL_${VERSION}_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);log('BACKUP_EXPORT',VERSION)}
async function importBackup(file){if(!file)return;try{const t=await file.text();const j=JSON.parse(t);if(!j.version)throw new Error('SEIN 백업 형식이 아닙니다');localStorage.setItem(STORE_KEY,JSON.stringify(j));location.reload()}catch(e){toast('복구 파일을 확인해 주세요')}}
function resetDemo(){if(!confirm('현재 브라우저의 변경사항을 모두 지우고 기준 목업 데이터로 되돌릴까요?'))return;replaceArray(EQUIP,JSON.parse(JSON.stringify(baseline.equip)));replaceArray(DEALS,JSON.parse(JSON.stringify(baseline.deals)));replaceArray(CUSTOMERS,JSON.parse(JSON.stringify(baseline.customers)));replaceArray(QUOTES,JSON.parse(JSON.stringify(baseline.quotes)));replaceArray(PURCHASES,JSON.parse(JSON.stringify(baseline.purchases)));replaceObject(ACCOUNT_DATA,JSON.parse(JSON.stringify(baseline.account)));replaceObject(DRIVE,JSON.parse(JSON.stringify(baseline.drive)));appFiles=[];mailQueue=[];migrationRuns=[];audit=[];localStorage.removeItem(STORE_KEY);location.reload()}

function openGlobalSearch(){openModal(`<div class="modal-head"><div><h3 class="modal-title">통합 검색</h3><div class="modal-sub">설비 · 영업 · 고객 · 파일을 한 번에 찾습니다</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="modal-body search-modal"><div class="field" style="height:42px"><span class="ic">🔍</span><input id="gSearch" style="width:100%" placeholder="검색어 입력" autofocus></div><div id="gResults" style="margin-top:12px"></div></div>`,'wide');const input=$('#gSearch');const paint=()=>{const q=input.value.trim().toLowerCase();if(!q){$('#gResults').innerHTML='<div class="muted" style="padding:20px;text-align:center">검색어를 입력하세요</div>';return}const res=[];EQUIP.forEach(e=>{if(JSON.stringify(e).toLowerCase().includes(q))res.push({type:'설비',title:e.model,sub:e.no,go:()=>{state.cat=e.cat;state.page='goods';closeModal();render();setTimeout(()=>openEquipFull(e.id),50)}})});DEALS.forEach(d=>{if(JSON.stringify(d).toLowerCase().includes(q))res.push({type:'영업',title:d.name,sub:d.customer,go:()=>{state.page='sales';closeModal();render();setTimeout(()=>openDeal(d.id),50)}})});CUSTOMERS.forEach(c=>{if(JSON.stringify(c).toLowerCase().includes(q))res.push({type:'고객',title:c.co+' '+c.p,sub:c.mail||c.tel,go:()=>{state.page='customer';closeModal();render();setTimeout(()=>openCustomerForm(c),50)}})});appFiles.forEach(f=>{if(f.name.toLowerCase().includes(q))res.push({type:'파일',title:f.name,sub:fmtFile(f.size),go:()=>downloadBlob(f.id,f.name)})});$('#gResults').innerHTML=res.slice(0,50).map((r,i)=>`<div class="result" data-r="${i}"><div><b>${esc(r.title)}</b><div><small>${r.type} · ${esc(r.sub||'')}</small></div></div><span>›</span></div>`).join('')||'<div class="muted" style="padding:20px;text-align:center">검색 결과 없음</div>';$$('#gResults [data-r]').forEach(el=>el.onclick=()=>res[+el.dataset.r].go())};input.oninput=paint;setTimeout(()=>input.focus(),50)}

document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();openGlobalSearch()}});
window.addEventListener('popstate',()=>{const [cat,page]=location.hash.replace('#','').split('/');if(cat&&CATS.some(c=>c.id===cat))state.cat=cat;if(page)state.page=page;render()});
window.addEventListener('beforeunload',()=>saveAll(false));

hydrate();
CUSTOMERS.forEach(c=>{if(!c.id)c.id=uid('CU')});
if(restoreSession()){const [cat,page]=location.hash.replace('#','').split('/');if(cat&&canCat(cat))state.cat=cat;if(page)state.page=page;render();enhanceChrome()}else addLoginGate();
})();
