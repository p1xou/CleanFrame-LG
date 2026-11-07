# Testing CleanFrame-LG

Source checks, browser tests, package builds and real-device testing provide different levels of evidence. Do not claim an LG TV feature works merely because JavaScript or a cloud build passed.

## Source and adapter checks

```sh
npm ci
npm run check
npm run check:lg
npm run check:public
```

These commands inspect code, resources, LG adapter behavior and public-source safety. They do not connect to a television and do not guarantee the absence of all vulnerabilities or secrets.

## Optional browser testing

```sh
npx playwright install chromium
npm run check:browser
npm run check:wallpaper
```

These tests run against the shared CleanFrame browser preview rather than the packaged LG runtime. They help check List/Dock layout, focus, navigation, wallpaper, settings and preferences. Use `CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser` to test bundled public fonts.

For manual UI review, run `npm run dev` and open `http://localhost:4795/home/`. Use arrow keys, Enter and Escape. Browser previews cannot validate launching native LG apps.

`check:wallpaper` injects the production LG wallpaper runtime into the shared UI and plays author-created synthetic landscape and portrait clips in Chromium. It exercises live previews, Cover/Contain geometry, OK/Back semantics, saved choices, retained photo/settings preferences, media/storage failure handling and exclusive decoder use with the ambient player. It does not download third-party footage, read private build media or contact a TV. Its generated report and screenshots stay under ignored `.local/qa/wallpaper/`.

An ordinary shared preview has no LG video catalogue. To review actual authorized local clips, prepare the LG build with `CLEANFRAME_WALLPAPER_MANIFEST` as described in [video-wallpaper.md](video-wallpaper.md). Browser success does not validate the LG hardware video plane, native cropping, small preview compositing, 4K decoding, HDR, frame pacing or the loop join.

## LG package checks

Build an LG IPK as described in [development.md](development.md), or run **Build LG preview** on GitHub Actions.

1. Confirm the package has the expected `appinfo.json`, LG adapter and required LG library.
2. Confirm that the Samsung `config.xml` is not included as the LG app manifest.
3. Review the exact IPK for credentials, private media and unauthorized font assets.
4. Keep the app ID stable for compatible development updates.
5. Record the package revision and checksum.

When using `CLEANFRAME_WALLPAPER_MANIFEST`, inspect the staged wallpaper catalogue and every copied media file. An omitted manifest should produce an empty catalogue with no stale wallpaper media. Keep source clips and manifests ignored; inspect generated packages separately because a local build can intentionally include private media.

## Physical LG TV checks

Perform these only with the device owner's explicit authorization and LG Developer Mode:

1. Install and open the app; verify safe exit to native LG Home.
2. Check Dock/List navigation, focus visibility, OK/Back actions and remote usability.
3. Verify settings, wallpapers, app order and persisted preferences after reopening.
4. Launch configured applications that are actually installed, including YouTube if available, and record real results.
5. Confirm unavailable apps produce understandable errors.
6. Test the optional ambient player only when authorized media is packaged, including loop, pause/resume, mute and Back.
7. Confirm existing streaming accounts, image settings and HDMI inputs are unaffected.
8. Record TV model, webOS version, package version and observed limitations without personal device identifiers.

The project does not provide Samsung Art Mode, LG native Home replacement or global Home/Back interception.

For video wallpaper, additionally test Settings → Background → Video and reopening through the Wallpaper row. Confirm focus previews without saving, OK commits, Back discards only the unapplied candidate, per-clip fits survive reopening, and switching to Photo retains its prior selection and rotation. Compare portrait and landscape sources in both fits on the actual TV; Cover crops and Contain adds bars without stretching. Test optional prepared 16:9 variants if native-plane clipping differs from the browser.

Verify one active decoder when opening and closing the ambient player, releasing video while hidden or another sheet is active, and recovery after returning. Observe playback and several loop joins directly. Record source resolution/cadence separately from output-panel resolution; an upscale is not evidence of authentic 4K detail. Keep device responses, playback metadata and physical visual observations distinct when documenting results.

Review [PRIVACY-REVIEW.md](../PRIVACY-REVIEW.md) and [public-release.md](public-release.md) before public distribution.
