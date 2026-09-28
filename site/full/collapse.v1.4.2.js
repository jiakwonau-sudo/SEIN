/* SEIN v1.4.3 — stable section collapse, observer loop fixed */
(function(){
'use strict';
const S=window.SEIN_INTERNAL,V=window.SEIN_V12;
if(!S)return;
const PREFIX='sein.ux.collapse.v1.4.2.';
const read=k=>localStorage.getItem(PREFIX+k)==='1';
const write=(k,v)=>localStorage.setItem(PREFIX+k,v?'1':'0');

function syncButton(btn,collapsed,label){
  const text=collapsed?'펼치기':'접기';
  const expanded=String(!collapsed);
  const aria=label+' '+text;
  if(btn.textContent!==text) btn.textContent=text;
  if(btn.getAttribute('aria-expanded')!==expanded) btn.setAttribute('aria-expanded',expanded);
  if(btn.getAttribute('aria-label')!==aria) btn.setAttribute('aria-label',aria);
}

function bindCollapse(root,bodySelector,key,label,buttonHost){
  if(!root)return;
  let btn=root.querySelector('[data-v142-collapse="'+key+'"]');
  if(!btn){
    btn=document.createElement('button');
    btn.className='btn xs ux142-collapse-btn';
    btn.dataset.v142Collapse=key;
    (buttonHost||root).appendChild(btn);
  }
  const apply=collapsed=>{
    root.classList.toggle('ux142-collapsed',collapsed);
    if(bodySelector){
      root.querySelectorAll(bodySelector).forEach(x=>x.classList.toggle('ux142-hidden',collapsed));
    }
    syncButton(btn,collapsed,label);
  };
  apply(read(key));
  btn.onclick=e=>{
    e.stopPropagation();
    const next=!root.classList.contains('ux142-collapsed');
    write(key,next);apply(next);
  };
}

function enhanceFlow(){
  const flow=document.querySelector('.ux-flow');if(!flow)return;
  const head=flow.querySelector('.ux-flow-head');if(!head)return;
  let actions=head.querySelector('.ux-flow-head-actions');
  if(!actions){actions=document.createElement('div');actions.className='ux-flow-head-actions';head.appendChild(actions)}
  let btn=flow.querySelector('[data-flow-toggle]');
  if(!btn){
    btn=document.createElement('button');btn.className='btn sm';btn.dataset.flowToggle='1';actions.appendChild(btn);
  }
  btn.dataset.v142Collapse='flow';
  const apply=collapsed=>{
    flow.classList.toggle('ux142-collapsed',collapsed);
    flow.classList.toggle('is-collapsed',collapsed);
    localStorage.setItem('sein.ux.flowCollapsed',collapsed?'1':'0');
    write('flow',collapsed);
    syncButton(btn,collapsed,'업무 흐름');
  };
  const collapsed=localStorage.getItem(PREFIX+'flow')!==null?read('flow'):localStorage.getItem('sein.ux.flowCollapsed')==='1';
  apply(collapsed);
  btn.onclick=e=>{e.stopPropagation();apply(!flow.classList.contains('ux142-collapsed'))};
}
function enhanceAttention(){
  const sec=document.querySelector('.ux14-attention');if(!sec)return;
  const head=sec.querySelector('.ux14-attention-head');if(!head)return;
  let host=head.querySelector('.ux142-head-actions');
  if(!host){
    host=document.createElement('div');host.className='ux142-head-actions';
    const summary=head.querySelector(':scope > .muted');
    if(summary)host.appendChild(summary);
    head.appendChild(host);
  }
  bindCollapse(sec,'.ux14-attention-grid','today:'+state.cat,'오늘 할 일',host);
}

function makeKpiSection(){
  const main=document.getElementById('main');
  if(!main||!main.querySelector('.page-title')?.textContent.includes('대시보드'))return;
  if(main.querySelector('.ux142-kpi-section'))return;
  const kpis=[...main.children].find(x=>x.classList?.contains('kpis'));
  if(!kpis)return;
  const sec=document.createElement('section');
  sec.className='ux142-section ux142-kpi-section';
  const head=document.createElement('div');head.className='ux142-section-head';
  head.innerHTML='<div><small>DASHBOARD</small><h3>핵심 지표</h3></div><div class="ux142-head-actions"></div>';
  const body=document.createElement('div');body.className='ux142-section-body';
  kpis.before(sec);sec.append(head,body);body.appendChild(kpis);
  bindCollapse(sec,'.ux142-section-body','kpi:'+state.cat,'핵심 지표',head.querySelector('.ux142-head-actions'));
}

function enhanceCards(){
  const main=document.getElementById('main');
  if(!main||!main.querySelector('.page-title')?.textContent.includes('대시보드'))return;
  main.querySelectorAll('.split .card').forEach(card=>{
    const head=card.querySelector(':scope > .card-head');
    if(!head||card.dataset.v142CollapseReady)return;
    card.dataset.v142CollapseReady='1';
    const title=head.querySelector('.card-title')?.textContent.trim()||'대시보드 섹션';
    let host=head.querySelector('.ux142-head-actions');
    if(!host){
      host=document.createElement('div');host.className='ux142-head-actions';
      [...head.children].filter(x=>x!==head.querySelector('.card-title')).forEach(x=>host.appendChild(x));
      head.appendChild(host);
    }
    const key='card:'+state.cat+':'+title.replace(/\s+/g,'_');
    bindCollapse(card,':scope > :not(.card-head)',key,title,host);
  });
}

function enhanceDashboardMaster(){
  const main=document.getElementById('main');if(!main)return;
  const title=main.querySelector('.page-title')?.textContent||'';
  main.classList.toggle('ux142-dashboard-page',title.includes('대시보드'));
  if(!title.includes('대시보드'))return;
  const head=main.querySelector('.page-head');if(!head)return;
  let actions=head.querySelector('.actions');
  if(!actions){actions=document.createElement('div');actions.className='actions';head.appendChild(actions)}
  const key='dashboard:'+state.cat;
  let btn=actions.querySelector('[data-v142-dashboard]');
  if(!btn){
    btn=document.createElement('button');btn.className='btn sm';btn.dataset.v142Dashboard='1';actions.appendChild(btn);
  }
  const apply=collapsed=>{
    main.classList.toggle('ux142-dashboard-collapsed',collapsed);
    syncButton(btn,collapsed,'대시보드 전체');
  };
  apply(read(key));
  btn.onclick=()=>{
    const next=!main.classList.contains('ux142-dashboard-collapsed');
    write(key,next);apply(next);
  };
}

function enhance(){
  enhanceFlow();
  enhanceAttention();
  makeKpiSection();
  enhanceCards();
  enhanceDashboardMaster();
}

let enhanceQueued=false;
const observer=new MutationObserver(()=>{
  if(enhanceQueued)return;
  enhanceQueued=true;
  requestAnimationFrame(()=>{
    enhanceQueued=false;
    enhance();
  });
});
function start(){
  enhance();
  const main=document.getElementById('main');
  if(main)observer.observe(main,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.SEIN_COLLAPSE_V142={enhance};
})();