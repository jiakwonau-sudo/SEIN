/* SEIN UX v1.1 */
(function(){
  function go(page,cat){
    if(cat) state.cat=cat;
    state.page=page;
    history.pushState({page},'',`#${state.cat}/${page}`);
    render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function flowCard(){
    return `<section class="ux-flow">
      <div class="ux-flow-head"><div><span class="full-chip">UX v1.1</span><h2>업무를 끊기지 않게 이어갑니다</h2><p>찾기 → 열기 → 수정 → 연결 → 저장 → 다음 행동</p></div><button class="btn sm" data-ux="search">⌕ 통합 검색</button></div>
      <div class="ux-steps">
        <div><b>1</b><span>찾기</span><small>설비·고객·영업 통합검색</small></div>
        <div><b>2</b><span>열기</span><small>목록에서 상세 진입</small></div>
        <div><b>3</b><span>수정</span><small>업무 맥락 안에서 편집</small></div>
        <div><b>4</b><span>연결</span><small>고객·설비·영업 연결</small></div>
        <div><b>5</b><span>저장</span><small>자동저장 + 상태 표시</small></div>
        <div><b>6</b><span>다음 행동</span><small>저장 뒤 후속 업무 선택</small></div>
      </div>
      <div class="ux-quick"><button class="btn primary" data-ux="new-equip">＋ 설비 등록</button><button class="btn" data-ux="new-customer">＋ 고객 등록</button><button class="btn" data-ux="new-deal">＋ 영업건 생성</button><button class="btn" data-ux="files">자료실</button></div>
    </section>`;
  }
  function removeNext(){document.querySelector('.ux-next')?.remove()}
  function next(title,body,actions){
    removeNext();
    const el=document.createElement('aside');el.className='ux-next';
    el.innerHTML=`<div class="ux-next-head"><div><small>다음 행동</small><b>${esc(title)}</b></div><button class="x" data-ux-close>✕</button></div><p>${esc(body||'')}</p><div class="ux-next-actions">${actions.map((a,i)=>`<button class="btn ${i===0?'primary':''} sm" data-ux-next="${a.id}" data-payload="${esc(a.payload||'')}">${esc(a.label)}</button>`).join('')}</div>`;
    document.body.appendChild(el);
    el.querySelector('[data-ux-close]').onclick=removeNext;
    el.querySelectorAll('[data-ux-next]').forEach(b=>b.onclick=()=>runNext(b.dataset.uxNext,b.dataset.payload));
  }
  function runNext(action,payload){
    removeNext();
    if(action==='equip-open'){const e=eqById(payload);if(!e)return;go('goods',e.cat);setTimeout(()=>openEquipFull(payload),80)}
    else if(action==='customer-list')go('customer');
    else if(action==='deal-new'){go('sales');setTimeout(openDealForm,80)}
    else if(action==='deal-open'){go('sales');setTimeout(()=>openDeal(payload),80)}
    else if(action==='quote-new'){go('quote');setTimeout(openQuoteForm,80)}
    else if(action==='dashboard')go('dash');
    else if(action==='files')go('files');
    else if(action==='search')openGlobalSearch();
    else if(action==='calendar')go('calendar','calendar');
  }
  function bind(){
    $$('[data-ux]').forEach(b=>b.onclick=()=>{const a=b.dataset.ux;if(a==='search')openGlobalSearch();else if(a==='new-equip'){go('goods');setTimeout(()=>openEquipForm(),80)}else if(a==='new-customer'){go('customer');setTimeout(()=>openCustomerForm(),80)}else if(a==='new-deal'){go('sales');setTimeout(openDealForm,80)}else if(a==='files')go('files')});
  }

  const dashBase=pageDashFull;
  pageDashFull=function(){return flowCard()+dashBase()};
  const postBase=postRender;
  postRender=function(){postBase();bind()};

  const equipBase=openEquipForm;
  openEquipForm=function(equip){equipBase(equip);const b=$('#efSave');if(!b)return;const old=b.onclick;b.onclick=()=>{const isNew=!equip;old();if($('#overlay').classList.contains('open'))return;const e=isNew?EQUIP[0]:equip;setTimeout(()=>next(isNew?'설비가 등록됐습니다':'설비가 저장됐습니다','상세자료를 붙이거나 고객·영업 흐름으로 이어갈 수 있습니다.',[{id:'equip-open',label:'설비 상세 열기',payload:e?.id||''},{id:'customer-list',label:'고객 연결'},{id:'deal-new',label:'영업건 만들기'}]),60)}};

  const customerBase=openCustomerForm;
  openCustomerForm=function(customer){customerBase(customer);const b=$('#cfSave');if(!b)return;const old=b.onclick;b.onclick=()=>{const isNew=!customer;old();if($('#overlay').classList.contains('open'))return;setTimeout(()=>next(isNew?'고객이 등록됐습니다':'고객 정보가 저장됐습니다','고객 등록에서 끝내지 않고 바로 영업으로 이어갈 수 있습니다.',[{id:'deal-new',label:'영업건 만들기'},{id:'customer-list',label:'고객 목록 보기'},{id:'search',label:'통합 검색'}]),60)}};

  const dealBase=openDealForm;
  openDealForm=function(){dealBase();const b=$('#dSave');if(!b)return;const old=b.onclick;b.onclick=()=>{old();if($('#overlay').classList.contains('open'))return;const d=DEALS[0];setTimeout(()=>next('영업건이 생성됐습니다','설비와 고객이 연결됐습니다. 견적 또는 영업 상세로 이어가세요.',[{id:'deal-open',label:'영업 상세 열기',payload:d?.id||''},{id:'quote-new',label:'견적 등록'},{id:'dashboard',label:'대시보드 보기'}]),60)}};

  const quoteBase=openQuoteForm;
  openQuoteForm=function(){quoteBase();const b=$('#qSave');if(!b)return;const old=b.onclick;b.onclick=()=>{old();if($('#overlay').classList.contains('open'))return;setTimeout(()=>next('견적이 등록됐습니다','다음 영업 행동을 바로 선택할 수 있습니다.',[{id:'deal-new',label:'영업건 만들기'},{id:'dashboard',label:'현황 보기'},{id:'search',label:'관련 항목 찾기'}]),60)}};

  const eventBase=openEventForm;
  openEventForm=function(ev,date){eventBase(ev,date);const b=$('#evSave');if(!b)return;const old=b.onclick;b.onclick=()=>{old();if($('#overlay').classList.contains('open'))return;setTimeout(()=>next('일정이 저장됐습니다','관련 설비나 고객을 바로 찾을 수 있습니다.',[{id:'calendar',label:'캘린더 보기'},{id:'search',label:'관련 업무 찾기'},{id:'dashboard',label:'현황 보기'}]),60)}};
})();