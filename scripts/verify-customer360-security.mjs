import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const customerPath = 'site/full/customer.v1.5.0.js';
const appPath = 'site/full/app.full.js';
const source = fs.readFileSync(customerPath, 'utf8');
const appSource = fs.readFileSync(appPath, 'utf8');

assert.equal(/\bfetch\s*\(/.test(source), false, 'Customer 360 must not fetch bundled public data');
assert.equal(/DATA_ROOT|DATA_SEED_KEY|autoLoadBundledData|CUSTOMER360_BUNDLED_SEED/.test(source), false, 'Bundled data loader markers must be absent');
assert.ok(source.includes('async function importPackage(file)'), 'Local import handler must remain');
assert.ok(source.includes("inp.type='file'"), 'Local file picker must remain');
assert.ok(appSource.includes('customers:CUSTOMERS'), 'Customer state must remain in the browser-local app state');
assert.ok(appSource.includes('localStorage.setItem(STORE_KEY,JSON.stringify(data))'), 'Customer state must persist to localStorage');

const storage = new Map();
const sandbox = {
  window: {
    state: { page: 'dashboard' },
    SEIN_INTERNAL: {
      getCurrentUser: () => ({ role: 'admin' }),
      saveAll: () => {},
      log: () => {},
      render: () => {},
      toast: () => {}
    }
  },
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  CUSTOMERS: [],
  console: { log() {}, warn() {}, error() {} },
  setTimeout: () => 0,
  clearTimeout: () => {},
  queueMicrotask: fn => fn()
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: customerPath });

const api = sandbox.window.SEIN_CUSTOMER360;
assert.ok(api, 'Customer 360 API must initialize');
assert.equal(api.importMode, 'local-file');

const mapped = api.mapPayload({
  customers: [{
    id: 'SYN-1',
    name: 'Synthetic Customer',
    country: 'AU',
    contacts: [{ name: 'Synthetic User', email: 'synthetic@example.invalid' }]
  }],
  memos: [{ targetType: 'customers', targetId: 'SYN-1', body: 'synthetic memo' }]
});

assert.equal(mapped.customers.length, 1);
assert.equal(mapped.memos.length, 1);
assert.equal(mapped.customers[0].memoCount, 1);

sandbox.CUSTOMERS.push(...mapped.customers);
const html = sandbox.window.pageCustomer();
assert.ok(html.includes('id="c360Import"'), 'Admin local import control must render');
assert.equal(/자동 로드|스냅샷이 이 버전에 포함/.test(html), false, 'UI must not claim public bundled data');

console.log('Customer 360 security smoke: PASS');


const migrationPath = 'site/full/customer360-migration.v1.5.1.js';
const indexPath = 'site/full/index.html';
const migrationSource = fs.readFileSync(migrationPath, 'utf8');
const indexSource = fs.readFileSync(indexPath, 'utf8');

assert.ok(indexSource.indexOf('./customer360-migration.v1.5.1.js?v=151') < indexSource.indexOf('./app.full.js'), 'Legacy seed remediation must run before app hydration');

function runMigration({store, marker='1753:3075'} = {}) {
  const storage = new Map();
  if (store !== undefined) storage.set('sein.full.v1.data', JSON.stringify(store));
  if (marker !== null) storage.set('sein.customer360.seed.2026-09-28', marker);
  const deleted = [];
  const context = {
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    indexedDB: { deleteDatabase: name => deleted.push(name) },
    console: { log() {}, warn() {}, error() {} },
    Date,
    JSON,
    Number,
    Array
  };
  vm.createContext(context);
  vm.runInContext(migrationSource, context, { filename: migrationPath });
  return {
    storage,
    deleted,
    state: storage.has('sein.full.v1.data') ? JSON.parse(storage.get('sein.full.v1.data')) : null,
    outcome: storage.get('sein.customer360.migration.2026-09-29')
  };
}

const seeded = runMigration({
  store: {
    customers: [{ id: 'SYN-SEEDED', name: 'Synthetic seeded record' }],
    audit: [{ at: '2026-09-29T12:58:00Z', action: 'CUSTOMER360_BUNDLED_SEED' }]
  }
});
assert.equal(seeded.state.customers.length, 0, 'Previously auto-seeded customer state must be purged');
assert.equal(seeded.outcome, 'purged');
assert.equal(seeded.storage.has('sein.customer360.seed.2026-09-28'), false);
assert.deepEqual(seeded.deleted, ['sein-customer360']);

const imported = runMigration({
  store: {
    customers: [{ id: 'SYN-ADMIN', name: 'Synthetic admin import' }],
    audit: [
      { at: '2026-09-29T13:20:00Z', action: 'CUSTOMER360_IMPORT' },
      { at: '2026-09-29T12:58:00Z', action: 'CUSTOMER360_BUNDLED_SEED' }
    ]
  }
});
assert.equal(imported.state.customers.length, 1, 'Later administrator import must be preserved');
assert.equal(imported.outcome, 'preserved-admin-import');
assert.deepEqual(imported.deleted, []);
assert.equal(imported.storage.has('sein.customer360.seed.2026-09-28'), false);

const untouched = runMigration({
  marker: null,
  store: { customers: [{ id: 'SYN-NO-MARKER' }], audit: [] }
});
assert.equal(untouched.state.customers.length, 1, 'Browsers without the legacy marker must be untouched');
assert.equal(untouched.outcome, undefined);

console.log('Customer 360 legacy seed migration smoke: PASS');
