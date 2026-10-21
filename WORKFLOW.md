# CleanFrame-LG contributor workflow

A practical guide for humans and AI coding agents who want to understand, build, adapt, test, or contribute to [CleanFrame-LG](README.md).

CleanFrame-LG ports the visual experience of [Nathan Clark's CleanFrame](https://github.com/nthnclrk/CleanFrame), originally built for Samsung Tizen, to LG webOS. The goal is to preserve the original design while using LG-compatible application launching and remote-control interactions.

This document describes a **recommended contributor workflow**, not the maintainer's private working environment. It does not grant anyone access to a TV, private files, accounts, or release credentials.

## 1. Understand the platform before editing

- Read [README.md](README.md), [LICENSE](LICENSE), [CREDITS.md](CREDITS.md), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- Review the original CleanFrame repository to distinguish upstream UI behavior from LG-specific functionality.
- The `app/` directory contains the original visual engine and Tizen adapter; the LG preparation process generates a webOS-ready application under `dist/webos-app`.
- LG webOS is not Samsung Tizen. Do not copy Tizen APIs, manifests, or package formats into an LG build.
- CleanFrame-LG is an **app**, not a replacement for the system launcher. The LG Home button continues to open webOS Home. Global Back interception and automatic system startup are not supported by this project.
- Compatibility is not universal. The project has been tested on an LG OLED B4 running webOS 25, but behavior may vary by firmware, region, and installed apps.

## 2. Choose a task and define success

Before editing, describe the desired behavior and its acceptance criteria. For example:

- **Visual change:** maintain the CleanFrame Dock/List experience, typography, focus behavior, and remote navigation.
- **App launching:** launch existing LG applications via supported public APIs; handle unavailable app IDs gracefully.
- **Ambient player:** preserve mute, loop, OK to pause/resume, and Back to close.
- **Compatibility:** retain existing preferences and avoid changes to unrelated LG system settings.

Make the smallest source change that achieves the task. Record any known limitations instead of presenting untested features as working.

## 3. Prepare and check the source

A local development machine needs Node.js 22+, Python 3.10+, and the official LG webOS CLI to package the application. Follow the precise prerequisites in the README.

```sh
npm ci
npm run check
npm run check:lg
npm run check:public
```

For an LG package, supply the official webOSTV.js resource with its corresponding license as described in the README. If you are authorized to use optional ambient media, supply it locally; **do not commit private media**.

```sh
npm run prepare:lg
ares-package dist/webos-app -o dist
```

Alternatively, run the repository's **Build LG preview** GitHub Actions workflow for a cloud-generated IPK and checksum. A successful cloud build confirms packaging, **not** installation or functionality on a real TV.

## 4. Test safely on a television

1. Use LG's official [Developer Mode setup](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) on a compatible webOS television.
2. Connect from an **authorized** development device on the same permitted network, following LG's documentation.
3. Install the generated LG `.ipk` using official tooling. Do not root the TV or modify the system firmware for this workflow.
4. Test navigation, app shortcuts, Dock/List layout, preferences, ambient video, and Back behavior.
5. Verify that existing apps, sign-ins, picture settings, and HDMI inputs remain unaffected.
6. Document the tested TV model, webOS version, actual results, and any limitations. Never post its IP address, pairing key, passphrase, or device logs containing secrets.

Developer Mode sessions expire; their maintenance is described in LG's documentation. A source push does not update the TV, and installing an IPK does not push code to GitHub.

## 5. Working with an AI coding agent

Humans remain responsible for reviewing and approving changes. Give an agent the repository contents, a narrowly scoped task, and explicit constraints. The agent should:

1. Read the README and relevant source files **before** proposing edits.
2. Explain which logic is shared with upstream CleanFrame and which is LG-specific.
3. Make a focused change without rewriting unrelated components or removing attribution.
4. Run the available checks; clearly distinguish executed tests from tests it could not perform.
5. Review diffs for credentials, personal paths, network details, licensed assets, and unexpected changes.
6. Summarize the changes, verification results, remaining risks, and any necessary installation steps.
7. Request explicit approval before publishing, changing repository visibility, accessing devices, installing applications, contacting maintainers, or creating releases.

Suggested task prompt:

> Help me modify CleanFrame-LG for LG webOS. Read README.md and WORKFLOW.md first. Preserve the original CleanFrame design, existing LG app-launch behavior, and user preferences. Make only the changes required for: [describe task]. Run the available checks, identify anything untested on real hardware, and show me the diff before any publication or deployment. Do not include local device information, account data, or private media.

## 6. Contribute changes responsibly

- Create a feature branch or fork and keep commits focused.
- Run the relevant checks and describe any manual TV testing in your pull request.
- Document user-visible changes and compatibility limitations in clear English.
- Preserve the original MIT license and attribution to Nathan Clark. Check [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before redistributing assets.
- Do not commit `.local/`, `dist/`, credentials, TV keys, device profiles, private logs, or unauthorized media.
- Check GitHub Actions artifacts and releases as carefully as commits: build outputs must not bundle private files.
- Open a pull request for review. Do not assume a contributor, human or AI, has permission to merge, publish a release, or alter repository settings.

## 7. Useful distinctions

| Action | What it does | What it does not do |
| --- | --- | --- |
| Edit source | Changes the development code | Update an installed TV app |
| Push to GitHub | Updates the repository | Install an IPK on a TV |
| Build in GitHub Actions | Produces a preview package and checksum | Verify real-device compatibility |
| Install an IPK | Deploys a development app to a TV | Replace LG webOS Home |
| Enable Developer Mode | Allows supported development workflows | Grant root access |

For full requirements, setup details, current features, and limitations, use [README.md](README.md) as the source of truth.
