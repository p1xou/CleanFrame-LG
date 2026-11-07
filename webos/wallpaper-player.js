/* One native video decoder shared by Home and its live Settings preview. */
(function () {
  'use strict';
  var raw = window.CleanFrameWallpaperConfig || [], clips = [], desired = null;
  var video = null, layer = null, bg = null, generation = 0, timer = 0;
  var pending = null, ready = false, error = null, blocked = {}, metadata = {};
  raw.forEach(function (clip) {
    if (!clip || !/^[a-z][a-z0-9_-]{0,47}$/.test(clip.id) || ['constructor', 'prototype', '__proto__'].indexOf(clip.id) >= 0 || !validSource(clip.src)) return;
    if (find(clip.id)) return;
    clips.push({ id: clip.id, title: String(clip.title || clip.id), src: clip.src,
      defaultFit: clip.defaultFit === 'contain' ? 'contain' : 'cover',
      coverSrc: validSource(clip.coverSrc) ? clip.coverSrc : null,
      containSrc: validSource(clip.containSrc) ? clip.containSrc : null });
  });
  function validSource(src) { return typeof src === 'string' && /^media\/wallpapers\/[a-z0-9_-]+(?:-(?:cover|contain))?\.(?:mp4|webm)$/.test(src); }
  function find(id) { for (var i = 0; i < clips.length; i++) if (clips[i].id === id) return clips[i]; return null; }
  function notify() {
    if (!document.createEvent) return;
    var event = document.createEvent('Event');
    event.initEvent('cleanframewallpaperchange', false, false);
    document.dispatchEvent(event);
  }
  function settle(err) { var done = pending; pending = null; if (done) done(err || null); }
  function classOn(on) {
    if (!bg) return;
    bg.className = bg.className.replace(/\s*wallpaper-video-active\b/g, '') + (on ? ' wallpaper-video-active' : '');
  }
  function release() {
    generation++; clearTimeout(timer); timer = 0; ready = false;
    classOn(false);
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    video = null; layer = null;
  }
  function fail(message) {
    error = { message: message, detail: 'The saved photo remains available. Try again or choose Photo.' };
    release(); settle(error); notify();
  }
  function hasBlock() { return document.hidden || blocked.art || Object.keys(blocked).some(function (key) { return blocked[key]; }); }
  function arm(message, token, watchProgress) {
    clearTimeout(timer);
    var sampledTime = video ? video.currentTime : 0;
    timer = setTimeout(function () {
      if (token !== generation || !video) return;
      // A stalled fetch can coexist with healthy buffered playback. Sample only
      // at this bounded watchdog, never on frames or the navigation path.
      if (watchProgress && !video.paused && video.currentTime !== sampledTime) { arm(message, token, true); return; }
      fail(message);
    }, 8000);
  }
  function geometry(current) {
    var width = current.videoWidth, height = current.videoHeight;
    if (!width || !height || !desired) return false;
    var scale = desired.fit === 'contain' ? Math.min(1920 / width, 1080 / height) : Math.max(1920 / width, 1080 / height);
    current.style.width = (width * scale) + 'px'; current.style.height = (height * scale) + 'px';
    current.style.left = ((1920 - width * scale) / 2) + 'px'; current.style.top = ((1080 - height * scale) / 2) + 'px';
    metadata = { width: width, height: height, duration: isFinite(current.duration) ? current.duration : null };
    return true;
  }
  function start() {
    if (!desired || hasBlock()) return;
    var clip = find(desired.id);
    if (!clip) { fail('This video is unavailable in this build.'); return; }
    bg = document.getElementById('bg');
    if (!bg) { fail('The wallpaper surface is unavailable.'); return; }
    release(); error = null; metadata = {};
    layer = document.createElement('div'); layer.id = 'lg-wallpaper-player';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;background:#101214;pointer-events:none;';
    video = document.createElement('video');
    video.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;max-width:none;';
    video.loop = true; video.muted = true; video.defaultMuted = true; video.volume = 0;
    video.controls = false; video.preload = 'auto';
    video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
    layer.appendChild(video); bg.insertBefore(layer, bg.firstChild);
    var current = video, token = generation;
    function live() { return current === video && token === generation; }
    current.addEventListener('loadedmetadata', function () { if (live()) geometry(current); });
    current.addEventListener('playing', function () {
      if (!live()) return;
      if (!geometry(current)) { fail('This video has no usable image dimensions.'); return; }
      clearTimeout(timer); timer = 0; ready = true; error = null; classOn(true); settle(null); notify();
    });
    current.addEventListener('error', function () { if (live()) fail('This video could not be played.'); });
    current.addEventListener('waiting', function () { if (live()) arm('Video playback stalled.', token, true); });
    current.addEventListener('stalled', function () {
      if (live() && (!ready || current.readyState < 3)) arm('Video playback stalled.', token, true);
    });
    arm('Video playback did not start.', token);
    current.src = (desired.fit === 'contain' ? clip.containSrc : clip.coverSrc) || clip.src;
    var result;
    try { result = current.play(); }
    catch (err) { if (live()) fail('Video playback could not start.'); return; }
    if (result && result.catch) result.catch(function () { if (live()) fail('Video playback was refused.'); });
  }
  function show(selection, done) {
    done = typeof done === 'function' ? done : function () {};
    var clip = selection && find(selection.id), fit = selection && selection.fit;
    if (!clip) { done({ message: 'This video is unavailable in this build.' }); return; }
    if (fit !== 'cover' && fit !== 'contain') fit = clip.defaultFit;
    if (desired && desired.id === clip.id && desired.fit === fit && !error) {
      if (ready) done(null); else pending = done;
      return;
    }
    release(); desired = { id: clip.id, fit: fit }; error = null; pending = done;
    start();
  }
  function hide() { pending = null; desired = null; error = null; metadata = {}; release(); }
  function suspend(reason) { blocked[reason || 'external'] = true; release(); }
  function resume(reason) { delete blocked[reason || 'external']; if (desired && !video && !hasBlock()) start(); }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) suspend('hidden'); else resume('hidden');
  });
  window.FrameWallpaper = {
    available: function () { return clips.map(function (clip) { return { id: clip.id, title: clip.title, defaultFit: clip.defaultFit }; }); },
    show: show, hide: hide, suspend: suspend, resume: resume,
    state: function () { return { active: !!video, ready: ready, id: desired ? desired.id : null, fit: desired ? desired.fit : null,
      paused: video ? video.paused : true, error: error, width: metadata.width || 0, height: metadata.height || 0,
      duration: metadata.duration || null, time: video ? video.currentTime : 0, suspended: hasBlock() }; }
  };
}());
