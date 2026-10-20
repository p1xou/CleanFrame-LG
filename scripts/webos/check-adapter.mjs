import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../../webos/device.js', import.meta.url), 'utf8');
function adapter(respond, onTV = true, ids = {}) {
  const calls = [];
  const window = { CleanFrameLGApps: ids, close() { calls.push('close'); } };
  if (onTV) {
    window.PalmSystem = {};
    window.webOS = { service: { request(uri, options) {
      calls.push({ uri, method: options.method, parameters: options.parameters });
      respond(options);
    } } };
  }
  vm.runInNewContext(source, { window, setTimeout, clearTimeout });
  return { api: window.FrameDevice, calls };
}
const invoke = (fn, ...args) => new Promise(resolve => fn(...args, (error, value) => resolve({ error, value })));
const missing = adapter(o => o.onSuccess({ exist: false }));
assert((await invoke(missing.api.launchApp, 'example.missing')).error);
assert.equal(missing.calls.length, 1);
const success = adapter(o => o.onSuccess(o.method === 'getAppLoadStatus' ? { exist: true } : { returnValue: true }));
assert.equal((await invoke(success.api.launchApp, 'example.real')).error, null);
assert.deepEqual(success.calls.map(c => c.method), ['getAppLoadStatus', 'launch']);
assert((await invoke(success.api.launchApp, '')).error);
const denied = adapter(o => o.onFailure({ errorCode: -104, errorText: 'Denied' }));
assert.match((await invoke(denied.api.launchApp, 'example.restricted')).error.detail, /-104/);
assert((await invoke(success.api.art)).error);
assert((await invoke(success.api.settings)).error);
assert((await invoke(success.api.apps)).error);
assert.equal(success.calls.length, 2);
const browser = adapter(() => {}, false);
assert((await invoke(browser.api.launchApp, 'example.real')).error);
assert.equal(browser.calls.length, 0);
const catalogue = adapter(o => o.onSuccess({ exist: o.parameters.appId !== 'missing' }), true,
  { netflix: 'netflix', youtube: 'missing', stremio: '' });
const found = await invoke(catalogue.api.apps);
assert.equal(found.error, null);
assert.equal(found.value.length, 1);
assert.equal(found.value[0].appId, 'netflix');
assert.equal(found.value[0].brand, 'netflix');
assert.equal(catalogue.calls.length, 2);
const failedCatalogue = adapter(o => o.onFailure({ errorText: 'Denied' }), true, { netflix: 'netflix' });
assert((await invoke(failedCatalogue.api.apps)).error);
console.log('Adapter checks passed: known app, absent app, denied request, browser, unsupported controls.');
