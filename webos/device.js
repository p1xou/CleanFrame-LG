/* webOS TV public API adapter. No privileged service or system writes. */
(function () {
  'use strict';
  var ids = window.CleanFrameLGApps || {};
  var names = { stremio: 'Stremio', netflix: 'Netflix', disneyplus: 'Disney+', youtube: 'YouTube', appletv: 'Apple TV', primevideo: 'Prime Video', abciview: 'ABC iview', sbs: 'SBS On Demand', applemusic: 'Apple Music' };
  function unsupported(done, message) {
    done({ message: message, detail: 'Use the LG remote Home or Settings button.' });
  }
  function request(method, parameters, done) {
    if (!window.webOS || !window.webOS.service || !window.PalmSystem) {
      done({ message: 'Open the packaged app on the LG TV to use this control.' }); return;
    }
    var finished = false, timer;
    function finish(err, value) {
      if (finished) return;
      finished = true; clearTimeout(timer); done(err, value);
    }
    timer = setTimeout(function () { finish({ message: 'The TV did not respond. Please try again.' }); }, 8000);
    try {
      window.webOS.service.request('luna://com.webos.applicationManager', {
        method: method, parameters: parameters,
        onSuccess: function (value) { finish(null, value); },
        onFailure: function (err) { finish({ message: 'The TV refused this request.', detail: String(err.errorCode || '') + ' ' + (err.errorText || '') }); }
      });
    } catch (err) { finish({ message: 'The request failed.', detail: err.message }); }
  }
  function launchApp(id, done) {
    if (!id) { done({ message: 'LG app ID has not been configured.', detail: 'This tile is a visual reference until its real LG app ID is supplied.' }); return; }
    request('getAppLoadStatus', { appId: id }, function (err, result) {
      if (err) { done(err); return; }
      if (!result.exist) { done({ message: 'This application is not installed on the TV.' }); return; }
      request('launch', { id: id }, done);
    });
  }
  window.FrameDevice = {
    launchApp: launchApp,
    launch: function (brand, done) { launchApp(ids[brand], done); },
    apps: function (done) {
      var brands = Object.keys(ids).filter(function (brand) { return ids[brand] && names[brand]; });
      var remaining = brands.length, results = [], firstError = null;
      if (!remaining) { done({ message: 'No LG applications have been configured yet.' }); return; }
      brands.forEach(function (brand) {
        request('getAppLoadStatus', { appId: ids[brand] }, function (err, value) {
          if (err) firstError = firstError || err;
          else if (value.exist) results.push({ appId: ids[brand], name: names[brand], brand: brand, icon: '' });
          remaining--;
          if (!remaining) {
            if (firstError) { done(firstError); return; }
            results.sort(function (a, b) { return a.name.localeCompare(b.name); });
            done(null, results);
          }
        });
      });
    },
    art: function (done) {
      if (!window.FrameArt) { done({ message: 'The ambient video player is unavailable.' }); return; }
      window.FrameArt.open(done);
    },
    home: function (done) {
      if (!window.PalmSystem) { unsupported(done, 'Exit is available in the packaged TV app.'); return; }
      window.close(); done(null);
    },
    settings: function (done) { unsupported(done, 'Open TV settings with the LG remote.'); }
  };
}());
