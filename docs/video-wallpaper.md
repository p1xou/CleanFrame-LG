# LG video wallpaper

Video wallpaper is an optional addition to the LG build. Photo wallpapers, their material assets and rotation preferences remain available. Video playback uses one native HTML video element for Home and the live wallpaper preview, with looping enabled and audio muted. Art Mode remains a separate player; the wallpaper releases its decoder before Art Mode plays and while CleanFrame is hidden.

## Selection and preferences

Open Settings → Background → Video. When Video is already applied, the Wallpaper row also reopens its picker. Moving focus between clips previews the candidate after a short focus-settling delay without saving it. OK applies a ready candidate and its fit; OK during loading queues that candidate. Another selection or Back cancels the queued application. A loading or storage failure retains the latest applied selection. Back restores the latest applied background. Completed applications remain applied, as in the photo picker.

Each clip has its own saved fit. Cover fills the 16:9 area by cropping the edges; Contain preserves the complete image with bars where the source ratio differs. Neither mode stretches the image. Photo selection and photo rotation settings are retained when using a video background. Returning to Photo restores the photo workflow.

## Local media setup

Supply only media you own or have permission to use. Keep the manifest, source clips and optional prepared variants under ignored `.local/`. The build copies explicitly selected files into the private package; it performs no download, re-encoding, upscaling or quality enhancement. Do not commit source clips or distribute a package containing third-party media without the necessary rights.

For example, create `.local/wallpapers/manifest.json`:

```json
{
  "clips": [
    {
      "id": "my-loop",
      "title": "My loop",
      "file": "my-loop.mp4",
      "defaultFit": "contain",
      "coverFile": "my-loop-cover-16x9.mp4",
      "containFile": "my-loop-contain-16x9.mp4"
    }
  ]
}
```

Paths are relative to the manifest. `id`, `title` and `file` are required; `defaultFit` is `cover` or `contain` and defaults to `cover`. `coverFile` and `containFile` are optional local variants selected for the corresponding fit. Omit them when using the original file directly. Supported build inputs are MP4 and WebM; the container alone does not establish codec compatibility. Up to 32 uniquely identified clips are accepted. IDs start with a lowercase letter and contain only lowercase letters, digits, underscores and hyphens, with a maximum length of 48 characters. Titles contain 1–80 characters.

Set `CLEANFRAME_WALLPAPER_MANIFEST` to that manifest before running the existing LG preparation/build command. For PowerShell:

```powershell
$env:CLEANFRAME_WALLPAPER_MANIFEST = (Resolve-Path .local/wallpapers/manifest.json).Path
node scripts/webos/prepare.mjs
```

The existing `CLEANFRAME_WEBOSTV_JS` setup is still required. Preserve `CLEANFRAME_ART_VIDEO` when rebuilding a private package that already includes its authorized Art Mode media. Omitting the wallpaper manifest produces an empty video catalogue and removes stale wallpaper media from the staging directory. Review package contents before sharing; the local manifest is an explicit build input, not a rights grant.

## Image quality and device limits

Retaining the original bytes avoids an additional generation of compression. A 500-pixel source displayed across a 4K panel remains a 500-pixel source; upscaling does not recover authentic 4K detail. Prefer a suitably licensed original at the desired resolution and cadence. Cropping discards part of the picture, while Contain retains it with bars. Optional prepared 16:9 variants can bake that decision into the file when the TV's native video plane does not honor CSS clipping.

[LG's webOS TV 25 format specification](https://webostv.developer.lge.com/develop/specifications/video-audio-250) documents UHD H.264 up to 3840 × 2160 at 30p, level 5.1 and 50 Mbit/s, and HEVC up to 2160p60 Main/Main10, level 5.1 and 60 Mbit/s. Model-specific exceptions exist. Playback of an individual encode still requires a device test. [LG distinguishes the 1920 × 1080 UHD app graphics surface from 3840 × 2160 video playback](https://webostv.developer.lge.com/develop/specifications/app-resolution); a 4K video does not require changing the existing package's graphics resolution.

[LG's media FAQ](https://webostv.developer.lge.com/faq?faqCategoryID=Technical+FAQ) supports only one simultaneous audio/video content stream. It also warns that transforms, offsets/borders and full transparency can affect fullscreen detection. [LG support reports that `object-fit` on TV video is unsupported](https://forum.webostv.developer.lge.com/t/video-playback-fullscreen-issue/9362). The player sizes and centers its video using source dimensions instead, but native-plane cropping and small previews require real-TV verification. Prepared 16:9 variants provide a fallback. Browser results alone cannot establish the B4's native-plane behavior.

Looping is requested through the media element. A source with matching first and last frames improves the visual join, but decoder restart timing can still cause a gap. Gapless looping, sustained 4K fluidity, HDR appearance, OLED protection behavior and remote feel must be assessed on the actual TV. This feature changes no native Home/startup assignment or OLED protection setting.

## Pinterest reference investigation

Checked on 7 November 2026: [the supplied Pinterest short link](https://pin.it/20s00bKAw) resolves to pin `709879960020528752`, whose public page identifies [this canonical pin](https://www.pinterest.com/pin/symmetry-in-motion-graphics-erica-anderson--777433954450520274/). The unauthenticated page metadata describes a square 500 × 500 GIF (`embed.type: "gif"`, `isVideo: false`, `videos: null`), attributed to Erica Anderson. It links to [the artist's Tumblr](https://ericaofanderson.tumblr.com/), which lists GIF artwork and Gumroad/Patreon links. The exact original artwork page and its usage license have not been established. A descriptive “1080p” label is not technical evidence of the media's resolution.

No verified MP4, source cadence or duration was obtained from that page. No source media was downloaded, embedded in the repository or added to a package for this investigation. An original authorized video file, or an identified licensed download from the artist, is needed to prepare and verify this particular clip. Pinterest availability and artist attribution do not establish redistribution permission.

## Verification scope

Source checks and browser tests can verify selection, persistence, cancellation, error fallback and resource ownership. They cannot prove the exact TV's decoder support, physical rendering or an installation. Record package/install evidence separately from direct playback metadata and the owner's visual observation. Keep device addresses, keys, SDKs, packages and private media out of Git.

On 7 November 2026, the shared UI's complete public-font Chromium suite passed 344 checks with no page errors. The LG adapter, existing ambient player and new wallpaper lifecycle checks passed, as did the public-source scan and unsigned public export. A separate native Chromium suite uses author-created synthetic footage to exercise preview, geometry, application/reload, fit persistence, cancellation, failure recovery and exclusive decoder ownership. No third-party footage is included in those tests. The source changes preserve the installed package ID; the webOS package version advances to 0.1.4.

The video browser suite passed nine scenarios, including switching the queued clip and fit while the saved-photo fallback is still loading. On an authorized LG OLED B4 running webOS 25, 18 runtime checks passed using local synthetic H.264 test clips: a 3840 × 2160, 30 fps, two-second source decoded at its native dimensions, and three loop time crossings were sampled over approximately five seconds. Mute, loop, per-clip fit/application/reload behavior, decoder release for the existing 4K ambient player, and return navigation passed. The original stored preference bytes and photo Home were restored after testing. No native Home/startup or system-picture settings were written.

The portrait source decoded at 1080 × 1920 and its calculated Cover/Contain sizes and offsets passed. This establishes the requested CSS geometry, not the physical video-plane crop. CDP screenshots show the UI but omit or corrupt the native hardware video plane; they cannot verify the visible footage or native clipping. All reported decoded/dropped-frame counters returned zero and are treated as unavailable. Sustained smoothness, a gapless join, HDR appearance, physical preview placement/cropping and OLED protection behavior therefore remain visual/device follow-up items. No third-party media or private package is published with these results.
