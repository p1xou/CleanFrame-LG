// State/lifecycle checks use fake media, not a claim about the TV's decoder.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const handlers = {}, timers = new Map(), videos = [], notifications = [];
let nextTimer = 0;
function element(tag) {
  const events = {};
  const el = { tag, style: {}, className: '', children: [], paused: true,
    videoWidth: 1080, videoHeight: 1920, duration: 6, currentTime: 0, readyState: 2,
    setAttribute() {}, removeAttribute(name) { delete this[name]; },
    addEventListener(name, fn) { (events[name] ||= []).push(fn); },
    appendChild(child) { this.children.push(child); child.parentNode = this; },
    insertBefore(child, first) { const index = this.children.indexOf(first); this.children.splice(index < 0 ? 0 : index, 0, child); child.parentNode = this; },
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; },
    play() { this.paused = false; return { catch: fn => { this.reject = fn; } }; },
    pause() { this.paused = true; }, load() {}, focus() {},
    emit(name) { for (const fn of events[name] || []) fn(); }
  };
  Object.defineProperty(el, 'firstChild', { get: () => el.children[0] });
  if (tag === 'video') videos.push(el);
  return el;
}
const body = element('body'), bg = element('bg'), stage = element('stage');
body.appendChild(bg); bg.appendChild(element('photo'));
const document = { body, hidden: false, createElement: element,
  getElementById(id) { return id === 'bg' ? bg : id === 'stage' ? stage : null; },
  addEventListener(name, fn) { (handlers[name] ||= []).push(fn); },
  createEvent() { return { initEvent(type) { this.type = type; } }; },
  dispatchEvent(event) { notifications.push(event.type); for (const fn of handlers[event.type] || []) fn(event); }
};
const window = { CleanFrameWallpaperConfig: [
  { id: 'portrait', title: 'Portrait', src: 'media/wallpapers/clip-0.mp4', containSrc: 'media/wallpapers/clip-0-contain.mp4' },
  { id: 'wide', title: 'Wide', src: 'media/wallpapers/clip-1.webm', defaultFit: 'contain' },
  { id: 'remote', src: 'https://example.invalid/video.mp4' },
  { id: 'constructor', src: 'media/wallpapers/reserved.mp4' },
  { id: 'portrait', src: 'media/wallpapers/duplicate.mp4' }
], CleanFrameArtConfig: { src: 'media/art.webm' } };
const context = vm.createContext({ window, document, isFinite,
  setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); } });
const execute = name => vm.runInContext(fs.readFileSync(new URL('../../webos/' + name, import.meta.url), 'utf8'), context);
execute('wallpaper-player.js'); execute('art-player.js');
const player = window.FrameWallpaper;
const media = () => videos.at(-1);
const mountedVideos = (node = body) => (node.tag === 'video' ? 1 : 0) + node.children.reduce((n, child) => n + mountedVideos(child), 0);
const hidden = value => { document.hidden = value; document.dispatchEvent({ type: 'visibilitychange' }); };
const expire = () => { for (const fn of [...timers.values()]) fn(); };
let responses = [];
assert.equal(player.available().length, 2, 'unsafe/duplicate sources omitted');
player.show({ id: 'portrait', fit: 'cover' }, error => responses.push(error));
const old = media();
assert.equal(mountedVideos(), 1); assert.equal(old.loop, true); assert.equal(old.muted, true); assert.equal(old.volume, 0);
old.emit('loadedmetadata'); old.emit('playing'); old.emit('playing');
assert.equal(responses.length, 1); assert.equal(responses[0], null);
assert.equal(old.style.width, '1920px'); assert.equal(parseFloat(old.style.height), 1920 / 1080 * 1920);
assert(parseFloat(old.style.top) < 0); assert(bg.className.includes('wallpaper-video-active'));

player.show({ id: 'portrait', fit: 'contain' }, error => responses.push(error));
assert.equal(old.src, undefined); assert.equal(old.paused, true);
assert.equal(media().src, 'media/wallpapers/clip-0-contain.mp4');
media().emit('playing');
assert.equal(media().style.width, '607.5px'); assert.equal(media().style.height, '1080px');
assert.equal(media().style.left, '656.25px'); assert.equal(mountedVideos(), 1);
old.reject(); old.emit('playing'); assert.equal(player.state().fit, 'contain'); assert.equal(player.state().ready, true);

window.FrameArt.open(error => assert.equal(error, null));
assert.equal(player.state().active, false); assert.equal(player.state().suspended, true); assert.equal(mountedVideos(), 1, 'art exclusively owns decoder');
const art = media(); art.emit('playing'); window.FrameArt.close();
assert.equal(art.src, undefined); assert.equal(mountedVideos(), 1); assert.equal(player.state().active, true);
media().emit('playing');
hidden(true); assert.equal(mountedVideos(), 0); assert.equal(player.state().active, false);
hidden(false); assert.equal(mountedVideos(), 1); media().emit('playing');
assert.equal(player.state().id, 'portrait');

player.hide(); assert.equal(mountedVideos(), 0); assert.equal(player.state().id, null);
assert(!bg.className.includes('wallpaper-video-active'));
responses = [];
player.show({ id: 'wide', fit: 'cover' }, error => responses.push(error));
const cancelled = media(); player.hide(); cancelled.emit('error'); cancelled.emit('playing'); cancelled.reject();
assert.equal(responses.length, 0, 'cancelled load cannot apply or report stale failures');
assert.equal(player.state().active, false);
player.show({ id: 'wide', fit: 'cover' }, error => responses.push(error)); expire();
assert.equal(responses.length, 1); assert(responses[0]); assert(player.state().error); assert.equal(mountedVideos(), 0);
player.show({ id: 'wide', fit: 'cover' }, error => responses.push(error)); media().emit('playing');
assert.equal(responses.length, 2); assert.equal(responses[1], null, 'failed selection can retry');
media().readyState = 4; media().emit('stalled');
assert.equal(timers.size, 0, 'buffered playback ignores a stalled fetch');
media().readyState = 2; media().emit('waiting'); media().currentTime = 2; expire();
assert.equal(player.state().ready, true, 'progressing playback survives the stall watchdog');
expire(); assert(player.state().error); assert.equal(mountedVideos(), 0, 'no-progress playback times out');

hidden(true); responses = [];
player.show({ id: 'wide', fit: 'contain' }, error => responses.push(error));
assert.equal(mountedVideos(), 0); hidden(false); assert.equal(mountedVideos(), 1);
media().emit('error'); assert.equal(responses.length, 1); assert(responses[0]);
assert(notifications.includes('cleanframewallpaperchange'));
player.hide();
console.log('Wallpaper lifecycle checks passed: silent loop, crop/contain geometry, cancellation, timeout, stall, hidden cleanup and exclusive art decoder. TV rendering remains unverified.');
