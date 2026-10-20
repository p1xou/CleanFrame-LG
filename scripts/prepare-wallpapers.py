"""Prepare supplied originals in ignored staging; never replace app assets automatically.

The original nine photos retain their macOS sips recipe. The six newer photos
use Pillow (development dependency only); see docs/assets.md.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / '.local/materials/wallpapers'
PHOTOS = [
    ('misty', 'Misty coast', 'ganapathy-kumar-n4VMQZIkgDg-unsplash.jpg', 'Ganapathy Kumar', 'n4VMQZIkgDg', 'light'),
    ('cove', 'Quiet cove', 'joshua-wordel-1L_5PT7EKzU-unsplash.jpg', 'Joshua Wordel', '1L_5PT7EKzU', 'light'),
    ('forest', 'Forest mist', 'dejan-zakic-rr2EF3J5F2Y-unsplash.jpg', 'Dejan Zakic', 'rr2EF3J5F2Y', 'dark'),
    ('valley', 'Mountain valley', 'aniket-deole-M6XC789HLe8-unsplash.jpg', 'Aniket Deole', 'M6XC789HLe8', 'dark'),
    ('night', 'Desert stars', 'mohammad-alizade-4wzRuAb-KWs-unsplash.jpg', 'Mohammad Alizade', '4wzRuAb-KWs', 'light'),
    ('peaks', 'Blue peaks', 'john-rodenn-castillo-rQqWOHZ96OM-unsplash.jpg', 'John Rodenn Castillo', 'rQqWOHZ96OM', 'dark'),
    ('bridge', 'Bridge at dusk', 'justin-wolff-pbp_Ww2cewA-unsplash.jpg', 'Justin Wolff', 'pbp_Ww2cewA', 'dark'),
    ('ridge', 'Sunlit ridges', 'cristina-gottardi-wndpWTiDuT0-unsplash.jpg', 'Cristina Gottardi', 'wndpWTiDuT0', 'dark'),
    ('golden', 'Golden hour', 'big-sur-golden-hour.jpg', 'Karthik Sreenivas', 'tmtkhWbgMu8', 'dark'),
    ('summit', 'Sunlit summits', 'rudra-gupta-PuTSzJJ-qyU-unsplash.jpg', 'Rudra Gupta', 'PuTSzJJ-qyU', 'dark'),
    ('goldcoast', 'Gold Coast dusk', 'city-of-gold-coast-YiaGblobOGI-unsplash.jpg', 'City of Gold Coast', 'YiaGblobOGI', 'light'),
    ('sydney', 'Sydney Harbour', 'caleb-JmuyB_LibRo-unsplash.jpg', 'Caleb', 'JmuyB_LibRo', 'light'),
    ('amber', 'Amber hills', 'chris-barbalis-vazZtmYFgFY-unsplash.jpg', 'Chris Barbalis', 'vazZtmYFgFY', 'light'),
    ('mint', 'Mint wave', 'magicpattern-87PP9Zd7MNo-unsplash.jpg', 'MagicPattern', '87PP9Zd7MNo', 'light'),
    ('alpine', 'Alpine glow', 'cristina-gottardi-CSpjU6hYo_0-unsplash.jpg', 'Cristina Gottardi', 'CSpjU6hYo_0', 'light'),
]
COVER_IDS = {'summit', 'goldcoast', 'sydney', 'amber', 'mint', 'alpine'}


def file_hash(path):
    return sha256(path.read_bytes()).hexdigest()


def prepare_legacy(path, id):
    # Keep the reviewed nine-photo recipe unchanged, including aspect ratio.
    for tag, width, quality in [('', 1920, 87), ('-thumb', 512, 80)]:
        subprocess.run([
            'sips', '-Z', str(width), '-s', 'format', 'jpeg',
            '-s', 'formatOptions', str(quality), str(path),
            '--out', str(OUTPUT / (id + tag + '.jpg')),
        ], check=True, capture_output=True)


def prepare_cover(path, id, Image, ImageOps):
    with Image.open(path) as original:
        original.load()
        profile = original.info.get('icc_profile')
        image = ImageOps.exif_transpose(original).convert('RGB')
    background = ImageOps.fit(image, (1920, 1080), Image.Resampling.LANCZOS,
                              centering=(0.5, 0.5))
    thumbnail = background.resize((512, 288), Image.Resampling.LANCZOS)
    for tag, image, quality, subsampling in [
        ('', background, 90, 0), ('-thumb', thumbnail, 85, 2),
    ]:
        image.save(OUTPUT / (id + tag + '.jpg'), 'JPEG', quality=quality,
                   subsampling=subsampling, optimize=True, progressive=False,
                   icc_profile=profile)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path,
                        help='Folder containing the selected original Unsplash filenames')
    parser.add_argument('--ids', help='Comma-separated wallpaper IDs; default: all 15')
    args = parser.parse_args()
    requested = None if args.ids is None else {id.strip() for id in args.ids.split(',')}
    known = {photo[0] for photo in PHOTOS}
    if requested is not None and ('' in requested or requested - known):
        parser.error('--ids must contain these IDs: ' + ', '.join(photo[0] for photo in PHOTOS))
    selected = [photo for photo in PHOTOS if requested is None or photo[0] in requested]
    paths = {photo[0]: args.source / photo[2]
             for photo in selected}
    missing = [str(path) for path in paths.values() if not path.is_file()]
    if missing:
        parser.error('Missing selected originals:\n' + '\n'.join(missing))
    if any(photo[0] not in COVER_IDS for photo in selected) and not shutil.which('sips'):
        parser.error('The original nine-photo recipe requires macOS sips.')
    Image = ImageOps = None
    if any(photo[0] in COVER_IDS for photo in selected):
        try:
            from PIL import Image, ImageOps
        except ImportError:
            parser.error('The six newer photos require Pillow. See docs/assets.md.')

    OUTPUT.mkdir(parents=True, exist_ok=True)
    items = []
    for id, name, filename, credit, source, tone in selected:
        path = paths[id]
        original_hash = file_hash(path)
        if id in COVER_IDS:
            prepare_cover(path, id, Image, ImageOps)
        else:
            prepare_legacy(path, id)
        if file_hash(path) != original_hash:
            raise RuntimeError('Original changed while preparing: ' + str(path))
        background, thumbnail = OUTPUT / (id + '.jpg'), OUTPUT / (id + '-thumb.jpg')
        items.append(dict(
            id=id, name=name, src='assets/wallpapers/' + background.name,
            thumb='assets/wallpapers/' + thumbnail.name, pos='50% 50%',
            tone=tone, credit=credit, source='https://unsplash.com/photos/' + source,
            originalBytes=path.stat().st_size, backgroundBytes=background.stat().st_size,
            thumbnailBytes=thumbnail.stat().st_size, originalSha256=original_hash,
            backgroundSha256=file_hash(background), thumbnailSha256=file_hash(thumbnail),
        ))
        print(id, 'background', background.stat().st_size, 'thumbnail', thumbnail.stat().st_size)
    # A partial run records only its selected IDs; app/SOURCES.json is never changed.
    (OUTPUT / 'SOURCES.json').write_text(json.dumps(items, indent=2) + '\n')
    print('Generated', len(items), 'backgrounds and thumbnails in', OUTPUT)
    print('Source bytes', sum(x['originalBytes'] for x in items),
          'TV background bytes', sum(x['backgroundBytes'] for x in items))
    print('Original hashes unchanged. Review staged files before copying into app assets.')


if __name__ == '__main__':
    main()
