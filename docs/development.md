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

## Architecture

- `app/`: original visual engine, assets, layouts, preferences and the original Tizen adapter.
- `webos/device.js`: LG device and app-launching adapter.
- `webos/apps.json`: configured LG application IDs.
- `webos/art-player.js`: optional ambient video player.
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

Alternatively, run **Build LG preview** in GitHub Actions to generate a reviewable IPK and SHA-256 checksum without installing tools locally. Successful packaging is not proof of functionality on physical hardware.

## Install and test

Use [LG Developer Mode](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) and the official LG CLI from an **authorized** device on the permitted network. Install the IPK following LG's documentation; do not publish connection secrets.

The app runs separately from the webOS launcher. It does not replace LG Home, intercept other applications' Back keys globally, root the TV or change firmware. Developer Mode sessions may expire.

Record actual tested hardware and firmware results without sharing the TV IP, serial number, keys or private logs. Follow [testing.md](testing.md) before claiming compatibility.

For design and interaction details carried over from Samsung, see [the upstream behavior reference](interaction-behaviour.md); its Samsung-only APIs are historical reference material.
