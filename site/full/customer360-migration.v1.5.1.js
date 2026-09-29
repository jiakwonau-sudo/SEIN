/* Customer 360 legacy public-seed remediation v1.5.1
 * Runs before app.full.js hydrates browser state.
 * If the retired public auto-seed marker is present, purge only data attributable
 * to that auto-seed. Preserve a later administrator import when audit evidence
 * shows it occurred after the bundled seed.
 */
(()=>{
'use strict';

const STORE_KEY='sein.full.v1.data';
const LEGACY_SEED_KEY='sein.customer360.seed.2026-09-28';
const MIGRATION_KEY='sein.customer360.migration.2026-09-29';
const MEMO_DB='sein-customer360';

function latestAuditAt(audit,action){
  let latest=0;
  for(const entry of Array.isArray(audit)?audit:[]){
    if(entry?.action!==action)continue;
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
  try{indexedDB.deleteDatabase(MEMO_DB)}catch{}
}

const legacyMarker=localStorage.getItem(LEGACY_SEED_KEY);
if(!legacyMarker)return;

let outcome='migration-error';
try{
  const raw=localStorage.getItem(STORE_KEY);
  if(!raw){
    deleteMemoDb();
    outcome='purged-empty-store';
  }else{
    const data=JSON.parse(raw);
    const audit=Array.isArray(data.audit)?data.audit:[];
    const seedAt=latestAuditAt(audit,'CUSTOMER360_BUNDLED_SEED');
    const importAt=latestAuditAt(audit,'CUSTOMER360_IMPORT');
    const preserveAdminImport=importAt>0 && (seedAt===0 || importAt>seedAt);

    if(preserveAdminImport){
      addAudit(data,'CUSTOMER360_LEGACY_SEED_PRESERVE','Legacy auto-seed marker retired; later administrator import preserved.');
      localStorage.setItem(STORE_KEY,JSON.stringify(data));
      outcome='preserved-admin-import';
    }else{
      data.customers=[];
      addAudit(data,'CUSTOMER360_LEGACY_SEED_PURGE','Removed customer state previously populated by retired public auto-seed.');
      localStorage.setItem(STORE_KEY,JSON.stringify(data));
      deleteMemoDb();
      outcome='purged';
    }
  }

  localStorage.removeItem(LEGACY_SEED_KEY);
  localStorage.setItem(MIGRATION_KEY,outcome);
}catch(error){
  console.error('Customer 360 legacy seed remediation failed',error);
  try{localStorage.setItem(MIGRATION_KEY,'migration-error')}catch{}
}
})();
