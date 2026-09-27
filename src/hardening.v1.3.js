/* SEIN v1.3 hardening — iteration 1 */
(function(){
'use strict';
var V=window.SEIN_V12,S=window.SEIN_INTERNAL;if(!V||!S)return;
window.SEIN_HARDENING={iteration:10,version:'v1.3.0-full'};

/* I1: equipment memo permission UX */
if(S.getOpenEquipFull&&S.setOpenEquipFull){
  var prevOpenEquipFull=S.getOpenEquipFull();
  S.setOpenEquipFull(function(id,tab){
    prevOpenEquipFull(id,tab);
    var e=typeof eqById==='function'?eqById(id):null;if(!e)return;
    var owner=V.ext.memoOwners&&V.ext.memoOwners[e.id];
    var u=V.user(),can=V.isAdmin()||!owner||owner==='legacy'||(u&&owner===u.id);
    if((tab||'memo')==='memo'&&!can){
      var save=document.querySelector('#modal .modal-foot .btn.primary');
      if(save){save.disabled=true;save.textContent='읽기 전용';save.classList.remove('primary');}
    }
  });
}

/* I1: sales shared memo author must be actual logged-in user */
if(typeof paintDeal==='function'){
  var basePaintDeal=paintDeal;
  window.paintDeal=function(d){
    basePaintDeal(d);
    if(typeof dealTab!=='undefined'&&dealTab==='memo'){
      var add=document.querySelector('#addMemo');
      if(add) add.onclick=function(){
        var ta=document.querySelector('#newMemo'),v=(ta&&ta.value||'').trim();
        if(!v)return S.toast('메모 내용을 입력해 주세요');
        var u=V.user();
        d.memos.push({w:(u?u.name:'사용자')+' · '+new Date().toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),c:v,authorId:u?u.id:'unknown',createdAt:new Date().toISOString()});
        S.saveAll(false);S.log('DEAL_MEMO_CREATE',d.id);window.paintDeal(d);S.toast('공유 메모가 저장되었습니다');
      };
    }
  };
}
})();