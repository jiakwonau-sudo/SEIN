/* Customer 360 legacy public-seed remediation v1.5.3
 * Runs before app.full.js hydrates browser state.
 * Fail-closed default: memo DB access is unsafe until this script explicitly proves otherwise.
 */
(()=>{
'use strict';

const STORE_KEY='sein.full.v1.data';
const LEGACY_SEED_KEY='sein.customer360.seed.2026-09-28';
const MIGRATION_KEY='sein.customer360.migration.2026-09-29';
const MEMO_DB='sein-customer360';
const CUSTOMER_MUTATIONS=new Set([
  'CUSTOMER360_IMPORT',
  'CUSTOMER_IMPORT',
  'CUSTOMER_CREATE',
  'CUSTOMER_UPDATE',
  'CUSTOMER_DELETE',
  'CUSTOMER_BLOCK_TOGGLE'
]);

function setReady(value){
  window.SEIN_CUSTOMER360_MIGRATION_READY=Promise.resolve(value);
}
function failClosed(outcome='migration-error'){
  setReady({outcome,memoSafe:false});
}
function latestAuditAt(audit,predicate){
  let latest=0;
  for(const entry of Array.isArray(audit)?audit:[]){
    if(!predicate(entry?.action))continue;
    const t=Date.parse(entry.at||'');
    if(Number.isFinite(t)&&t>latest)latest=t;
  }
  return latest;
}
function addAudit(data,action,detail){
  const audit=Array.isArray(data.audit)?data.audit:[];
  data.audit=[{at:new Date().toISOString(),user:'system',action,detail},...audit].slice(0,300);
}
function deleteMemoDb(){
  return new Promise((resolve,reject)=>{
    let req;
    try{req=indexedDB.deleteDatabase(MEMO_DB)}
    catch(error){reject(error);return}
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error||new Error('Customer 360 memo database deletion failed'));
    req.onblocked=()=>reject(new Error('Customer 360 memo database deletion blocked by another open tab'));
  });
}

// Establish the security boundary before any storage access that could throw.
failClosed('initializing');

let legacyMarker;
try{
  legacyMarker=localStorage.getItem(LEGACY_SEED_KEY);
}catch(error){
  console.error('Customer 360 legacy seed marker read failed',error);
  try{localStorage.setItem(MIGRATION_KEY,'migration-error')}catch{}
  return;
}

if(!legacyMarker){
  setReady({outcome:'not-needed',memoSafe:true});
  return;
}

let data=null;
try{
  const raw=localStorage.getItem(STORE_KEY);
  if(raw)data=JSON.parse(raw);
}catch(error){
  console.error('Customer 360 legacy seed state parse failed',error);
  try{localStorage.setItem(MIGRATION_KEY,'migration-error')}catch{}
  return;
}

if(data){
  const audit=Array.isArray(data.audit)?data.audit:[];
  const seedAt=latestAuditAt(audit,action=>action==='CUSTOMER360_BUNDLED_SEED');
  const mutationAt=latestAuditAt(audit,action=>CUSTOMER_MUTATIONS.has(action));
  const preservePostSeedWork=mutationAt>0&&(seedAt===0||mutationAt>seedAt);

  if(preservePostSeedWork){
    try{
      addAudit(data,'CUSTOMER360_LEGACY_SEED_PRESERVE','Retired auto-seed marker removed; post-seed customer work preserved.');
      localStorage.setItem(STORE_KEY,JSON.stringify(data));
      localStorage.removeItem(LEGACY_SEED_KEY);
      localStorage.setItem(MIGRATION_KEY,'preserved-post-seed-work');
      setReady({outcome:'preserved-post-seed-work',memoSafe:true});
    }catch(error){
      console.error('Customer 360 post-seed preservation failed',error);
      try{localStorage.setItem(MIGRATION_KEY,'migration-error')}catch{}
    }
    return;
  }

  try{
    data.customers=[];
    addAudit(data,'CUSTOMER360_LEGACY_SEED_PURGE','Removed customer state attributable to retired public auto-seed.');
    localStorage.setItem(STORE_KEY,JSON.stringify(data));
  }catch(error){
    console.error('Customer 360 legacy customer purge failed',error);
    try{localStorage.setItem(MIGRATION_KEY,'migration-error')}catch{}
    return;
  }
}

window.SEIN_CUSTOMER360_MIGRATION_READY=deleteMemoDb().then(()=>{
  try{
    localStorage.removeItem(LEGACY_SEED_KEY);
    localStorage.setItem(MIGRATION_KEY,data?'purged':'purged-empty-store');
  }catch(error){
    console.error('Customer 360 migration marker retirement failed',error);
    return {outcome:'migration-error',memoSafe:false};
  }
  return {outcome:data?'purged':'purged-empty-store',memoSafe:true};
}).catch(error=>{
  console.error('Customer 360 legacy memo cleanup pending',error);
  try{localStorage.setItem(MIGRATION_KEY,'migration-error')}catch{}
  // Keep LEGACY_SEED_KEY so a later load retries deletion.
  return {outcome:'migration-error',memoSafe:false};
});
})();
