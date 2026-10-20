/* Native webOS HTML video. Media stays inside this app; no YouTube player. */
(function () {
  'use strict';
  var config = window.CleanFrameArtConfig || {}, layer = null, video = null;
  var timer = 0, pending = null, status = null;
  function settle(error) {
    var done = pending;
    pending = null;
    if (done) done(error || null);
  }
  function close(error) {
    clearTimeout(timer);
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    if (layer) layer.parentNode.removeChild(layer);
    layer = null; video = null; status = null;
    settle(error);
    var stage = document.getElementById('stage');
    if (stage) stage.focus();
  }
  function fail(message) {
    if (!layer) return;
    if (pending) { close({ message: message, detail: 'Try again, or return to CleanFrame.' }); return; }
    video.pause();
    status.textContent = message + ' — Back: return to CleanFrame';
    status.style.display = 'block';
  }
  function open(done) {
    if (layer) { done(null); return; }
    if (!config.src) { done({ message: 'No ambient video is included in this build.' }); return; }
    pending = done;
    layer = document.createElement('section');
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-label', 'Ambient video');
    layer.id = 'lg-art-player';
    layer.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:#000;z-index:10000;';
    video = document.createElement('video');
    video.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:#000;';
    video.loop = true; video.muted = true; video.controls = false; video.preload = 'auto';
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', config.title || 'OLED ambient video');
    status = document.createElement('p');
    status.style.cssText = 'position:absolute;left:5%;bottom:5%;color:#fff;font:24px Manrope,sans-serif;';
    status.textContent = 'Loading video… · Back: return to CleanFrame';
    layer.appendChild(video); layer.appendChild(status); document.body.appendChild(layer);
    var current = video;
    video.addEventListener('playing', function () {
      if (video !== current) return;
      clearTimeout(timer); status.style.display = 'none'; settle(null);
    });
    video.addEventListener('error', function () {
      if (video === current) fail('The TV could not play this video.');
    });
    timer = setTimeout(function () { fail('Video playback did not start.'); }, 8000);
    video.src = config.src;
    var result;
    try { result = video.play(); }
    catch (err) { fail('Video playback could not start.'); return; }
    if (result && result.catch) result.catch(function () {
      if (video === current) fail('The TV refused video playback.');
    });
  }
  document.addEventListener('keydown', function (event) {
    if (!layer) return;
    var code = event.keyCode;
    if ([461, 27, 8, 10009, 13, 37, 38, 39, 40, 415, 19, 413].indexOf(code) < 0) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (code === 461 || code === 27 || code === 8 || code === 10009 || code === 413) close();
    else if (code === 13 && !event.repeat) {
      if (video.paused) {
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () { fail('Playback could not resume.'); });
      } else video.pause();
    }
  }, true);
  document.addEventListener('visibilitychange', function () { if (document.hidden && layer) close(); });
  window.FrameArt = {
    open: open, close: close,
    state: function () { return { active: !!layer, paused: video ? video.paused : true,
      width: video ? video.videoWidth : 0, height: video ? video.videoHeight : 0,
      time: video ? video.currentTime : 0, duration: video ? video.duration : 0 }; }
  };
}());
