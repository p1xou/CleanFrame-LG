"""Read paired production screenshots; Pillow and NumPy are development tools only."""
import json
import os
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / '.local/qa' / os.environ.get('GALLERY_OUT', 'gallery-contrast')
manifest = json.loads((DATA / 'captures.json').read_text())


def luminance(image):
    value = np.asarray(image, dtype=float) / 255
    value = np.where(value <= .04045, value / 12.92, ((value + .055) / 1.055) ** 2.4)
    return value @ np.array([.2126, .7152, .0722])


samples = []
for capture in manifest['records']:
    name = capture['key']
    foreground = luminance(Image.open(DATA / (name + '-actual.png')).convert('RGB'))
    background = luminance(Image.open(DATA / (name + '-background.png')).convert('RGB'))
    mask = np.asarray(Image.open(DATA / (name + '-mask.png')).convert('L')) >= 250
    ratios = (np.maximum(foreground, background) + .05) / (np.minimum(foreground, background) + .05)
    for row in capture['rows']:
        x, y = max(0, int(np.floor(row['x']))), max(0, int(np.floor(row['y'])))
        right, bottom = min(1920, int(np.ceil(row['x'] + row['width']))), min(1080, int(np.ceil(row['y'] + row['height'])))
        values = ratios[y:bottom, x:right][mask[y:bottom, x:right]]
        p5 = float(np.percentile(values, 5)) if len(values) >= 20 else None
        samples.append(dict(key=name, font=capture['font'], wall=capture['wall'], layout=capture['layout'], material=capture['material'],
                            text=row['text'], context=row['context'], selected=row['selected'], corePixels=len(values), p5=p5,
                            meetsMinimum=None if p5 is None or row['target'] is None else p5 >= 3,
                            meetsTarget=None if p5 is None or row['target'] is None else p5 >= row['target']))
summary = dict(captures=len(manifest['records']), samples=len(samples), rated=sum(s['meetsMinimum'] is not None for s in samples),
               belowMinimum=sum(s['meetsMinimum'] is False for s in samples), targetMisses=sum(s['meetsTarget'] is False for s in samples),
               unmeasured=sum(s['p5'] is None for s in samples), errors=manifest['errors'], sourceStable=manifest['source'] == manifest['after'])
report = dict(method='Actual-composite P5 contrast at opaque glyph cores (mask >=250, no erosion). At least20 pixels required. Context rows in the deliberate edge fades are unrated. Minimum3; selected4.5 aspiration. Browser design measurement, not formal accessibility certification or TV measurement.', summary=summary, samples=samples)
output = ROOT / '.local/qa'
output.mkdir(parents=True, exist_ok=True)
(output / ('production-' + os.environ.get('GALLERY_OUT', 'gallery-contrast') + '.json')).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(summary, indent=2))
print(json.dumps([s for s in samples if s['meetsMinimum'] is False], indent=2))
