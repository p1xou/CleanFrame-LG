# AI agent instructions for CleanFrame-LG

Read [README.md](README.md), [WORKFLOW.md](WORKFLOW.md), [PRIVACY-REVIEW.md](PRIVACY-REVIEW.md), [CREDITS.md](CREDITS.md), [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before making changes.

## Development
- This is an LG webOS adaptation of CleanFrame for Samsung Tizen. The original Tizen adapter and documentation are not LG installation instructions.
- Preserve the original visual design, Dock/List navigation, remote focus behavior, saved preferences, and attribution.
- Keep LG device operations in `webos/device.js` and ambient playback in `webos/art-player.js`. Preserve runtime compatibility with the target TV.
- Do not change the installed app identity or user settings unless explicitly required.
- Keep changes narrowly scoped and review the diff.

## Verification
- Run `npm run check`, `npm run check:lg` and `npm run check:public` when available. Report any skipped checks and do not confuse browser/cloud validation with testing on physical hardware.
- Never commit secrets, device identifiers, local network details, private media, `.local/`, `dist/` or confidential logs.
- Keep documentation and release notes in English.
- Obtain explicit approval before installing on a TV, publishing releases, contacting third parties, or changing repository visibility. Editing permission is not publication permission.
- A GitHub push does not install an update on a television.

Follow [docs/development.md](docs/development.md) and [docs/testing.md](docs/testing.md) for LG-specific steps.
