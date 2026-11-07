# Developing CleanFrame-LG

This guide covers the LG webOS adaptation. The original CleanFrame was developed for Samsung Tizen; its Tizen signing, installation and native Home instructions **do not work on LG televisions**.

Start with [README.md](../README.md) and [WORKFLOW.md](../WORKFLOW.md).

## Prerequisites

For local development use Node.js 22+, Python 3.10+ and npm. Building an LG IPK also requires the official [LG webOS CLI](https://webostv.developer.lge.com/develop/tools/cli-installation) and LG [webOSTV.js](https://webostv.developer.lge.com/develop/references/webostvjs-introduction) 1.2.13 with its accompanying license.

```sh
npm ci
npm run check
npm run check:lg
npm run check:public
```

Optional browser tests require Playwright Chromium: `npx playwright install chromium`, then `npm run check:browser`.

The video wallpaper browser check is `npm run check:wallpaper`. It uses synthetic clips with the production UI and Chromium playback, without TV access or third-party footage. See [testing.md](testing.md) for its scope.

## Architecture

- `app/`: original visual engine, assets, layouts, preferences and the original Tizen adapter.
- `webos/device.js`: LG device and app-launching adapter.
- `webos/apps.json`: configured LG application IDs.
- `webos/art-player.js`: optional ambient video player.
- `webos/wallpaper-player.js`: optional Home video wallpaper and live Settings preview, sharing one video instance and releasing it for the ambient player.
- `webos/appinfo.json`: webOS package metadata and installed app ID.
- `scripts/webos/prepare.mjs`: assembles the webOS application under ignored `dist/webos-app/`.

The browser preview (`npm run dev`, then `http://localhost:4795/home/`) serves the shared `app/` source. It can demonstrate the interface but **does not emulate LG system APIs**.

Preserve the existing package ID and local preference behavior when making updates. Keep LG-specific changes in the adapter where practical. Do not package the Samsung `app/config.xml` for LG.

## Build

Download the official LG webOSTV.js file and retain its adjacent `LICENSE-2.0.txt`. Pass the library path via `CLEANFRAME_WEBOSTV_JS`:

```sh
CLEANFRAME_WEBOSTV_JS=/path/to/webOSTV.js npm run prepare:lg
ares-package dist/webos-app -o dist
```

Optionally supply a licensed MP4 or WebM ambient video with `CLEANFRAME_ART_VIDEO`. Personal media is not included by default and should never be uploaded without redistribution rights.

For optional video wallpapers, set `CLEANFRAME_WALLPAPER_MANIFEST` to a JSON manifest under ignored `.local/`. It contains `clips` with `id`, `title`, `file`, a `defaultFit` of `cover` or `contain`, and optional `coverFile`/`containFile` paths relative to the manifest. See [video-wallpaper.md](video-wallpaper.md) for the complete example and validation rules. The build copies selected local MP4/WebM files without transcoding; no media is downloaded or included by default. Preserve `CLEANFRAME_ART_VIDEO` when rebuilding a private package that needs its existing authorized ambient clip.

Settings → Background → Video opens the Video wallpaper picker. Focus previews without saving; OK applies, and Back restores the latest applied choice. Fit is saved per clip. The Wallpaper row reopens this picker when Video is active; photo selection and rotation settings remain retained.

LG supports a single simultaneous video stream. Do not introduce separate preview and Home decoders or overlap the wallpaper with the ambient player. Native video-plane clipping and small preview behavior can differ from Chromium, and `object-fit` alone is not a TV compatibility guarantee. Use authorized pre-fitted 16:9 variants when needed and verify on the target TV. Keep the existing graphics resolution and package identity; browser tests cannot prove 4K decoding, fluidity or a gapless loop.

Alternatively, run **Build LG preview** in GitHub Actions to generate a reviewable IPK and SHA-256 checksum without installing tools locally. Successful packaging is not proof of functionality on physical hardware.

## Install and test

Use [LG Developer Mode](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) and the official LG CLI from an **authorized** device on the permitted network. Install the IPK following LG's documentation; do not publish connection secrets.

The app runs separately from the webOS launcher. It does not replace LG Home, intercept other applications' Back keys globally, root the TV or change firmware. Developer Mode sessions may expire.

Record actual tested hardware and firmware results without sharing the TV IP, serial number, keys or private logs. Follow [testing.md](testing.md) before claiming compatibility.

For design and interaction details carried over from Samsung, see [the upstream behavior reference](interaction-behaviour.md); its Samsung-only APIs are historical reference material.
