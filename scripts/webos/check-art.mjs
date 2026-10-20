import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const handlers = {}, timers = new Map();
let nextTimer = 0, media;
function element(tag) {
  const events = {};
  const el = { tag, style: {}, children: [], paused: true, videoWidth:3840, videoHeight:2160,
    setAttribute() {}, removeAttribute(name) { delete this[name]; },
    addEventListener(name, fn) { events[name] = fn; },
    appendChild(child) { this.children.push(child); child.parentNode = this; },
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); },
    play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; }, load() {},
    emit(name) { events[name]?.(); }
  };
  if (tag === 'video') media = el;
  return el;
}
const body = element('body');
const document = { body, hidden:false, createElement:element, getElementById() { return {focus(){}}; },
  addEventListener(name, fn) { handlers[name] = fn; } };
const window = { CleanFrameArtConfig: {src:'media/art.webm'} };
vm.runInNewContext(fs.readFileSync(new URL('../../webos/art-player.js',import.meta.url),'utf8'),
  { window, document, setTimeout(fn){timers.set(++nextTimer,fn);return nextTimer;}, clearTimeout(id){timers.delete(id);} });
let responses=[];
window.FrameArt.open(err=>responses.push(err));
assert.equal(body.children.length,1);
assert.equal(media.loop,true);
assert.equal(media.muted,true);
assert.equal(media.src,'media/art.webm');
media.emit('playing'); media.emit('playing');
assert.equal(responses.length,1);
assert.equal(responses[0],null);
assert.equal(window.FrameArt.state().width,3840);
let prevented=false;
handlers.keydown({keyCode:461,preventDefault(){prevented=true;},stopImmediatePropagation(){}});
assert(prevented); assert.equal(body.children.length,0); assert.equal(media.src,undefined);
window.FrameArt.open(err=>responses.push(err));
media.emit('error');
assert(responses.at(-1)); assert.equal(body.children.length,0);
window.FrameArt.open(err=>responses.push(err));
media.emit('playing'); document.hidden=true; handlers.visibilitychange();
assert.equal(window.FrameArt.state().active,false);
assert.equal(media.paused,true);
document.hidden=false;
window.FrameArt.open(err=>responses.push(err));
for(const fn of [...timers.values()]) fn();
assert(responses.at(-1)); assert.equal(body.children.length,0);
console.log('Ambient video checks passed: looping, muted playback, Back, hidden cleanup, load error and timeout.');
