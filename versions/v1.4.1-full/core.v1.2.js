/* SEIN v1.2.0 shared enhancement state */
(function(){
'use strict';
var S=window.SEIN_INTERNAL;
if(!S)return;
var KEY='sein.full.v1.2.ext';
function now(){return new Date().toISOString()}
function defaults(){
  return {
    memoOwners:{},
    fileFolders:[
      {id:'root',name:'자료실',parentId:null,permission:'all',createdBy:'system',createdAt:now()},
      {id:'restricted',name:'대표자 전용',parentId:'root',permission:'admin',createdBy:'system',createdAt:now()}
    ],
    activeFolderId:'root',
    account:{
      ledger:[
        {id:'LD-001',date:'2026-09-02',type:'입금',account:'운영계좌',description:'대성정밀 계약금',income:30000000,expense:0,balance:30000000,attachment:'',fileId:'',createdBy:'대표자',updatedAt:'2026-09-02T09:00:00'},
        {id:'LD-002',date:'2026-09-05',type:'출금',account:'운영계좌',description:'운송비',income:0,expense:4200000,balance:25800000,attachment:'',fileId:'',createdBy:'대표자',updatedAt:'2026-09-05T09:00:00'}
      ],
      daily:[
        {id:'DY-001',date:'2026-09-02',sales:30000000,purchase:0,cost:0,memo:'계약금 수령',createdBy:'대표자',updatedAt:'2026-09-02T09:00:00'},
        {id:'DY-002',date:'2026-09-05',sales:0,purchase:0,cost:4200000,memo:'운송비',createdBy:'대표자',updatedAt:'2026-09-05T09:00:00'}
      ],
      monthlyItems:[
        {id:'MI-SALES',name:'매출',kind:'income',locked:true},
        {id:'MI-BUY',name:'매입',kind:'purchase',locked:true},
        {id:'MI-SHIP',name:'운송비',kind:'expense',locked:false},
        {id:'MI-REPAIR',name:'정비비',kind:'expense',locked:false},
        {id:'MI-ETC',name:'기타비용',kind:'expense',locked:false}
      ],
      monthly:{
        '2025':{},
        '2026':{
          '01':{'MI-SALES':71000000,'MI-BUY':48000000,'MI-SHIP':4200000,'MI-REPAIR':1700000,'MI-ETC':1100000},
          '02':{'MI-SALES':88000000,'MI-BUY':61000000,'MI-SHIP':5200000,'MI-REPAIR':900000,'MI-ETC':800000},
          '03':{'MI-SALES':97000000,'MI-BUY':69000000,'MI-SHIP':6100000,'MI-REPAIR':1300000,'MI-ETC':950000},
          '04':{'MI-SALES':65000000,'MI-BUY':44000000,'MI-SHIP':3500000,'MI-REPAIR':2100000,'MI-ETC':750000},
          '05':{'MI-SALES':84000000,'MI-BUY':59000000,'MI-SHIP':4700000,'MI-REPAIR':1500000,'MI-ETC':900000},
          '06':{'MI-SALES':51000000,'MI-BUY':37000000,'MI-SHIP':3100000,'MI-REPAIR':700000,'MI-ETC':550000},
          '07':{'MI-SALES':132000000,'MI-BUY':96000000,'MI-SHIP':7200000,'MI-REPAIR':3400000,'MI-ETC':2300000},
          '08':{'MI-SALES':93000000,'MI-BUY':64000000,'MI-SHIP':4300000,'MI-REPAIR':2600000,'MI-ETC':1600000},
          '09':{'MI-SALES':30000000,'MI-BUY':0,'MI-SHIP':4200000,'MI-REPAIR':1800000,'MI-ETC':0}
        },
        '2027':{}
      }
    },
    integration:{
      gmail:{connected:false,label:'Gmail Mock Adapter',lastSync:null},
      fx:{connected:false,label:'Hana FX Mock Adapter',lastSync:null},
      db:{connected:false,label:'Supabase Mock Adapter',lastSync:null}
    },
    importRuns:[],
    legacyRuns:[]
  };
}
function merge(a,b){
  if(!b||typeof b!=='object')return a;
  Object.keys(b).forEach(function(k){
    if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))merge(a[k],b[k]);
    else a[k]=b[k];
  });
  return a;
}
var ext=defaults();
try{var raw=localStorage.getItem(KEY);if(raw)ext=merge(defaults(),JSON.parse(raw))}catch(e){console.warn('SEIN v1.2 ext load',e)}
if(typeof EQUIP!=='undefined')EQUIP.forEach(function(e){if(!ext.memoOwners[e.id])ext.memoOwners[e.id]='legacy'});
function save(){localStorage.setItem(KEY,JSON.stringify(ext))}
function user(){return S.getCurrentUser()}
function admin(){return user()&&user().role==='admin'}
function escHtml(v){
  return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]})
}
function money(v){return Number(v||0).toLocaleString('ko-KR')}
function textFile(name,text,type){
  var blob=new Blob([text],{type:type||'text/csv;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1500)
}
window.SEIN_V12={S:S,key:KEY,ext:ext,save:save,user:user,isAdmin:admin,esc:escHtml,money:money,downloadText:textFile,defaults:defaults};
save();
})();