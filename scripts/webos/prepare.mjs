// Offline source staging only. Never contacts a TV or installs software.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'dist/webos-app');
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, 'app'), out, { recursive: true });
fs.rmSync(path.join(out, 'config.xml'), { force: true });
if (fs.existsSync(path.join(out, 'assets/private-fonts'))) throw Error('Private font directory is forbidden');
fs.writeFileSync(path.join(out, 'assets/private-fonts.css'), '/* Public fonts only. */\n');
fs.writeFileSync(path.join(out, 'assets/font-catalog.js'), 'window.CleanFramePrivateFontIDs = ["geist", "newsreader"];\n');
const ids = JSON.parse(fs.readFileSync(path.join(root, 'webos/apps.json'), 'utf8'));
for (const [brand, id] of Object.entries(ids)) {
  if (!/^[a-z0-9]+$/.test(brand) || typeof id !== 'string' || (id && !/^[a-zA-Z0-9._-]+$/.test(id))) throw Error('Invalid app mapping');
}
fs.writeFileSync(path.join(out, 'lg-apps.js'), 'window.CleanFrameLGApps = ' + JSON.stringify(ids) + ';\n');
for (const file of ['device.js', 'appinfo.json']) fs.copyFileSync(path.join(root, 'webos', file), path.join(out, file));
fs.copyFileSync(path.join(root, 'webos/art-player.js'), path.join(out, 'art-player.js'));
fs.copyFileSync(path.join(root, 'webos/wallpaper-player.js'), path.join(out, 'wallpaper-player.js'));
const artSource = process.env.CLEANFRAME_ART_VIDEO;
for (const ext of ['.webm', '.mp4']) {
  const previous = path.join(out, 'media/art' + ext);
  if (fs.existsSync(previous)) fs.unlinkSync(previous);
}
let art = {};
if (artSource) {
  if (!fs.statSync(artSource).isFile()) throw Error('Ambient video must be a file');
  const ext = path.extname(artSource).toLowerCase();
  if (!['.webm', '.mp4'].includes(ext)) throw Error('Use a webm or mp4 ambient video');
  fs.mkdirSync(path.join(out, 'media'), { recursive: true });
  fs.copyFileSync(artSource, path.join(out, 'media/art' + ext));
  art = { src: 'media/art' + ext, title: 'OLED ambient video' };
}
fs.writeFileSync(path.join(out, 'art-config.js'), 'window.CleanFrameArtConfig = ' + JSON.stringify(art) + ';\n');
// This manifest is an explicit local build input, never a download or a rights grant.
const wallpaperDir = path.resolve(out, 'media/wallpapers');
if (path.dirname(wallpaperDir) !== path.resolve(out, 'media')) throw Error('Invalid wallpaper staging directory');
fs.rmSync(wallpaperDir, { recursive: true, force: true });
let wallpapers = [];
const manifestFile = process.env.CLEANFRAME_WALLPAPER_MANIFEST;
if (manifestFile) {
  const manifestPath = path.resolve(manifestFile);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entries = Array.isArray(manifest) ? manifest : manifest.clips;
  if (!Array.isArray(entries) || entries.length > 32) throw Error('Wallpaper manifest must contain up to 32 clips');
  const seen = new Set();
  const stageVideo = (file, name) => {
    if (typeof file !== 'string' || !file || /^[a-z]+:\/\//i.test(file)) throw Error('Wallpaper media must be a local file');
    const source = path.resolve(path.dirname(manifestPath), file);
    const ext = path.extname(source).toLowerCase();
    if (!['.mp4', '.webm'].includes(ext) || !fs.statSync(source).isFile()) throw Error('Wallpaper media must be an MP4 or WebM file');
    fs.mkdirSync(wallpaperDir, { recursive: true });
    fs.copyFileSync(source, path.join(wallpaperDir, name + ext));
    return 'media/wallpapers/' + name + ext;
  };
  wallpapers = entries.map((clip, index) => {
    if (!clip || !/^[a-z][a-z0-9_-]{0,47}$/.test(clip.id) || ['constructor', 'prototype', '__proto__'].includes(clip.id) || seen.has(clip.id)) throw Error('Wallpaper IDs must be unique local identifiers');
    if (typeof clip.title !== 'string' || !clip.title.trim() || clip.title.length > 80) throw Error('Wallpaper title must be 1–80 characters');
    if (clip.defaultFit !== undefined && !['cover', 'contain'].includes(clip.defaultFit)) throw Error('Wallpaper defaultFit must be cover or contain');
    seen.add(clip.id);
    const output = { id: clip.id, title: clip.title, defaultFit: clip.defaultFit || 'cover', src: stageVideo(clip.file, 'clip-' + index) };
    for (const fit of ['cover', 'contain']) {
      if (clip[fit + 'File']) output[fit + 'Src'] = stageVideo(clip[fit + 'File'], 'clip-' + index + '-' + fit);
    }
    return output;
  });
}
fs.writeFileSync(path.join(out, 'wallpaper-config.js'), 'window.CleanFrameWallpaperConfig = ' + JSON.stringify(wallpapers) + ';\n');
for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) fs.copyFileSync(path.join(root, file), path.join(out, file));
let main = fs.readFileSync(path.join(out, 'main.js'), 'utf8');
let count = 0;
main = main.replace(/appId: '[^']+'/g, () => { count++; return 'appId: \'\''; });
if (count !== 9) throw Error('Upstream app catalogue changed: review adapter');
const needle = '  var PRIMARY = PRIMARY_APPS.map';
if (!main.includes(needle)) throw Error('Upstream catalogue hook changed');
main = main.replace(needle, '  PRIMARY_APPS.forEach(function (a) { a.appId = (window.CleanFrameLGApps || {})[a.id] || ""; });\n' + needle);
main = main.replaceAll('All apps', 'My apps').replaceAll('Loading installed apps', 'Checking configured LG apps');
main = main.replaceAll('Samsung Home', 'Exit CleanFrame').replaceAll('Samsung’s Home screen', 'the app exit screen').replaceAll("label: 'Samsung'", "label: 'LG TV'").replaceAll("samsung: 'Samsung'", "samsung: 'LG TV'").replaceAll("value: 'Home and TV settings'", "value: 'Exit and TV settings'").replaceAll("line: 'Open Exit CleanFrame?'", "line: 'Exit CleanFrame?'");
fs.writeFileSync(path.join(out, 'main.js'), main);
let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
html = html.replace('<script src="device.js">', '<script src="webOSTV.js"></script>\n<script src="lg-apps.js"></script>\n<script src="wallpaper-config.js"></script>\n<script src="wallpaper-player.js"></script>\n<script src="art-config.js"></script>\n<script src="art-player.js"></script>\n<script src="device.js">');
fs.writeFileSync(path.join(out, 'index.html'), html);
const sdk = process.env.CLEANFRAME_WEBOSTV_JS;
if (!sdk || !fs.existsSync(sdk)) throw Error('Set CLEANFRAME_WEBOSTV_JS to official LG webOSTV.js v1.2.13. Staging is incomplete until supplied.');
fs.copyFileSync(sdk, path.join(out, 'webOSTV.js'));
const sdkLicense = path.join(path.dirname(sdk), 'LICENSE-2.0.txt');
if (!fs.existsSync(sdkLicense)) throw Error('Missing LG library Apache license');
fs.copyFileSync(sdkLicense, path.join(out, 'webOSTV-LICENSE.txt'));
for (const name of ['main.js', 'device.js', 'lg-apps.js', 'art-player.js', 'wallpaper-player.js', 'wallpaper-config.js']) execFileSync(process.execPath, ['--check', path.join(out, name)]);
fs.writeFileSync(path.join(root, 'dist/webos-preparation.json'), JSON.stringify({
  upstream: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  target: 'LG OLED65B46LA / user-reported webOS 25 (10.3.2-33)',
  status: 'Prepared source; not physically verified; app IDs not inferred',
  systemWrites: false, tvContacted: false
}, null, 2));
console.log('Prepared dist/webos-app. No TV contacted.');
