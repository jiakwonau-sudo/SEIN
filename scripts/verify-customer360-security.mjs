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
