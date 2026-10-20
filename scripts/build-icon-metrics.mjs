import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { openPreview, root } from './browser.mjs';
const ids = readdirSync(root + 'app/assets/icons').filter(n => n.endsWith('.svg')).map(n => n.slice(0, -4));
const preview = await openPreview();
try {
  const page = await preview.browser.newPage();
  await page.goto(preview.baseURL + '/build/dock.html');
  const metrics = await page.evaluate(async ids => {
    const result = {}, size = 240;
    for (const id of ids) {
      const source = await (await fetch('/home/assets/icons/' + id + '.svg')).text();
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
      svg.setAttribute('width', size); svg.setAttribute('height', size);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const pixels = context.getImageData(0, 0, size, size).data;
      let left = size, top = size, right = -1, bottom = -1, ink = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const alpha = pixels[(y * size + x) * 4 + 3];
          ink += alpha / 255;
          if (alpha > 40) {
            left = Math.min(left, x); top = Math.min(top, y);
            right = Math.max(right, x); bottom = Math.max(bottom, y);
          }
        }
      }
      if (right < left || bottom < top) throw Error('Empty icon: ' + id);
      const width = right - left + 1, height = bottom - top + 1;
      result[id] = { n: size, x: left, y: top, w: width, h: height, fill: ink / (width * height) };
    }
    return result;
  }, ids);
  mkdirSync(root + '.local/materials', { recursive: true });
  writeFileSync(root + '.local/materials/metrics.js', '/* Visible SVG ink measured at build time. */\nwindow.FrameIconMetrics = ' + JSON.stringify(metrics) + ';\n');
  console.log('Measured ' + ids.length + ' icons. Output: .local/materials/metrics.js');
} finally { await preview.close(); }
