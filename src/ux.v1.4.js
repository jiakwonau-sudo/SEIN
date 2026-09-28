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
function enhance(){flowToggle();applyFX();enhanceMobileMore()}
const mo=new MutationObserver(()=>requestAnimationFrame(enhance));
const start=()=>{enhance();const main=document.getElementById('main');if(main)mo.observe(main,{childList:true,subtree:true})};
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

window.SEIN_UX14={FX,enhance,openMoreSheet,closeMoreSheet};
})();