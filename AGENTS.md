# CleanFrame LG

Read README.md and CREDITS.md. Keep original copyrights and third-party notices.
Runtime code stays ES5 compatible. Keep device operations in webos/device.js and video playback in webos/art-player.js. Preserve remote navigation and saved preferences.
Run npm run check, npm run check:lg and npm run check:public. Never commit .local, dist, SSH keys, account data, device addresses or private media. Do not publish packages containing private media.
TV access, installs and launches require an explicit device task. Home/startup modifications require a separate explicit task; no native Home hooks are part of this LG port.
Keep the repository private unless the owner explicitly requests a visibility change after reviewing the repository and its full history.

Keep GitHub documentation, commit messages and release notes in English. Follow WORKFLOW.md: the private TV project and this sanitized checkout are separate. Develop and test in the TV project, then synchronize reviewed portable changes here. Never remove private media or device setup when preparing GitHub updates. Source pushes and TV installations are separate operations.
