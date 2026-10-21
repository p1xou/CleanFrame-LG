# CleanFrame LG

A CleanFrame adaptation for LG webOS TVs, developed by **Naim**.

This project builds on the code and design of **[CleanFrame](https://github.com/nthnclrk/CleanFrame)**, created by **[Nathan Clark (@nthnclrk)](https://github.com/nthnclrk)** for Samsung The Frame. The original concept, Dock/List layouts and most of the visual engine are his work. Naim adapted the platform integration for LG webOS and added an ambient video player. Thank you to Nathan for sharing CleanFrame under MIT and encouraging adaptations.

This is an independent adaptation, not endorsed or maintained by Nathan Clark, LG, Samsung or the streaming services.

## LG features

- Original photographic interface, Dock/List layouts, remote focus navigation and local preferences.
- Launching existing apps through LG's public API; accounts remain inside their respective apps.
- A configured application catalog checked with `getAppLoadStatus`.
- An internal ambient video player: looping, muted playback, OK to pause/resume and Back to close.
- Additive installation through Developer Mode and the official LG CLI, without root.

The interface and Netflix, YouTube, Prime Video, Stremio and Apple TV launch targets have been tested on an LG OLED B4 running webOS 25. This does not establish compatibility with every model, region or firmware. The IDs in `webos/apps.json` are public application identifiers, not account credentials.

## Limitations

Home remains the LG system Home button. Back belongs to the active application; CleanFrame cannot intercept it globally inside other apps. Automatic startup and system launcher replacement are not provided. An LG Quick Access number shortcut can reopen CleanFrame where supported.

Developer Mode sessions are time-limited: use EXTEND before expiration. Disabling Developer Mode can remove development apps. Avoid Clear Cache Data, which also affects other apps' caches.

The ambient player is not Samsung Art Mode or an LG hardware low-power mode. It does not change system OLED protections. 4K playback depends on the media and decoder; the loop boundary may have a visible transition.

## Cloud builds

In Actions, manually run **Build LG preview**. The workflow checks the source, uses public fonts and packages the app with the official LG CLI. Its artifact contains an IPK and SHA-256 checksum. No TV credentials or home-network access are needed to build.

No SSH keys, TV network address, passphrase, connection logs or private video are included in this repository. Without a supplied media file, the ambient button reports that no video is included. The private demonstration video is not part of the cloud build.

## Local preparation

Prerequisites: Node.js 22+, Python 3.10+, the official `@webos-tools/cli` and LG webOSTV.js 1.2.13. See [LG CLI installation](https://webostv.developer.lge.com/develop/tools/cli-installation) and [webOSTV.js](https://webostv.developer.lge.com/develop/references/webostvjs-introduction).

```text
npm ci
npm run check
npm run check:lg
npm run check:public
```

Set `CLEANFRAME_WEBOSTV_JS` to the official webOSTV.js file with its adjacent license. Optionally set `CLEANFRAME_ART_VIDEO` to an MP4 or WebM file you are authorized to use. Keep private media in `.local/`. Then run:

```text
npm run prepare:lg
ares-package dist/webos-app -o dist
```

The `app/` source retains the original visual engine and Tizen adapter for comparison. LG preparation replaces the adapter, IDs and metadata in `dist/webos-app`. Do not install the Tizen manifest on an LG TV. Historical documents under `docs/` describe the original Samsung project; this README describes the LG adaptation.

Follow [LG Developer Mode instructions](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) from an authorized computer on the same network. Device configuration and keys stay on that computer. Never add them to the repository or Actions logs.

## Development and contributions

Want to customize CleanFrame-LG, fix a bug, or improve compatibility with another LG webOS TV? Start with the [contributor workflow](WORKFLOW.md). It is written for both human developers and AI coding agents and covers understanding the codebase, making changes, running checks, testing on a TV, and proposing contributions.

You can fork the repository and develop your changes in your own environment. Preserve the original CleanFrame attribution and third-party licensing requirements, and never commit TV pairing credentials, private media, or other sensitive files.

A GitHub commit or cloud build does not automatically install an update on your TV. Follow the installation instructions above when testing a new package.

## License and credits

The original code is covered by [MIT](LICENSE), with Nathan Clark's copyright retained. Naim's LG additions are also under MIT. Fonts, photographs and trademarks retain the terms in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The code license does not grant redistribution rights for YouTube videos; no downloaded video is included.

See [CREDITS.md](CREDITS.md) and [PRIVACY-REVIEW.md](PRIVACY-REVIEW.md).
