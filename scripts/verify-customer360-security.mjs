import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const customerPath='site/full/customer.v1.5.0.js';
const appPath='site/full/app.full.js';
const migrationPath='site/full/customer360-migration.v1.5.3.js';
const indexPath='site/full/index.html';

const customerSource=fs.readFileSync(customerPath,'utf8');
const appSource=fs.readFileSync(appPath,'utf8');
const migrationSource=fs.readFileSync(migrationPath,'utf8');
const indexSource=fs.readFileSync(indexPath,'utf8');

assert.equal(/\bfetch\s*\(/.test(customerSource),false,'Customer 360 must not fetch bundled public data');
assert.equal(/DATA_ROOT|DATA_SEED_KEY|autoLoadBundledData|CUSTOMER360_BUNDLED_SEED/.test(customerSource),false,'Bundled data loader markers must be absent');
assert.ok(customerSource.includes('async function importPackage(file)'),'Local import handler must remain');
assert.ok(customerSource.includes("inp.type='file'"),'Local file picker must remain');
assert.ok(customerSource.includes('SEIN_CUSTOMER360_MIGRATION_READY'),'Memo DB access must wait for legacy cleanup');
assert.ok(appSource.includes('customers:CUSTOMERS'),'Customer state must remain in browser-local app state');
assert.ok(appSource.includes('localStorage.setItem(STORE_KEY,JSON.stringify(data))'),'Customer state must persist to localStorage');

const storage=new Map();
const sandbox={
  window:{
    state:{page:'dashboard'},
    SEIN_INTERNAL:{
      getCurrentUser:()=>({role:'admin'}),
      saveAll:()=>{},
      log:()=>{},
      render:()=>{},
      toast:()=>{}
    }
  },
  localStorage:{
    getItem:key=>storage.has(key)?storage.get(key):null,
    setItem:(key,value)=>storage.set(key,String(value))
  },
  CUSTOMERS:[],
  indexedDB:{open(){throw new Error('unexpected IndexedDB open')}},
  console:{log(){},warn(){},error(){}},
  setTimeout:()=>0,
  clearTimeout:()=>{},
  queueMicrotask:fn=>fn()
};
vm.createContext(sandbox);
vm.runInContext(customerSource,sandbox,{filename:customerPath});

const api=sandbox.window.SEIN_CUSTOMER360;
assert.ok(api,'Customer 360 API must initialize');
assert.equal(api.importMode,'local-file');

const mapped=api.mapPayload({
  customers:[{
    id:'SYN-1',
    name:'Synthetic Customer',
    country:'AU',
    contacts:[{name:'Synthetic User',email:'synthetic@example.invalid'}]
  }],
  memos:[{targetType:'customers',targetId:'SYN-1',body:'synthetic memo'}]
});
assert.equal(mapped.customers.length,1);
assert.equal(mapped.memos.length,1);
assert.equal(mapped.customers[0].memoCount,1);

sandbox.CUSTOMERS.push(...mapped.customers);
const html=sandbox.window.pageCustomer();
assert.ok(html.includes('id="c360Import"'),'Admin local import control must render');
assert.equal(/자동 로드|스냅샷이 이 버전에 포함/.test(html),false,'UI must not claim public bundled data');

let dbOpenCount=0;
sandbox.indexedDB={open(){dbOpenCount++;throw new Error('unsafe DB access')}};
sandbox.window.SEIN_CUSTOMER360_MIGRATION_READY=Promise.resolve({outcome:'migration-error',memoSafe:false});
const gatedMemos=await api.getMemos('SYN-1');
assert.equal(gatedMemos.length,0,'Unsafe legacy memo DB must not be read');
assert.equal(dbOpenCount,0,'IndexedDB must not open while cleanup is unsafe');

delete sandbox.window.SEIN_CUSTOMER360_MIGRATION_READY;
dbOpenCount=0;
const absentReadyMemos=await api.getMemos('SYN-1');
assert.equal(absentReadyMemos.length,0,'Readiness absence must fail closed');
assert.equal(dbOpenCount,0,'IndexedDB must not open when migration readiness is unavailable');

assert.ok(
  indexSource.indexOf('./customer360-migration.v1.5.3.js?v=153') <
  indexSource.indexOf('./app.full.js'),
  'Legacy seed remediation must run before app hydration'
);

async function runMigration({store,marker='1753:3075',deleteOutcome='success'}={}){
  const storage=new Map();
  if(store!==undefined)storage.set('sein.full.v1.data',JSON.stringify(store));
  if(marker!==null)storage.set('sein.customer360.seed.2026-09-28',marker);
  const requests=[];
  const context={
    window:{},
    localStorage:{
      getItem:key=>storage.has(key)?storage.get(key):null,
      setItem:(key,value)=>storage.set(key,String(value)),
      removeItem:key=>storage.delete(key)
    },
    indexedDB:{
      deleteDatabase(name){
        const req={name,error:null};
        requests.push(req);
        queueMicrotask(()=>{
          if(deleteOutcome==='success')req.onsuccess?.();
          else if(deleteOutcome==='blocked')req.onblocked?.();
          else{req.error=new Error('synthetic delete error');req.onerror?.()}
        });
        return req;
      }
    },
    console:{log(){},warn(){},error(){}}
  };
  vm.createContext(context);
  vm.runInContext(migrationSource,context,{filename:migrationPath});
  const result=await context.window.SEIN_CUSTOMER360_MIGRATION_READY;
  return {
    storage,
    requests,
    result,
    state:storage.has('sein.full.v1.data')?JSON.parse(storage.get('sein.full.v1.data')):null,
    outcome:storage.get('sein.customer360.migration.2026-09-29')
  };
}

const seeded=await runMigration({
  store:{
    customers:[{id:'SYN-SEEDED'}],
    audit:[{at:'2026-09-29T12:58:00Z',action:'CUSTOMER360_BUNDLED_SEED'}]
  }
});
assert.equal(seeded.state.customers.length,0,'Previously auto-seeded customer state must be purged');
assert.equal(seeded.outcome,'purged');
assert.equal(seeded.result.memoSafe,true);
assert.equal(seeded.storage.has('sein.customer360.seed.2026-09-28'),false);
assert.equal(seeded.requests.length,1);

for(const action of ['CUSTOMER_CREATE','CUSTOMER_UPDATE','CUSTOMER_DELETE','CUSTOMER_BLOCK_TOGGLE','CUSTOMER_IMPORT','CUSTOMER360_IMPORT']){
  const preserved=await runMigration({
    store:{
      customers:[{id:'SYN-POST-SEED'}],
      audit:[
        {at:'2026-09-29T13:20:00Z',action},
        {at:'2026-09-29T12:58:00Z',action:'CUSTOMER360_BUNDLED_SEED'}
      ]
    }
  });
  assert.equal(preserved.state.customers.length,1,action+' after seed must be preserved');
  assert.equal(preserved.outcome,'preserved-post-seed-work');
  assert.equal(preserved.requests.length,0,'Preserved customer state must not delete memo DB');
  assert.equal(preserved.storage.has('sein.customer360.seed.2026-09-28'),false);
}

const blocked=await runMigration({
  deleteOutcome:'blocked',
  store:{
    customers:[{id:'SYN-SEEDED'}],
    audit:[{at:'2026-09-29T12:58:00Z',action:'CUSTOMER360_BUNDLED_SEED'}]
  }
});
assert.equal(blocked.state.customers.length,0,'Customer state can be cleared before memo deletion retry');
assert.equal(blocked.result.memoSafe,false,'Blocked memo deletion must fail closed');
assert.equal(blocked.storage.has('sein.customer360.seed.2026-09-28'),true,'Legacy marker must remain so deletion retries');
assert.equal(blocked.outcome,'migration-error');

const deleteError=await runMigration({
  deleteOutcome:'error',
  store:{
    customers:[{id:'SYN-SEEDED'}],
    audit:[{at:'2026-09-29T12:58:00Z',action:'CUSTOMER360_BUNDLED_SEED'}]
  }
});
assert.equal(deleteError.result.memoSafe,false);
assert.equal(deleteError.storage.has('sein.customer360.seed.2026-09-28'),true,'Delete error must retain retry marker');

const untouched=await runMigration({
  marker:null,
  store:{customers:[{id:'SYN-NO-MARKER'}],audit:[]}
});
assert.equal(untouched.state.customers.length,1,'Browsers without the legacy marker must be untouched');
assert.equal(untouched.result.outcome,'not-needed');
assert.equal(untouched.requests.length,0);

const throwingContext={
  window:{},
  localStorage:{
    getItem(){throw new Error('synthetic storage read failure')},
    setItem(){},
    removeItem(){}
  },
  indexedDB:{deleteDatabase(){throw new Error('must not be reached')}},
  console:{log(){},warn(){},error(){}}
};
vm.createContext(throwingContext);
vm.runInContext(migrationSource,throwingContext,{filename:migrationPath});
const throwingReady=await throwingContext.window.SEIN_CUSTOMER360_MIGRATION_READY;
assert.equal(throwingReady.memoSafe,false,'Marker read failure must keep memo DB unsafe');

console.log('Customer 360 security smoke: PASS');
console.log('Customer 360 legacy seed migration smoke: PASS');
