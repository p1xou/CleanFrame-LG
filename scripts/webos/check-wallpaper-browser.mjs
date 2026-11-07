// Production UI + native Chromium video, with an author-created in-memory clip.
// No TV, network media, third-party footage or private build inputs are used.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { openPreview, root } from '../browser.mjs';

const KEY = 'cleanframe.home.v1';
const runtime = readFileSync(root + 'webos/wallpaper-player.js', 'utf8');
const artRuntime = readFileSync(root + 'webos/art-player.js', 'utf8');
const main = readFileSync(root + 'app/main.js', 'utf8');
const output = root + '.local/qa/wallpaper/';
mkdirSync(output, { recursive: true });
const report = { scope: 'Production UI and native Chromium video; synthetic canvas footage only; no TV contacted.', passed: [], failures: [] };
const clips = [
  { id: 'qa-landscape', title: 'Synthetic landscape', src: 'media/wallpapers/qa-landscape.webm', defaultFit: 'cover' },
  { id: 'qa-portrait', title: 'Synthetic portrait', src: 'media/wallpapers/qa-portrait.webm', defaultFit: 'contain' },
  { id: 'qa-broken', title: 'Unavailable video', src: 'media/wallpapers/qa-broken.webm', defaultFit: 'cover' }
];
const seed = { dock: ['netflix', 'youtube', 'primevideo'], wallpaper: 'misty', mode: '15', lastApp: 'youtube', look: { bg: 'photo', layout: 'dock', apps: 'both', controls: 'both', focus: 'glass', material: 'soft', font: 'manrope', wall: 'misty' } };
let preview, landscape, portrait;

function harness(initial) {
  if (!sessionStorage.getItem('wallpaper-qa-seeded')) {
    localStorage.setItem('cleanframe.home.v1', JSON.stringify(initial));
    sessionStorage.setItem('wallpaper-qa-seeded', '1');
  }
  window.__failWrites = false;
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key === 'cleanframe.home.v1' && window.__failWrites) throw new DOMException('QA storage failure', 'QuotaExceededError');
    return set.call(this, key, value);
  };
  window.__setHidden = hidden => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => hidden ? 'hidden' : 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  };
}

async function syntheticVideo(width, height, durationMs = 1200) {
  const page = await preview.browser.newPage();
  try {
    const bytes = await page.evaluate(async ({ width, height, durationMs }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 200000 });
      const parts = [];
      recorder.ondataavailable = event => parts.push(event.data);
      const stopped = new Promise(resolve => { recorder.onstop = resolve; });
      let frame = 0;
      const draw = () => {
        context.fillStyle = '#1b303b'; context.fillRect(0, 0, width, height);
        context.fillStyle = '#dcbd73'; context.fillRect((frame * 4) % width, height / 3, width / 4, height / 3);
        frame++;
      };
      draw(); recorder.start();
      const timer = setInterval(draw, 1000 / 30);
      await new Promise(resolve => setTimeout(resolve, durationMs));
      clearInterval(timer); recorder.stop(); await stopped;
      stream.getTracks().forEach(track => track.stop());
      return Array.from(new Uint8Array(await new Blob(parts).arrayBuffer()));
    }, { width, height, durationMs });
    return Buffer.from(bytes);
  } finally { await page.close(); }
}

async function page({ catalog = clips, delayPortrait = false, holdFallback = false, initial = seed } = {}) {
  const current = await preview.browser.newPage({ viewport: { width: 1920, height: 1080 } });
  current.setDefaultTimeout(15000);
  current.on('pageerror', error => report.failures.push({ pageError: error.message }));
  await current.addInitScript(harness, initial);
  await current.route('**/home/main.js', route => route.fulfill({ contentType: 'text/javascript', body:
    'window.CleanFrameWallpaperConfig=' + JSON.stringify(catalog) + ';\n' + runtime + '\n' +
    'window.CleanFrameArtConfig={src:"media/wallpapers/qa-landscape.webm",title:"Synthetic Art test"};\n' + artRuntime + '\n' + main }));
  await current.route('**/media/wallpapers/*.webm', async route => {
    const file = route.request().url();
    if (file.includes('qa-broken')) return route.fulfill({ status: 404, body: 'QA missing video' });
    if (delayPortrait && file.includes('qa-portrait')) await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({ contentType: 'video/webm', body: file.includes('qa-portrait') ? portrait : landscape });
  });
  if (holdFallback) {
    let release, requested;
    const gate = new Promise(resolve => { release = resolve; });
    current.__fallbackRequested = new Promise(resolve => { requested = resolve; });
    current.__releaseFallback = release;
    await current.route(/\/home\/assets\/(?:wallpapers|materials)\/[^/]+\.jpg$/, async route => {
      requested();
      await gate;
      if (!current.isClosed()) await route.continue();
    });
  }
  await current.goto(preview.baseURL + '/home/');
  await current.waitForFunction(() => window.ShoreQA && ShoreQA.ready());
  return current;
}
const state = p => p.evaluate(() => ShoreQA.state());
const stored = p => p.evaluate(key => localStorage.getItem(key), KEY);
const nav = (p, ...keys) => p.evaluate(keys => ShoreQA.nav(keys), keys);
const act = async (p, action) => assert.ok(await p.evaluate(action => ShoreQA.activate(action), action), 'Missing action ' + action);
const open = async p => {
  await p.evaluate(() => ShoreQA.scene('appearance'));
  await act(p, 'choice.bg.video');
  await p.waitForFunction(() => ShoreQA.state().view === 'videoWallpaper');
};
const playing = p => p.waitForFunction(() => {
  const playback = FrameWallpaper.state(), chooser = ShoreQA.state().videoWallpaper;
  return playback.ready && !playback.paused && (!chooser.candidate ||
    chooser.ready && chooser.candidate.id === playback.id && chooser.candidate.fit === playback.fit);
});
const video = p => p.evaluate(() => {
  const v = document.querySelector('#lg-wallpaper-player video');
  return { state: FrameWallpaper.state(), count: document.querySelectorAll('video').length, muted: v && v.muted,
    volume: v && v.volume, loop: v && v.loop, controls: v && v.controls,
    box: v && { width: v.style.width, height: v.style.height, left: v.style.left, top: v.style.top } };
});
const keep = value => ({ home: value.home, recent: value.recent, lastApp: value.lastApp, wall: value.wall,
  mode: value.mode, layout: value.layout, apps: value.apps, controls: value.controls,
  focus: value.focus, material: value.material, font: value.font });
async function run(name, fn) {
  let current;
  try { current = await page(fn.options || {}); await fn(current); report.passed.push(name); console.log(name + ': passed'); }
  catch (error) { report.failures.push({ name, error: error.stack }); console.error(name + ': ' + error.message); }
  finally { if (current) { if (current.__releaseFallback) current.__releaseFallback(); await current.close(); } }
}

try {
  preview = await openPreview({ publicFonts: true });
  [landscape, portrait] = await Promise.all([syntheticVideo(320, 180), syntheticVideo(160, 240, 6000)]);
  await run('Preview, geometry and Back preserve preferences', async p => {
    const before = await stored(p);
    await open(p); await playing(p);
    let v = await video(p);
    assert.equal(v.state.id, 'qa-landscape'); assert.equal(v.count, 1);
    assert.ok(v.muted && v.loop && !v.controls); assert.equal(v.volume, 0);
    await nav(p, 'down'); await playing(p);
    v = await video(p); assert.equal(v.state.id, 'qa-portrait'); assert.equal(v.state.fit, 'contain');
    assert.deepEqual(v.box, { width: '720px', height: '1080px', left: '600px', top: '0px' });
    await nav(p, 'right', 'left'); await playing(p);
    v = await video(p); assert.equal(v.state.fit, 'cover');
    assert.deepEqual(v.box, { width: '1920px', height: '2880px', left: '0px', top: '-900px' });
    await p.screenshot({ path: output + 'video-picker.png' });
    assert.equal(await stored(p), before);
    await nav(p, 'back');
    assert.equal((await state(p)).view, 'appearance'); assert.equal((await video(p)).state.active, false);
    assert.equal(await stored(p), before);
  });
  await run('Apply and reload retain video, fit and existing settings', async p => {
    const before = keep((await state(p)).committed);
    await open(p); await nav(p, 'down'); await playing(p); await nav(p, 'ok');
    assert.equal((await state(p)).committed.bg, 'video');
    assert.equal((await state(p)).committed.videoWall, 'qa-portrait');
    assert.equal((await state(p)).committed.videoFits['qa-portrait'], 'contain');
    assert.deepEqual(keep((await state(p)).committed), before);
    await p.reload(); await p.waitForFunction(() => ShoreQA.ready()); await playing(p);
    assert.equal((await video(p)).state.id, 'qa-portrait'); assert.equal((await video(p)).state.fit, 'contain');
    assert.deepEqual(keep((await state(p)).committed), before);
    await p.screenshot({ path: output + 'video-home.png' });
  });
  const flat = async p => {
    const before = keep((await state(p)).committed);
    assert.equal((await state(p)).committed.bg, 'dark');
    await open(p); await playing(p); await nav(p, 'ok');
    await p.waitForFunction(() => ShoreQA.state().committed.bg === 'video');
    assert.deepEqual(keep((await state(p)).committed), before);
    assert.ok(await p.evaluate(() => {
      const photo = document.getElementById('photo');
      return photo.complete && photo.naturalWidth > 0 && photo.src.endsWith('/' + ShoreQA.state().committed.wall + '.jpg');
    }), 'Saved photo fallback must load when video is applied from a flat background');
    await nav(p, 'right', 'right'); await playing(p); await nav(p, 'ok');
    await p.waitForFunction(() => ShoreQA.state().committed.videoFits['qa-landscape'] === 'contain');
    const applied = await stored(p), writes = (await state(p)).writes;
    await nav(p, 'ok'); assert.equal((await state(p)).writes, writes); assert.equal(await stored(p), applied);
    await nav(p, 'up', 'down'); await playing(p);
    assert.equal((await video(p)).state.id, 'qa-portrait'); assert.equal(await stored(p), applied);
    await nav(p, 'back'); await playing(p);
    assert.equal((await video(p)).state.id, 'qa-landscape'); assert.equal((await video(p)).state.fit, 'contain');
    assert.equal(await stored(p), applied); assert.deepEqual(keep((await state(p)).committed), before);
    await p.screenshot({ path: output + 'video-background.png' });
  };
  flat.options = { initial: { ...seed, look: { ...seed.look, bg: 'dark' } } };
  await run('Apply from flat preserves fallback; fit is idempotent; Back restores latest applied video', flat);
  const switchDuringFallback = async p => {
    const before = await stored(p), kept = keep((await state(p)).committed), writes = (await state(p)).writes;
    await open(p); await playing(p); await nav(p, 'ok');
    await p.__fallbackRequested;
    assert.equal((await state(p)).committed.bg, 'dark');
    assert.equal((await state(p)).videoWallpaper.applying, true);
    await nav(p, 'down', 'right', 'left'); await playing(p); await nav(p, 'ok');
    assert.equal((await video(p)).state.id, 'qa-portrait');
    assert.equal((await video(p)).state.fit, 'cover');
    assert.equal((await state(p)).videoWallpaper.applying, true);
    assert.equal(await stored(p), before, 'Neither queued candidate saves before the photo fallback is ready');
    p.__releaseFallback();
    await p.waitForFunction(() => {
      const s = ShoreQA.state();
      return s.committed.bg === 'video' && s.committed.videoWall === 'qa-portrait' &&
        s.committed.videoFits['qa-portrait'] === 'cover' && !s.videoWallpaper.applying;
    }, null, { timeout: 3000 }); // Complete from the photo callback, before the six-second clip can loop.
    assert.equal((await state(p)).writes, writes + 1, 'Only the latest queued clip and fit commit');
    assert.deepEqual(keep((await state(p)).committed), kept);
    assert.ok(await p.evaluate(() => document.getElementById('photo').naturalWidth > 0));
  };
  switchDuringFallback.options = { holdFallback: true, initial: { ...seed, look: { ...seed.look, bg: 'dark' } } };
  await run('Latest clip and fit apply after a shared pending photo fallback', switchDuringFallback);
  await run('Suspend, sheets and Art share one active decoder', async p => {
    await open(p); await playing(p); await nav(p, 'ok', 'back'); await p.evaluate(() => ShoreQA.scene('home')); await playing(p);
    await p.evaluate(() => ShoreQA.scene('apps'));
    assert.equal((await video(p)).state.active, false);
    await nav(p, 'back'); await playing(p);
    await p.evaluate(() => __setHidden(true)); assert.equal((await video(p)).state.active, false);
    await p.evaluate(() => __setHidden(false)); await playing(p);
    const error = await p.evaluate(() => new Promise(resolve => FrameArt.open(resolve)));
    assert.equal(error, null);
    assert.equal((await video(p)).count, 1); assert.equal((await video(p)).state.active, false);
    await p.evaluate(() => FrameArt.close()); await playing(p); assert.equal((await video(p)).count, 1);
  });
  await run('Storage failure and unavailable media keep committed wallpaper', async p => {
    const before = await stored(p);
    await open(p); await playing(p);
    await p.evaluate(() => { window.__failWrites = true; }); await nav(p, 'ok');
    assert.equal(await stored(p), before); assert.equal((await state(p)).committed.bg, 'photo');
    await p.evaluate(() => { window.__failWrites = false; });
    await nav(p, 'down', 'down');
    await p.waitForFunction(() => document.querySelector('.detail-video .setting-error'));
    assert.equal(await stored(p), before); assert.equal((await state(p)).committed.bg, 'photo');
    await nav(p, 'back'); assert.equal((await video(p)).state.active, false);
  });
  await run('Failure after playback starts cannot save an unavailable clip', async p => {
    const before = await stored(p);
    await open(p); await playing(p);
    await p.evaluate(() => document.querySelector('#lg-wallpaper-player video').dispatchEvent(new Event('error')));
    await p.waitForFunction(() => document.querySelector('.detail-video .setting-error'));
    assert.equal(await stored(p), before); assert.equal((await state(p)).committed.bg, 'photo');
    await nav(p, 'back'); assert.equal((await video(p)).state.active, false);
    assert.equal(await stored(p), before);
  });
  const cancel = async p => {
    const before = await stored(p);
    await open(p); await playing(p);
    await nav(p, 'down', 'ok', 'back');
    await p.waitForTimeout(1100);
    assert.equal(await stored(p), before); assert.equal((await state(p)).committed.bg, 'photo');
    assert.equal((await video(p)).state.active, false);
  };
  cancel.options = { delayPortrait: true };
  await run('Back cancels queued apply before readiness', cancel);
  const empty = async p => {
    const before = await stored(p);
    await open(p); assert.match(await p.locator('#appearance').innerText(), /No video is included/);
    await nav(p, 'ok'); assert.equal(await stored(p), before); assert.equal((await state(p)).view, 'appearance');
    await act(p, 'choice.bg.video'); await nav(p, 'back');
    assert.equal(await stored(p), before); assert.equal((await state(p)).view, 'appearance');
  };
  empty.options = { catalog: [] };
  await run('Empty catalog remains reversible', empty);
} finally {
  writeFileSync(output + 'report.json', JSON.stringify(report, null, 2));
  if (preview) await preview.close();
}
if (report.failures.length) process.exitCode = 1;
else console.log('Wallpaper browser checks passed (' + report.passed.length + ').');
