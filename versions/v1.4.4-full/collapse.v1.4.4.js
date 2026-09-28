/* SEIN v1.4.4 — one collapse system, true header-trace collapse */
(function(){
'use strict';
const S=window.SEIN_INTERNAL,V=window.SEIN_V12;
if(!S)return;
const PREFIX='sein.ux.collapse.v1.4.4.';
const read=k=>localStorage.getItem(PREFIX+k)==='1';
const write=(k,v)=>localStorage.setItem(PREFIX+k,v?'1':'0');

function syncButton(btn,collapsed,label){
  const text=collapsed?'▸ 펼치기':'▾ 접기';
  btn.textContent=text;
  btn.setAttribute('aria-expanded',String(!collapsed));
  btn.setAttribute('aria-label',label+' '+(collapsed?'펼치기':'접기'));
}
function bindCollapse(root,bodySelector,key,label,buttonHost){
  if(!root)return;
  let btn=root.querySelector('[data-ux144-collapse="'+key+'"]');
  if(!btn){
    btn=document.createElement('button');
    btn.className='btn xs ux144-collapse-btn';
    btn.dataset.ux144Collapse=key;
    (buttonHost||root).appendChild(btn);
  }
  const apply=collapsed=>{
    root.classList.toggle('ux144-collapsed',collapsed);
    if(bodySelector)root.querySelectorAll(bodySelector).forEach(x=>x.classList.toggle('ux144-hidden',collapsed));
    syncButton(btn,collapsed,label);
  };
  apply(read(key));
  btn.onclick=e=>{
    e.stopPropagation();
    const next=!root.classList.contains('ux144-collapsed');
    write(key,next);apply(next);
  };
}
function enhanceFlow(){
  const flow=document.querySelector('.ux-flow');if(!flow)return;
  const head=flow.querySelector('.ux-flow-head');if(!head)return;
  const h2=head.querySelector('h2');if(h2&&h2.textContent!=='작업흐름')h2.textContent='작업흐름';
  let actions=head.querySelector('.ux-flow-head-actions');
  if(!actions){
    actions=document.createElement('div');actions.className='ux-flow-head-actions';
    const search=head.querySelector('[data-ux="search"]');if(search)actions.appendChild(search);
    head.appendChild(actions);
  }
  // Remove the legacy compact-view button if present.
  head.querySelector('[data-flow-toggle]')?.remove();
  bindCollapse(flow,':scope > :not(.ux-flow-head)','flow','작업흐름',actions);
}
function enhanceAttention(){
  const sec=document.querySelector('.ux14-attention');if(!sec)return;
  const head=sec.querySelector('.ux14-attention-head');if(!head)return;
  let host=head.querySelector('.ux144-head-actions');
  if(!host){
    host=document.createElement('div');host.className='ux144-head-actions';
    const summary=head.querySelector(':scope > .muted');if(summary)host.appendChild(summary);
    head.appendChild(host);
  }
  bindCollapse(sec,'.ux14-attention-grid','today:'+state.cat,'오늘 할 일',host);
}
function makeKpiSection(){
  const main=document.getElementById('main');
  if(!main||!main.querySelector('.page-title')?.textContent.includes('대시보드'))return;
  if(main.querySelector('.ux144-kpi-section'))return;
  const kpis=[...main.children].find(x=>x.classList?.contains('kpis'));if(!kpis)return;
  const sec=document.createElement('section');sec.className='ux144-subsection ux144-kpi-section';
  const head=document.createElement('div');head.className='ux144-subsection-head';
  head.innerHTML='<div><small>DASHBOARD</small><h3>핵심 지표</h3></div><div class="ux144-head-actions"></div>';
  const body=document.createElement('div');body.className='ux144-subsection-body';
  kpis.before(sec);sec.append(head,body);body.appendChild(kpis);
  bindCollapse(sec,'.ux144-subsection-body','kpi:'+state.cat,'핵심 지표',head.querySelector('.ux144-head-actions'));
}
function enhanceCards(){
  const main=document.getElementById('main');
  if(!main||!main.querySelector('.page-title')?.textContent.includes('대시보드'))return;
  main.querySelectorAll('.split .card').forEach(card=>{
    const head=card.querySelector(':scope > .card-head');
    if(!head||card.dataset.ux144Ready)return;
    card.dataset.ux144Ready='1';
    const title=head.querySelector('.card-title')?.textContent.trim()||'대시보드 섹션';
    let host=head.querySelector('.ux144-head-actions');
    if(!host){
      host=document.createElement('div');host.className='ux144-head-actions';
      [...head.children].filter(x=>x!==head.querySelector('.card-title')).forEach(x=>host.appendChild(x));
      head.appendChild(host);
    }
    bindCollapse(card,':scope > :not(.card-head)','card:'+state.cat+':'+title.replace(/\s+/g,'_'),title,host);
  });
}
function enhanceDashboardSection(){
  const main=document.getElementById('main');if(!main)return;
  const pageHead=[...main.children].find(x=>x.classList?.contains('page-head'));
  if(!pageHead||!pageHead.querySelector('.page-title')?.textContent.includes('대시보드'))return;
  if(main.querySelector('.ux144-dashboard-section'))return;
  const kpi=[...main.children].find(x=>x.classList?.contains('ux144-kpi-section'));
  const split=[...main.children].find(x=>x.classList?.contains('split'));

  const sec=document.createElement('section');sec.className='ux144-dashboard-section';
  const head=document.createElement('div');head.className='ux144-dashboard-head';
  head.innerHTML='<div><small>DASHBOARD</small><h3>대시보드</h3></div><div class="ux144-head-actions"></div>';
  const body=document.createElement('div');body.className='ux144-dashboard-body';
  pageHead.before(sec);sec.append(head,body);
  body.appendChild(pageHead);
  if(kpi)body.appendChild(kpi);
  if(split)body.appendChild(split);
  bindCollapse(sec,'.ux144-dashboard-body','dashboard:'+state.cat,'대시보드',head.querySelector('.ux144-head-actions'));
}
function enhance(){
  enhanceFlow();
  enhanceAttention();
  makeKpiSection();
  enhanceCards();
  enhanceDashboardSection();
}
let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;enhance()});
});
function start(){
  enhance();
  const main=document.getElementById('main');
  if(main)observer.observe(main,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.SEIN_COLLAPSE_V144={enhance};
})();