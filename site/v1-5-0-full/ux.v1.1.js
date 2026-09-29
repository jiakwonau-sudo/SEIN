/* SEIN UX v1.1 - DOM enhancement layer */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const visible=el=>!!(el && (el.offsetWidth||el.offsetHeight||el.getClientRects().length));

  function nav(page,afterId){
    const b=$$('[data-page="'+page+'"]').find(visible);
    if(b)b.click();
    if(afterId)setTimeout(()=>document.getElementById(afterId)?.click(),120);
  }
  function search(){document.getElementById('quickFind')?.click()}
  function removeNext(){document.querySelector('.ux-next')?.remove()}
  function next(title,body,actions){
    removeNext();
    const el=document.createElement('aside');
    el.className='ux-next';
    const buttons=actions.map((a,i)=>'<button class="btn '+(i===0?'primary':'')+' sm" data-next="'+a.id+'">'+a.label+'</button>').join('');
    el.innerHTML='<div class="ux-next-head"><div><small>다음 행동</small><b>'+title+'</b></div><button class="x" data-next-close>✕</button></div><p>'+body+'</p><div class="ux-next-actions">'+buttons+'</div>';
    document.body.appendChild(el);
    $('[data-next-close]',el).onclick=removeNext;
  }
  function runNext(id){
    removeNext();
    if(id==='equipment')nav('goods');
    else if(id==='customer')nav('customer');
    else if(id==='new-deal')nav('sales','newDeal');
    else if(id==='sales')nav('sales');
    else if(id==='quote')nav('quote','newQuote');
    else if(id==='dashboard')nav('dash');
    else if(id==='files')nav('files');
    else if(id==='search')search();
  }
  function flowCard(){
    const sec=document.createElement('section');
    sec.className='ux-flow';
    sec.innerHTML='<div class="ux-flow-head"><div><span class="full-chip">UX v1.1</span><h2>작업흐름</h2><p>찾기 → 열기 → 수정 → 연결 → 저장 → 다음 행동</p></div><button class="btn sm" data-ux="search">⌕ 통합 검색</button></div>'+
      '<div class="ux-steps">'+
      '<div><b>1</b><span>찾기</span><small>설비·고객·영업 통합검색</small></div>'+
      '<div><b>2</b><span>열기</span><small>목록에서 상세 진입</small></div>'+
      '<div><b>3</b><span>수정</span><small>업무 맥락 안에서 편집</small></div>'+
      '<div><b>4</b><span>연결</span><small>고객·설비·영업 연결</small></div>'+
      '<div><b>5</b><span>저장</span><small>자동저장 + 상태 표시</small></div>'+
      '<div><b>6</b><span>다음 행동</span><small>저장 뒤 후속 업무 선택</small></div></div>'+
      '<div class="ux-quick"><button class="btn primary" data-ux="new-equip">＋ 설비 등록</button><button class="btn" data-ux="new-customer">＋ 고객 등록</button><button class="btn" data-ux="new-deal">＋ 영업건 생성</button><button class="btn" data-ux="files">자료실</button></div>';
    return sec;
  }
  function ensureMobileBottom(){
    if(!window.matchMedia('(max-width:820px)').matches)return;
    let bar=document.querySelector('.mobile-bottom');
    if(!bar){
      bar=document.createElement('div');
      bar.className='mobile-bottom';
      bar.innerHTML='<button data-mpage="dash">현황</button><button data-mpage="goods">설비</button><button data-mpage="sales">영업</button><button data-mpage="customer">고객</button>';
      document.body.appendChild(bar);
    }
    bar.style.display='grid';
    bar.querySelectorAll('[data-mpage]').forEach(b=>{
      b.onclick=()=>nav(b.dataset.mpage);
    });
  }
  function enhance(){
    const main=document.getElementById('main');
    if(!main)return;
    ensureMobileBottom();
    const title=main.querySelector('.page-title')?.textContent||'';
    if(title.includes('대시보드')&&!main.querySelector('.ux-flow'))main.prepend(flowCard());
  }
  document.addEventListener('click',e=>{
    const ux=e.target.closest('[data-ux]');
    if(ux){
      const a=ux.dataset.ux;
      if(a==='search')search();
      else if(a==='new-equip')nav('goods','newEquip');
      else if(a==='new-customer')nav('customer','newCustomer');
      else if(a==='new-deal')nav('sales','newDeal');
      else if(a==='files')nav('files');
      return;
    }
    const n=e.target.closest('[data-next]');
    if(n){runNext(n.dataset.next);return}

    const save=e.target.closest('#efSave,#cfSave,#dSave,#qSave,#evSave');
    if(save){
      const id=save.id;
      setTimeout(()=>{
        if(document.getElementById('overlay')?.classList.contains('open'))return;
        if(id==='efSave')next('설비가 저장됐습니다','상세자료를 확인하거나 고객·영업으로 이어가세요.',[
          {id:'equipment',label:'설비 목록'},{id:'customer',label:'고객 연결'},{id:'new-deal',label:'영업건 만들기'}]);
        else if(id==='cfSave')next('고객 정보가 저장됐습니다','고객 등록에서 끝내지 않고 바로 영업으로 이어갈 수 있습니다.',[
          {id:'new-deal',label:'영업건 만들기'},{id:'customer',label:'고객 목록'},{id:'search',label:'통합 검색'}]);
        else if(id==='dSave')next('영업건이 생성됐습니다','견적 또는 영업 상세 흐름으로 이어가세요.',[
          {id:'sales',label:'영업 목록'},{id:'quote',label:'견적 등록'},{id:'dashboard',label:'현황 보기'}]);
        else if(id==='qSave')next('견적이 등록됐습니다','다음 영업 행동을 선택하세요.',[
          {id:'sales',label:'영업 보기'},{id:'dashboard',label:'현황 보기'},{id:'search',label:'관련 항목 찾기'}]);
        else if(id==='evSave')next('일정이 저장됐습니다','관련 업무를 이어서 확인할 수 있습니다.',[
          {id:'dashboard',label:'현황 보기'},{id:'search',label:'관련 업무 찾기'}]);
      },180);
    }
  },true);

  window.SEIN_UX_NEXT=function(kind){
    if(kind==='equipment')next('설비가 저장됐습니다','상세자료를 확인하거나 고객·영업으로 이어가세요.',[
      {id:'equipment',label:'설비 목록'},{id:'customer',label:'고객 연결'},{id:'new-deal',label:'영업건 만들기'}]);
    else if(kind==='customer')next('고객 정보가 저장됐습니다','고객 등록에서 끝내지 않고 바로 영업으로 이어갈 수 있습니다.',[
      {id:'new-deal',label:'영업건 만들기'},{id:'customer',label:'고객 목록'},{id:'search',label:'통합 검색'}]);
    else if(kind==='sales')next('영업건이 생성됐습니다','견적 또는 영업 상세 흐름으로 이어가세요.',[
      {id:'sales',label:'영업 목록'},{id:'quote',label:'견적 등록'},{id:'dashboard',label:'현황 보기'}]);
    else if(kind==='quote')next('견적이 등록됐습니다','다음 영업 행동을 선택하세요.',[
      {id:'sales',label:'영업 보기'},{id:'dashboard',label:'현황 보기'},{id:'search',label:'관련 항목 찾기'}]);
    else if(kind==='event')next('일정이 저장됐습니다','관련 업무를 이어서 확인할 수 있습니다.',[
      {id:'dashboard',label:'현황 보기'},{id:'search',label:'관련 업무 찾기'}]);
  };

  const mo=new MutationObserver(()=>enhance());
  const start=()=>{const main=document.getElementById('main');if(main)mo.observe(main,{childList:true,subtree:true});enhance();setTimeout(ensureMobileBottom,250)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();