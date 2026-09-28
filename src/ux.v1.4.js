/* SEIN UX v1.4 base — flow toggle + verified market FX snapshot */
(function(){
'use strict';
const S=window.SEIN_INTERNAL,V=window.SEIN_V12;if(!S)return;
const FX={
  usdkrw:1357.75,
  jpykrw:8.61248,
  jpy100krw:861.248,
  source:'시장 실환율 스냅샷',
  updatedAt:'2026-09-28 09:08 KST',
  market:true
};
const FLOW_KEY='sein.ux.flowCollapsed';
function applyFX(){
  S.setExchange(FX);S.saveAll(false);
  document.querySelectorAll('.kpi').forEach(card=>{
    const label=card.querySelector('.k-label');
    if(!label||!/(하나은행 환율|환율 연동 상태)/.test(label.textContent))return;
    label.textContent='환율 연동 상태';
    const value=card.querySelector('.k-value');
    const delta=card.querySelector('.k-delta');
    if(value)value.innerHTML='<span class="fx-live-dot"></span> USD '+FX.usdkrw.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2})+'원';
    if(delta)delta.innerHTML='100 JPY '+FX.jpy100krw.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2})+'원 · <b>실환율</b><br><small>'+FX.updatedAt+'</small>';
    card.classList.add('fx-live-card');
  });
  const ops=[...document.querySelectorAll('.ops-card')].find(x=>/Hana FX Mock Adapter|환율/.test(x.textContent));
  if(ops&&!ops.querySelector('.fx-market-note')){
    const note=document.createElement('div');note.className='fx-market-note';
    note.innerHTML='<b>현재 표시값</b><span>USD/KRW '+FX.usdkrw.toFixed(2)+' · 100 JPY/KRW '+FX.jpy100krw.toFixed(2)+'</span><small>'+FX.updatedAt+' 시장환율 스냅샷</small>';
    ops.appendChild(note);
  }
}
function flowToggle(){
  const flow=document.querySelector('.ux-flow');if(!flow)return;
  let btn=flow.querySelector('[data-flow-toggle]');
  if(!btn){
    const head=flow.querySelector('.ux-flow-head');if(!head)return;
    let actions=head.querySelector('.ux-flow-head-actions');
    const search=head.querySelector('[data-ux="search"]');
    if(!actions){actions=document.createElement('div');actions.className='ux-flow-head-actions';if(search)actions.appendChild(search);head.appendChild(actions)}
    btn=document.createElement('button');btn.className='btn sm';btn.dataset.flowToggle='1';actions.appendChild(btn);
    btn.onclick=()=>{const collapsed=!flow.classList.contains('is-collapsed');flow.classList.toggle('is-collapsed',collapsed);localStorage.setItem(FLOW_KEY,collapsed?'1':'0');syncFlowButton(flow,btn)};
  }
  flow.classList.toggle('is-collapsed',localStorage.getItem(FLOW_KEY)==='1');
  syncFlowButton(flow,btn);
}
function syncFlowButton(flow,btn){
  const c=flow.classList.contains('is-collapsed');
  btn.textContent=c?'펼치기 ▾':'접기 ▴';btn.setAttribute('aria-expanded',String(!c));btn.setAttribute('aria-label','업무 흐름 '+(c?'펼치기':'접기'));
}
function enhance(){flowToggle();applyFX();enhanceMobileMore();enhanceKeyboardHints();enhanceAttention();enhanceTables();observeModalValidation();enhanceStatusA11y();observeSaveStatus();enhanceSearchFeedback()}
const mo=new MutationObserver(()=>requestAnimationFrame(enhance));
const start=()=>{restoreUIPrefs();enhance();const main=document.getElementById('main');if(main)mo.observe(main,{childList:true,subtree:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

/* UX iteration 1/10 — mobile More navigation */
function ux14Go(page,cat){
  if(cat)state.cat=cat;
  if(page)state.page=page;
  history.pushState({cat:state.cat,page:state.page},'',`#${state.cat}/${state.page}`);
  S.render();
}
function closeMoreSheet(){document.querySelector('.ux14-more-sheet')?.remove();document.querySelector('.ux14-more-backdrop')?.remove()}
function openMoreSheet(){
  closeMoreSheet();
  const back=document.createElement('div');back.className='ux14-more-backdrop';back.onclick=closeMoreSheet;
  const sheet=document.createElement('aside');sheet.className='ux14-more-sheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','더보기 메뉴');
  const admin=V&&V.isAdmin&&V.isAdmin();
  const items=[
    ['quote','견적 관리',state.cat],
    ['files','자료실',state.cat],
    ['calendar','캘린더','calendar'],
    ...(admin?[['account','회계 관리','used'],['ops','운영 도구','used']]:[])
  ];
  sheet.innerHTML='<div class="ux14-sheet-handle"></div><div class="ux14-sheet-head"><b>더보기</b><button class="x" data-more-close>✕</button></div><div class="ux14-sheet-grid">'+
    items.map(x=>'<button data-more-page="'+x[0]+'" data-more-cat="'+x[2]+'">'+x[1]+'<span>›</span></button>').join('')+'</div>';
  document.body.append(back,sheet);
  sheet.querySelector('[data-more-close]').onclick=closeMoreSheet;
  sheet.querySelectorAll('[data-more-page]').forEach(b=>b.onclick=()=>{const p=b.dataset.morePage,c=b.dataset.moreCat;closeMoreSheet();ux14Go(p,c)});
}
function enhanceMobileMore(){
  const bar=document.querySelector('.mobile-bottom');if(!bar||!window.matchMedia('(max-width:820px)').matches)return;
  if(!bar.querySelector('[data-more-nav]')){
    const b=document.createElement('button');b.dataset.moreNav='1';b.textContent='더보기';b.onclick=openMoreSheet;bar.appendChild(b);
    bar.style.gridTemplateColumns='repeat(5,1fr)';
  }
}


/* UX iteration 2/10 — keyboard and dismiss ergonomics */
function enhanceKeyboardHints(){
  const q=document.getElementById('quickFind');
  if(q){q.setAttribute('aria-keyshortcuts','Control+K Meta+K /');q.title='통합 검색 · Ctrl/Cmd+K 또는 /';}
}
document.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&key==='k'){
    e.preventDefault();document.getElementById('quickFind')?.click();return;
  }
  if(e.key==='Escape'){
    if(document.querySelector('.ux14-more-sheet')){closeMoreSheet();return;}
    const next=document.querySelector('.ux-next');if(next){next.remove();return;}
    const overlay=document.getElementById('overlay');if(overlay?.classList.contains('open')){S.closeModal();return;}
  }
},true);


/* UX iteration 3/10 — attention / next-work panel */
function attentionData(){
  const eqs=typeof EQUIP!=='undefined'?EQUIP:[];
  const deals=(typeof DEALS!=='undefined'?DEALS:[]).filter(d=>(d.equips||[]).some(id=>eqs.find(e=>e.id===id)?.cat===state.cat)&&d.status!=='확정');
  const blocked=(typeof CUSTOMERS!=='undefined'?CUSTOMERS:[]).filter(c=>c.flag==='block'||!c.mail);
  const now=new Date(),limit=new Date(now);limit.setDate(limit.getDate()+7);
  const events=(typeof calendarEvents!=='undefined'?calendarEvents:[]).filter(e=>{const d=new Date(e.date+'T23:59:59');return d>=new Date(now.toDateString())&&d<=limit}).sort((a,b)=>a.date.localeCompare(b.date));
  return {deals,blocked,events};
}
function enhanceAttention(){
  const main=document.getElementById('main');if(!main)return;
  const title=main.querySelector('.page-title')?.textContent||'';
  if(!title.includes('대시보드'))return;
  if(main.querySelector('.ux14-attention'))return;
  const d=attentionData(),sec=document.createElement('section');sec.className='ux14-attention';
  const tasks=[];
  if(d.deals.length)tasks.push({n:d.deals.length,label:'진행 영업',sub:'후속 확인이 필요한 영업건',page:'sales',cat:state.cat});
  if(d.blocked.length)tasks.push({n:d.blocked.length,label:'발송 확인',sub:'송신금지·이메일 미등록 고객',page:'customer',cat:state.cat});
  if(d.events.length)tasks.push({n:d.events.length,label:'7일 내 일정',sub:d.events[0].date+' · '+d.events[0].title,page:'calendar',cat:'calendar'});
  sec.innerHTML='<div class="ux14-attention-head"><div><small>FOCUS</small><h3>오늘 할 일</h3></div><span class="muted">'+(tasks.length?'우선 확인할 업무 '+tasks.length+'개':'급한 항목 없음')+'</span></div>'+
    '<div class="ux14-attention-grid">'+(tasks.length?tasks.map(t=>'<button data-attention-page="'+t.page+'" data-attention-cat="'+t.cat+'"><b>'+t.n+'</b><span>'+t.label+'</span><small>'+t.sub+'</small><i>›</i></button>').join(''):'<div class="ux14-all-clear"><b>정리된 상태입니다</b><span>새 일정이나 영업건이 생기면 여기에 자동으로 표시됩니다.</span></div>')+'</div>';
  const flow=main.querySelector('.ux-flow');if(flow)flow.after(sec);else main.prepend(sec);
  sec.querySelectorAll('[data-attention-page]').forEach(b=>b.onclick=()=>ux14Go(b.dataset.attentionPage,b.dataset.attentionCat));
}


/* UX iteration 4/10 — remember working context */
const PREF_KEY='sein.ux.prefs.v1.4';
let prefsApplied=false;
function saveUIPrefs(){
  try{
    localStorage.setItem(PREF_KEY,JSON.stringify({
      goodsView:state.goodsView,goodsFilter:state.goodsFilter,photoStage:state.photoStage,
      accountView:state.accountView,sheetYear:state.sheetYear,calYear:state.calYear,calMonth:state.calMonth
    }));
  }catch(_e){}
}
function restoreUIPrefs(){
  if(prefsApplied)return;prefsApplied=true;
  try{
    const p=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
    ['goodsView','goodsFilter','photoStage','accountView','sheetYear','calYear','calMonth'].forEach(k=>{if(p[k]!==undefined&&p[k]!==null)state[k]=p[k]});
    S.render();
  }catch(_e){}
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-view],[data-stage],[data-av],[data-year],#calPrev,#calNext'))setTimeout(saveUIPrefs,0);
},true);
window.addEventListener('beforeunload',saveUIPrefs);


/* UX iteration 5/10 — table overflow affordance */
function enhanceTables(){
  document.querySelectorAll('.tbl-wrap').forEach(w=>{
    w.setAttribute('tabindex','0');w.setAttribute('role','region');w.setAttribute('aria-label','데이터 표 · 가로 스크롤 가능');
    const overflow=w.scrollWidth>w.clientWidth+4;
    w.classList.toggle('is-scrollable',overflow);
    const prev=w.previousElementSibling;
    if(overflow&&(!prev||!prev.classList.contains('ux14-scroll-hint'))){
      const h=document.createElement('div');h.className='ux14-scroll-hint';h.innerHTML='<span>↔</span> 좌우로 밀어 더 보기';w.before(h);
    }else if(!overflow&&prev&&prev.classList.contains('ux14-scroll-hint'))prev.remove();
  });
}


/* UX iteration 6/10 — inline required-field validation */
const FORM_RULES=[
  {button:'#efSave',fields:['#efModel','#efNo']},
  {button:'#cfSave',fields:['#cfCo','#cfP']},
  {button:'#dSave',fields:['#dName'],extra:()=>!!document.querySelector('.dealEq:checked')},
  {button:'#qSave',fields:['#qAmt'],extra:()=>Number(document.querySelector('#qAmt')?.value||0)>0},
  {button:'#evSave',fields:['#evTitle']},
  {button:'#ldSave',fields:['#ldDate','#ldAmount'],extra:()=>Number(document.querySelector('#ldAmount')?.value||0)>0},
  {button:'#dySave',fields:['#dyDate']},
  {button:'#folderSave',fields:['#folderName']},
  {button:'#miSave',fields:['#miName']},
  {button:'#yearSave',fields:['#yearValue']}
];
function setupModalValidation(){
  const modal=document.querySelector('#modal');if(!modal)return;
  const rule=FORM_RULES.find(r=>modal.querySelector(r.button));if(!rule)return;
  const btn=modal.querySelector(rule.button);if(!btn)return;
  const fields=rule.fields.map(s=>modal.querySelector(s)).filter(Boolean);
  fields.forEach(f=>{
    f.required=true;f.setAttribute('aria-required','true');
    const label=f.closest('.f')?.querySelector('label');
    if(label&&!label.querySelector('.ux14-req')){const s=document.createElement('span');s.className='ux14-req';s.textContent=' *';label.appendChild(s)}
  });
  let hint=modal.querySelector('.ux14-form-hint');
  if(!hint){hint=document.createElement('span');hint.className='ux14-form-hint';modal.querySelector('.modal-foot')?.prepend(hint)}
  const valid=()=>fields.every(f=>String(f.value||'').trim()!=='')&&(!rule.extra||rule.extra());
  const paint=()=>{
    const ok=valid();btn.disabled=!ok;btn.setAttribute('aria-disabled',String(!ok));
    if(hint){hint.textContent=ok?'필수 항목 입력 완료':'* 필수 항목을 입력해 주세요';hint.classList.toggle('ok',ok)}
  };
  fields.forEach(f=>{
    f.addEventListener('input',paint);f.addEventListener('change',paint);
    f.addEventListener('blur',()=>f.classList.toggle('ux14-invalid',String(f.value||'').trim()===''));
  });
  modal.querySelectorAll('input[type="checkbox"],select').forEach(x=>x.addEventListener('change',paint));
  paint();
}
function observeModalValidation(){
  const overlay=document.getElementById('overlay');if(!overlay||overlay.dataset.ux14Validation)return;
  overlay.dataset.ux14Validation='1';new MutationObserver(()=>setTimeout(setupModalValidation,0)).observe(overlay,{childList:true,subtree:true});
}


/* UX iteration 7/10 — accessible status feedback */
function enhanceStatusA11y(){
  const toast=document.getElementById('toast');if(toast){toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true')}
  const save=document.querySelector('.save-indicator');if(save){save.setAttribute('role','status');save.setAttribute('aria-live','polite');save.title='마지막 상태: '+save.textContent}
  const next=document.querySelector('.ux-next');if(next){next.setAttribute('role','status');next.setAttribute('aria-live','polite');next.setAttribute('aria-atomic','true')}
  document.querySelectorAll('button:not([type])').forEach(b=>b.type='button');
}
function observeSaveStatus(){
  const save=document.querySelector('.save-indicator');if(!save||save.dataset.ux14Observed)return;
  save.dataset.ux14Observed='1';
  new MutationObserver(()=>{save.title='마지막 상태: '+save.textContent+' · '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}).observe(save,{childList:true,characterData:true,subtree:true});
}


/* UX iteration 8/10 — search result feedback and recovery */
function ensureCount(input,selector){
  if(!input||input.dataset.ux14Count)return;input.dataset.ux14Count='1';
  let out=document.createElement('span');out.className='ux14-result-count';input.closest('.field')?.after(out);
  const paint=()=>setTimeout(()=>{const els=[...document.querySelectorAll(selector)],visible=els.filter(x=>getComputedStyle(x).display!=='none');out.textContent=input.value.trim()?visible.length+'건 표시':'전체 '+els.length+'건'},0);
  input.addEventListener('input',paint);paint();
}
function enhanceSearchFeedback(){
  ensureCount(document.querySelector('#goodsSearch'),'.eq-grid .eq,table.tbl tbody tr[data-eq]');
  ensureCount(document.querySelector('#customerSearch'),'#main tbody tr');
  const g=document.querySelector('#gSearch');
  if(g&&!g.dataset.ux14Count){
    g.dataset.ux14Count='1';
    g.addEventListener('input',()=>setTimeout(()=>{
      const box=document.querySelector('#gResults');if(!box)return;
      box.querySelector('.ux14-search-meta')?.remove();
      const n=box.querySelectorAll('.result').length,meta=document.createElement('div');meta.className='ux14-search-meta';
      meta.textContent=g.value.trim()?(n?n+'건 찾음':'검색 결과가 없습니다 · 모델명, 회사명, 파일명처럼 핵심어만 입력해 보세요'):'설비 · 영업 · 고객 · 파일 통합검색';
      box.prepend(meta);
    },0));
  }
  if(state.page==='goods'&&state.goodsFilter&&state.goodsFilter!=='all'){
    const empty=document.querySelector('#main .empty');
    if(empty&&!empty.querySelector('[data-reset-stage]')){
      const b=document.createElement('button');b.className='btn sm';b.dataset.resetStage='1';b.textContent='전체 단계 보기';
      b.onclick=()=>{state.goodsFilter='all';saveUIPrefs();S.render()};empty.appendChild(b);
    }
  }
}

window.SEIN_UX14={FX,enhance,openMoreSheet,closeMoreSheet,saveUIPrefs};
})();