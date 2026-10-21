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
```

These tests run against the shared CleanFrame browser preview rather than the packaged LG runtime. They help check List/Dock layout, focus, navigation, wallpaper, settings and preferences. Use `CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser` to test bundled public fonts.

For manual UI review, run `npm run dev` and open `http://localhost:4795/home/`. Use arrow keys, Enter and Escape. Browser previews cannot validate launching native LG apps.

## LG package checks

Build an LG IPK as described in [development.md](development.md), or run **Build LG preview** on GitHub Actions.

1. Confirm the package has the expected `appinfo.json`, LG adapter and required LG library.
2. Confirm that the Samsung `config.xml` is not included as the LG app manifest.
3. Review the exact IPK for credentials, private media and unauthorized font assets.
4. Keep the app ID stable for compatible development updates.
5. Record the package revision and checksum.

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

Review [PRIVACY-REVIEW.md](../PRIVACY-REVIEW.md) and [public-release.md](public-release.md) before public distribution.
