const VERSION='v1.7.0 CRUD SANDBOX';
const STORE_KEY='sein_crud_sandbox_v170';
const LOG_LIMIT=80;
const NAV=[
 ['현황',[['dashboard','대시보드','▦']]],
 ['설비',[['equipment','상품 관리','▣'],['quotes','견적 관리','▤']]],
 ['영업',[['deals','영업 관리','◇'],['customers','고객 관리','♙']]],
 ['관리',[['accounting','회계 관리','▥'],['tax','세금계산서','▤'],['files','자료실','▰']]],
 ['공통 업무',[['calendar','캘린더','▦'],['tags','태그','⌑'],['settings','데이터 / 설정','⚙']]]
];
const SCHEMAS={
 customers:{label:'고객',idPrefix:'C',fields:[
  ['name','회사명','text',true],['contact','담당자','text'],['phone','전화','text'],['email','이메일','email'],['country','국가','text'],['group','그룹','select',false,['VIP','일반','잠재']],['interest','관심품목','text'],['memo','메모','textarea']
 ]},
 equipment:{label:'상품',idPrefix:'E',fields:[
  ['number','설비번호','text',true],['maker','메이커','text'],['model','모델','text'],['status','상태','select',true,['공장','항구 이동','선적 전','선적 후','수입 완료','창고 입고']],['purchasePrice','매입가','number'],['salePrice','판매 희망가','number'],['currency','통화','select',false,['KRW','USD','JPY']],['memo','메모','textarea']
 ]},
 deals:{label:'영업',idPrefix:'D',fields:[
  ['title','영업명','text',true],['customer','고객사','text'],['equipment','설비','text'],['stage','단계','select',true,['문의','제안','협상','확정','보류','실패']],['purchasePrice','매입가','number'],['salePrice','판매가','number'],['owner','담당자','text'],['memo','메모','textarea']
 ]},
 quotes:{label:'견적',idPrefix:'Q',fields:[
  ['quoteNo','견적번호','text',true],['customer','고객사','text'],['equipment','설비','text'],['amount','금액','number'],['currency','통화','select',false,['KRW','USD','JPY']],['status','상태','select',true,['초안','발송','승인','거절']],['validUntil','유효일','date'],['memo','메모','textarea']
 ]},
 accounting:{label:'회계 거래',idPrefix:'A',fields:[
  ['date','일자','date',true],['type','구분','select',true,['입금','출금']],['account','계좌','text'],['description','적요','text',true],['amount','금액','number',true],['category','분류','select',false,['판매','매입','운송','임대','사무','기타']],['memo','메모','textarea']
 ]},
 calendar:{label:'일정',idPrefix:'EV',fields:[
  ['date','날짜','date',true],['time','시간','time'],['title','일정명','text',true],['type','종류','select',false,['영업','미팅','물류','내부','기타']],['owner','담당자','text'],['memo','메모','textarea']
 ]},
 tax:{label:'세금계산서',idPrefix:'T',fields:[
  ['date','발행일','date',true],['customer','거래처','text',true],['amount','공급가액','number',true],['vat','부가세','number'],['status','상태','select',false,['작성중','발행','취소']],['memo','메모','textarea']
 ]},
 files:{label:'자료',idPrefix:'F',fields:[
  ['name','파일명/자료명','text',true],['folder','폴더','text'],['type','종류','select',false,['문서','도면','사진','계약','기타']],['url','링크','text'],['memo','메모','textarea']
 ]},
 tags:{label:'태그',idPrefix:'TAG',fields:[['name','태그명','text',true],['color','색상 메모','text'],['memo','설명','textarea']]}
};
const today=()=>new Date().toISOString().slice(0,10);
const money=n=>Number(n||0).toLocaleString('ko-KR')+'원';
const num=n=>Number(n||0).toLocaleString('ko-KR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>(p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)).toUpperCase();
const clone=x=>JSON.parse(JSON.stringify(x));
function seed(){return {
 meta:{version:VERSION,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
 customers:[
  {id:'C-001',name:'한빛테크',contact:'김성우',phone:'010-2345-1101',email:'sw.kim@example.com',country:'한국',group:'VIP',interest:'프레스',memo:'10월 설비 교체 검토'},
  {id:'C-002',name:'Nori Machinery',contact:'Yuki Sato',phone:'+81-3-5550-1102',email:'y.sato@example.com',country:'일본',group:'일반',interest:'자동화 라인',memo:'영문 견적 선호'},
  {id:'C-003',name:'Pacific Engineering',contact:'Amy Chen',phone:'+886-2-5550-1103',email:'amy@example.com',country:'대만',group:'잠재',interest:'중고 설비',memo:'사진 자료 요청'}
 ],
 equipment:[
  {id:'E-001',number:'SEIN-2601',maker:'AIDA',model:'NC1-110',status:'창고 입고',purchasePrice:28000000,salePrice:39000000,currency:'KRW',memo:'점검 완료'},
  {id:'E-002',number:'SEIN-2602',maker:'AMADA',model:'HFE-80',status:'선적 전',purchasePrice:21000000,salePrice:31000000,currency:'KRW',memo:'선적 일정 확인 필요'},
  {id:'E-003',number:'SEIN-2603',maker:'KOMATSU',model:'OBS-80',status:'공장',purchasePrice:18000000,salePrice:27000000,currency:'KRW',memo:'추가 사진 예정'}
 ],
 deals:[
  {id:'D-001',title:'한빛 프레스 판매',customer:'한빛테크',equipment:'SEIN-2601',stage:'협상',purchasePrice:28000000,salePrice:39000000,owner:'권지연',memo:'최종 가격 협의'},
  {id:'D-002',title:'Nori 절곡기 제안',customer:'Nori Machinery',equipment:'SEIN-2602',stage:'제안',purchasePrice:21000000,salePrice:31000000,owner:'홍영준',memo:'영문 견적 발송'}
 ],
 quotes:[
  {id:'Q-001',quoteNo:'Q-2026-1001',customer:'한빛테크',equipment:'SEIN-2601',amount:39000000,currency:'KRW',status:'발송',validUntil:'2026-10-15',memo:''},
  {id:'Q-002',quoteNo:'Q-2026-1002',customer:'Nori Machinery',equipment:'SEIN-2602',amount:31000000,currency:'KRW',status:'초안',validUntil:'2026-10-20',memo:'영문 버전'}
 ],
 accounting:[
  {id:'A-001',date:'2026-09-03',type:'입금',account:'운영 계좌',description:'설비 계약금',amount:12000000,category:'판매',memo:''},
  {id:'A-002',date:'2026-09-07',type:'출금',account:'운영 계좌',description:'국내 운송비',amount:1250000,category:'운송',memo:''},
  {id:'A-003',date:'2026-09-29',type:'출금',account:'소액 현금',description:'사무용품',amount:28500,category:'사무',memo:''}
 ],
 calendar:[
  {id:'EV-001',date:'2026-10-01',time:'15:00',title:'한빛테크 견적 확인',type:'영업',owner:'권지연',memo:''},
  {id:'EV-002',date:'2026-10-02',time:'11:00',title:'SEIN-2602 선적 일정 확인',type:'물류',owner:'운영팀',memo:''}
 ],
 tax:[{id:'T-001',date:'2026-09-30',customer:'샘플 거래처',amount:5000000,vat:500000,status:'작성중',memo:'더미 데이터'}],
 files:[{id:'F-001',name:'SEIN-2601_사양서.pdf',folder:'설비자료',type:'문서',url:'',memo:'더미 메타데이터'}],
 tags:[{id:'TAG-001',name:'확인 필요',color:'amber',memo:''},{id:'TAG-002',name:'견적 요청',color:'violet',memo:''},{id:'TAG-003',name:'물류',color:'green',memo:''}],
 logs:[{id:uid('L'),at:new Date().toISOString(),text:'CRUD Sandbox 초기 더미 데이터 생성'}]
};}
let db=load(); let page=new URLSearchParams(location.search).get('page')||'dashboard'; let search='';
function load(){try{const x=JSON.parse(localStorage.getItem(STORE_KEY)||'null');return x&&x.meta?x:seed()}catch{return seed()}}
function save(msg){db.meta.updatedAt=new Date().toISOString();if(msg){db.logs.unshift({id:uid('L'),at:new Date().toISOString(),text:msg});db.logs=db.logs.slice(0,LOG_LIMIT)}localStorage.setItem(STORE_KEY,JSON.stringify(db));}
function reset(){db=seed();save('전체 더미 데이터 초기화');render();toast('초기 더미 데이터로 복원했습니다.')}
function count(k){return Array.isArray(db[k])?db[k].length:0}
function label(k){return NAV.flatMap(x=>x[1]).find(x=>x[0]===k)?.[1]||k}
function shell(content){return `<header class="top"><div class="brand"><button class="btn icon mobile" id="menuBtn">☰</button><span class="mark">SEIN</span><span><b>세인코퍼레이션</b><small>CRUD Sandbox</small></span></div><div class="topfill"></div><span class="version">${VERSION}</span><div class="top-actions"><button class="btn sm mobile-keep" id="exportTop">JSON 내보내기</button><button class="btn sm" id="importTop">JSON 가져오기</button><button class="btn sm" id="resetTop">초기화</button></div></header><div class="shell"><aside class="side" id="side"><div class="workspace">● 브라우저 로컬 데이터<b>공유 가능한 더미 환경</b></div>${NAV.map(([g,items])=>`<div class="navgroup"><h4>${g}</h4>${items.map(([k,l,i])=>`<button class="nav ${page===k?'on':''}" data-page="${k}"><span class="ico">${i}</span><span>${l}</span>${SCHEMAS[k]?`<span class="count">${count(k)}</span>`:''}</button>`).join('')}</div>`).join('')}</aside><main class="main"><div class="crumb">SEIN › ${label(page)}</div>${content}</main></div><input class="filebox" id="importFile" type="file" accept="application/json,.json">`}
function head(t,d,actions=''){return `<div class="pagehead"><div><h1>${t}</h1><p>${d}</p></div><div class="actions">${actions}</div></div>`}
function dashboard(){const income=db.accounting.filter(x=>x.type==='입금').reduce((s,x)=>s+Number(x.amount||0),0),expense=db.accounting.filter(x=>x.type==='출금').reduce((s,x)=>s+Number(x.amount||0),0),wonDeals=db.deals.filter(x=>x.stage==='확정'),dealProfit=wonDeals.reduce((s,x)=>s+(Number(x.salePrice||0)-Number(x.purchasePrice||0)),0),activeDeals=db.deals.filter(x=>!['확정','실패','보류'].includes(x.stage)),todayEvents=db.calendar.filter(x=>x.date===today());return head('대시보드','CRUD 데이터가 즉시 집계되는 타일형 더미 운영 화면',`<button class="btn primary" data-page="customers">+ 고객 등록</button>`)+`<div class="notice"><b>CRUD SANDBOX</b> · 이 화면의 숫자는 고정 문구가 아니라 브라우저 저장 데이터에서 실시간 계산됩니다.</div><div class="tileboard"><section class="tile span3"><span class="eyebrow">고객</span><strong class="big">${count('customers')}<small>개사</small></strong><p>등록된 더미 고객</p></section><section class="tile span3"><span class="eyebrow">상품</span><strong class="big">${count('equipment')}<small>대</small></strong><p>관리 중 설비</p></section><section class="tile span3"><span class="eyebrow">진행 영업</span><strong class="big">${activeDeals.length}<small>건</small></strong><p>확정/실패/보류 제외</p></section><section class="tile span3"><span class="eyebrow">확정 수익</span><strong class="big">${money(dealProfit)}</strong><p>확정 영업 판매가 - 매입가</p></section><section class="tile span8"><div class="tilehead"><div><b>재무 요약</b><small>회계 CRUD에서 자동 집계</small></div><button class="btn sm" data-page="accounting">회계 관리 →</button></div><div class="metric-row"><div class="metric"><span>입금</span><strong>${money(income)}</strong></div><div class="metric"><span>출금</span><strong>${money(expense)}</strong></div><div class="metric"><span>잔액 차이</span><strong>${money(income-expense)}</strong></div><div class="metric"><span>거래 수</span><strong>${count('accounting')}건</strong></div></div></section><section class="tile span4"><div class="tilehead"><div><b>오늘 일정</b><small>${today()}</small></div><button class="btn sm" data-page="calendar">캘린더 →</button></div>${todayEvents.length?todayEvents.map(e=>`<div class="timeline-item"><i></i><div><b>${esc(e.time||'종일')} · ${esc(e.title)}</b><small>${esc(e.owner||'담당자 없음')}</small></div></div>`).join(''):`<div class="empty"><b>오늘 일정 없음</b>일정을 추가하면 여기에 표시됩니다.</div>`}</section><section class="tile span6"><div class="tilehead"><div><b>진행 영업</b><small>최근 5건</small></div><button class="btn sm" data-page="deals">영업 관리 →</button></div>${activeDeals.slice(0,5).map(d=>`<div class="timeline-item"><i></i><div><b>${esc(d.title)}</b><small>${esc(d.customer)} · ${esc(d.stage)} · ${money(d.salePrice)}</small></div></div>`).join('')||`<div class="empty"><b>진행 영업 없음</b></div>`}</section><section class="tile span6"><div class="tilehead"><div><b>최근 변경</b><small>CRUD 작업 로그</small></div></div><div class="timeline">${db.logs.slice(0,6).map(l=>`<div class="timeline-item"><i></i><div>${esc(l.text)}<small>${new Date(l.at).toLocaleString('ko-KR')}</small></div></div>`).join('')}</div></section></div>`}
function listPage(key){const s=SCHEMAS[key],rows=(db[key]||[]).filter(r=>!search||Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase()));return head(label(key),`${s.label} 데이터를 직접 추가·조회·수정·삭제할 수 있습니다.`,`<button class="btn primary" data-add="${key}">+ ${s.label} 추가</button>`)+`<div class="panel"><div class="toolbar"><input id="search" type="search" placeholder="검색" value="${esc(search)}"><span class="badge green">${rows.length}건</span></div>${rows.length?renderTable(key,rows):`<div class="empty"><b>데이터가 없습니다.</b>오른쪽 위 추가 버튼으로 더미 데이터를 만들어보세요.</div>`}</div>`}
function renderTable(key,rows){const cols=tableCols(key);return `<div class="tablewrap"><table><thead><tr>${cols.map(c=>`<th>${esc(c[1])}</th>`).join('')}<th>작업</th></tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${formatCell(c[0],r[c[0]],key)}</td>`).join('')}<td><div class="row-actions"><button class="btn sm" data-edit="${key}" data-id="${r.id}">수정</button><button class="btn sm danger" data-delete="${key}" data-id="${r.id}">삭제</button></div></td></tr>`).join('')}</tbody></table></div>`}
function tableCols(key){const maps={customers:[['name','회사명'],['contact','담당자'],['country','국가'],['group','그룹'],['interest','관심품목']],equipment:[['number','설비번호'],['maker','메이커'],['model','모델'],['status','상태'],['salePrice','판매 희망가']],deals:[['title','영업명'],['customer','고객사'],['equipment','설비'],['stage','단계'],['salePrice','판매가']],quotes:[['quoteNo','견적번호'],['customer','고객사'],['equipment','설비'],['amount','금액'],['status','상태']],accounting:[['date','일자'],['type','구분'],['account','계좌'],['description','적요'],['amount','금액']],calendar:[['date','날짜'],['time','시간'],['title','일정명'],['type','종류'],['owner','담당자']],tax:[['date','발행일'],['customer','거래처'],['amount','공급가액'],['vat','부가세'],['status','상태']],files:[['name','자료명'],['folder','폴더'],['type','종류'],['url','링크']],tags:[['name','태그명'],['color','색상 메모'],['memo','설명']]};return maps[key]||[]}
function formatCell(k,v,key){if(['amount','purchasePrice','salePrice','vat'].includes(k))return money(v);if(k==='stage'||k==='status'||k==='type'||k==='group')return `<span class="badge ${badgeTone(v)}">${esc(v||'—')}</span>`;if(k==='url'&&v)return `<span class="mono">${esc(v)}</span>`;return esc(v||'—')}
function badgeTone(v){if(['확정','입금','발행','VIP','창고 입고'].includes(v))return'green';if(['협상','작성중','출금','발송','선적 전'].includes(v))return'amber';if(['실패','취소','거절'].includes(v))return'red';return'violet'}
function settings(){const size=new Blob([JSON.stringify(db)]).size;return head('데이터 / 설정','공유·백업·초기화를 위한 휴대형 더미 데이터 관리')+`<div class="settings-grid"><section class="setting-card"><h3>JSON 내보내기</h3><p>현재 CRUD 상태를 하나의 JSON 파일로 저장합니다. 다른 사람에게 ZIP과 함께 전달하면 같은 상태를 재현할 수 있습니다.</p><button class="btn primary" id="exportData">데이터 내보내기</button></section><section class="setting-card"><h3>JSON 가져오기</h3><p>다른 브라우저에서 내보낸 데이터를 현재 브라우저에 불러옵니다. 기존 데이터는 가져온 상태로 교체됩니다.</p><button class="btn" id="importData">데이터 가져오기</button></section><section class="setting-card"><h3>초기화</h3><p>모든 CRUD 변경을 지우고 패키지에 포함된 기본 더미 데이터로 되돌립니다.</p><button class="btn danger" id="resetData">초기화</button></section><section class="setting-card"><h3>현재 저장 상태</h3><p><span class="mono">localStorage</span> 키: <code>${STORE_KEY}</code><br>저장 크기: 약 ${(size/1024).toFixed(1)} KB<br>마지막 변경: ${new Date(db.meta.updatedAt).toLocaleString('ko-KR')}</p></section></div>`}
function render(){const content=page==='dashboard'?dashboard():page==='settings'?settings():SCHEMAS[page]?listPage(page):dashboard();document.querySelector('#app').innerHTML=shell(content);bind()}
function bind(){document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page;search='';history.replaceState(null,'',`?page=${page}`);render()});document.querySelector('#menuBtn')?.addEventListener('click',()=>document.querySelector('#side').classList.toggle('open'));document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>openForm(b.dataset.add));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openForm(b.dataset.edit,b.dataset.id));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeRow(b.dataset.delete,b.dataset.id));document.querySelector('#search')?.addEventListener('input',e=>{search=e.target.value;render()});document.querySelector('#exportTop')?.addEventListener('click',exportData);document.querySelector('#exportData')?.addEventListener('click',exportData);document.querySelector('#importTop')?.addEventListener('click',()=>document.querySelector('#importFile').click());document.querySelector('#importData')?.addEventListener('click',()=>document.querySelector('#importFile').click());document.querySelector('#resetTop')?.addEventListener('click',()=>confirmReset());document.querySelector('#resetData')?.addEventListener('click',()=>confirmReset());document.querySelector('#importFile')?.addEventListener('change',importData)}
function openForm(key,id){const s=SCHEMAS[key],row=id?db[key].find(x=>x.id===id):{};const back=document.createElement('div');back.className='modalback';back.innerHTML=`<form class="modal" id="crudForm"><div class="modalhead"><h3>${id?'수정':'추가'} · ${s.label}</h3><button type="button" class="btn sm" id="closeModal">닫기</button></div><div class="modalbody"><div class="formgrid">${s.fields.map(f=>fieldHtml(f,row[f[0]])).join('')}</div></div><div class="modalfoot"><button type="button" class="btn" id="cancelModal">취소</button><button class="btn primary" type="submit">${id?'변경 저장':'등록'}</button></div></form>`;document.body.appendChild(back);const close=()=>back.remove();back.querySelector('#closeModal').onclick=close;back.querySelector('#cancelModal').onclick=close;back.onclick=e=>{if(e.target===back)close()};back.querySelector('#crudForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),data={};s.fields.forEach(([k,,type])=>{let v=fd.get(k)||'';if(type==='number')v=Number(v||0);data[k]=v});if(id){Object.assign(row,data);save(`${s.label} 수정 · ${displayName(key,row)}`)}else{data.id=uid(s.idPrefix);db[key].unshift(data);save(`${s.label} 추가 · ${displayName(key,data)}`)}close();render();toast(id?'수정했습니다.':'추가했습니다.')};setTimeout(()=>back.querySelector('input,select,textarea')?.focus(),20)}
function fieldHtml(f,v){const [k,l,type,req,opts]=f;const full=type==='textarea'?' full':'';if(type==='select')return `<div class="field${full}"><label>${l}</label><select name="${k}" ${req?'required':''}><option value="">선택</option>${opts.map(o=>`<option value="${esc(o)}" ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;if(type==='textarea')return `<div class="field full"><label>${l}</label><textarea name="${k}" ${req?'required':''}>${esc(v||'')}</textarea></div>`;return `<div class="field${full}"><label>${l}</label><input name="${k}" type="${type}" value="${esc(v??'')}" ${req?'required':''}></div>`}
function displayName(key,r){return r.name||r.title||r.number||r.quoteNo||r.description||r.customer||r.id}
function removeRow(key,id){const s=SCHEMAS[key],row=db[key].find(x=>x.id===id);if(!row)return;if(!confirm(`${s.label} '${displayName(key,row)}' 항목을 삭제할까요?`))return;db[key]=db[key].filter(x=>x.id!==id);save(`${s.label} 삭제 · ${displayName(key,row)}`);render();toast('삭제했습니다.')}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`SEIN_CRUD_DATA_${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),300);toast('JSON 데이터 파일을 만들었습니다.')}
function importData(e){const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const x=JSON.parse(rd.result);const must=['customers','equipment','deals','quotes','accounting','calendar'];if(!x.meta||!must.every(k=>Array.isArray(x[k])))throw Error('invalid');db=x;save('JSON 데이터 가져오기');render();toast('데이터를 가져왔습니다.')}catch{toast('올바른 SEIN CRUD JSON 파일이 아닙니다.',true)}finally{e.target.value=''}};rd.readAsText(f)}
function confirmReset(){if(confirm('모든 CRUD 변경을 지우고 기본 더미 데이터로 초기화할까요?'))reset()}
function toast(msg,error=false){document.querySelector('.toast')?.remove();const d=document.createElement('div');d.className='toast'+(error?' error':'');d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function selfTest(){const out=document.querySelector('#selftest');try{const original=clone(db);const c0=count('customers');const tmp={id:uid('C'),name:'SELFTEST',contact:'Tester',phone:'',email:'',country:'한국',group:'일반',interest:'',memo:''};db.customers.unshift(tmp);if(count('customers')!==c0+1)throw Error('create');tmp.name='SELFTEST-UPDATED';if(db.customers[0].name!=='SELFTEST-UPDATED')throw Error('update');db.customers=db.customers.filter(x=>x.id!==tmp.id);if(count('customers')!==c0)throw Error('delete');db=original;out.hidden=false;out.textContent='CRUD_SELFTEST_PASS';out.dataset.result='PASS';render()}catch(e){out.hidden=false;out.textContent='CRUD_SELFTEST_FAIL:'+e.message;out.dataset.result='FAIL'}}
render();if(new URLSearchParams(location.search).get('selftest')==='1')selfTest();