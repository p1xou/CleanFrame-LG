// Paired pixels of actual production app labels. No TV connection.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { openPreview, root } from './browser.mjs';
const out = root + '.local/qa/' + (process.env.GALLERY_OUT || 'gallery-contrast') + '/';
mkdirSync(out, { recursive: true });
const records = [], errors = [], source = {};
for (const name of ['main.js', 'style.css', 'index.html', 'assets/wallpapers/catalog.js', 'assets/adaptive-ink.js']) {
  source[name] = createHash('sha256').update(readFileSync(root + 'app/' + name)).digest('hex');
}
const preview = await openPreview();
try {
  const page = await preview.browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push(r.url() + ' ' + r.failure()?.errorText));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  const walls = process.env.GALLERY_IDS ? process.env.GALLERY_IDS.split(',') : ['summit', 'goldcoast', 'sydney', 'amber', 'mint', 'alpine'];
  const fonts = process.env.GALLERY_FONTS ? process.env.GALLERY_FONTS.split(',') : ['manrope'];
  for (const font of fonts) for (const wall of walls) for (const layout of ['list', 'dock']) for (const material of ['soft', 'frost', 'tint']) for (const end of [false, true]) {
    await page.goto(preview.baseURL + '/home/');
    await page.waitForFunction(() => window.ShoreQA && ShoreQA.ready());
    await page.evaluate(look => ShoreQA.look(look), { bg: 'photo', wall, layout, material, font, focus: 'glass', apps: 'both', controls: 'text' });
    await page.waitForFunction(() => ShoreQA.ready());
    await page.evaluate(() => ShoreQA.scene('home'));
    await page.evaluate(({ layout, end }) => ShoreQA.nav(Array(8).fill(layout === 'list' ? end ? 'down' : 'up' : end ? 'right' : 'left')), { layout, end });
    await page.addStyleTag({ content: '#stage *{transition:none!important;animation:none!important}' });
    await page.waitForTimeout(120);
    const rows = await page.evaluate(layout => {
      const result = [], dock = document.querySelector('#dock').getBoundingClientRect();
      for (const row of document.querySelectorAll(layout === 'list' ? '.ph-row' : '#dock .tile')) {
        const el = row.querySelector(layout === 'list' ? '.ph-name' : '.label-ink'); if (!el) continue;
        const b = row.getBoundingClientRect(), r = el.getBoundingClientRect(), style = getComputedStyle(el);
        if (!r.width || !r.height || style.visibility === 'hidden') continue;
        const context = layout === 'list' ? b.y < 219 || b.y > 733 : b.x < dock.x + 16 || b.right > dock.right - 16;
        if (layout === 'list' ? r.y < 72 || r.bottom > 1016 : b.right < dock.x || b.x > dock.right) continue;
        const selected = row.classList.contains('is-focus');
        result.push({ x: r.x, y: r.y, width: r.width, height: r.height, fontSize: parseFloat(style.fontSize), kind: 'text', text: el.textContent, selected, context, target: context ? null : selected ? 4.5 : 3 });
      }
      return result;
    }, layout);
    const key = [font, wall, layout, material, end ? 'end' : 'start'].join('-');
    await page.screenshot({ path: out + key + '-actual.png' });
    const target = layout === 'list' ? '#stage .ph-name' : '#dock .label-ink';
    const hidden = await page.addStyleTag({ content: target + '{visibility:hidden!important}' });
    await page.screenshot({ path: out + key + '-background.png' }); await hidden.evaluate(e => e.remove());
    await page.addStyleTag({ content: '#stage{background:#000!important}#stage *{visibility:hidden!important;background:transparent!important;box-shadow:none!important;border-color:transparent!important;text-shadow:none!important;opacity:1!important;transition:none!important;-webkit-mask-image:none!important;mask-image:none!important}' + target + '{visibility:visible!important;color:#fff!important}' });
    await page.screenshot({ path: out + key + '-mask.png' });
    records.push({ key, bg: 'photo', font, wall, layout, material, end, rows });
    if (records.length % 12 === 0) console.log(records.length + ' paired app-label captures');
  }
} catch (error) { errors.push(error.message); throw error; }
finally {
  const after = Object.fromEntries(Object.keys(source).map(name => [name, createHash('sha256').update(readFileSync(root + 'app/' + name)).digest('hex')]));
  writeFileSync(out + 'captures.json', JSON.stringify({ source, after, records, errors }, null, 2) + '\n');
  await preview.close();
}
console.log(JSON.stringify({ sets: records.length, errors }));
