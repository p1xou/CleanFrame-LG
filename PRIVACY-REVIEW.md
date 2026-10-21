# Privacy and security review checklist

Use this checklist before opening a pull request, publishing a release, uploading build artifacts, or changing the visibility of a CleanFrame-LG fork. It is written for both human contributors and AI coding agents.

**Passing automated checks is not proof that a repository is free of sensitive data.** Review the actual diff, repository history, dependencies, and distributable packages before sharing.

## Source and Git history

- [ ] Inspect staged files, the proposed diff, and recent commits for confidential information.
- [ ] Exclude private directories (including `.local/`), generated output (`dist/`), temporary files, debug logs, and local machine or editor configuration that should not be shared.
- [ ] Check the **entire Git history**, not just the current files. Deleting a secret in a new commit does not erase it from earlier commits.
- [ ] Review any screenshots, issue attachments, pull requests, and GitHub Actions logs for unintended disclosures.

## TV and account information

- [ ] Never commit LG Developer Mode passphrases, SSH keys, pairing keys, tokens, passwords, cookies, or other credentials.
- [ ] Remove private network addresses, TV identifiers, device profiles, local file paths, and connection logs unless a specific value is genuinely public and necessary.
- [ ] Keep personal installation records and device-specific setup outside distributable source and packages.
- [ ] Use appropriate account privacy settings for author and committer email addresses. Remember that GitHub usernames and commit metadata may remain visible.

## Media, dependencies, and licensing

- [ ] Confirm permission to distribute included photos, videos, fonts, icons, and other assets. A software MIT license does not automatically grant rights to third-party media.
- [ ] Do not upload downloaded streams, private demonstration videos, or media from personal libraries without the necessary redistribution rights.
- [ ] Keep the upstream CleanFrame license and attribution intact; consult [LICENSE](LICENSE), [CREDITS.md](CREDITS.md), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- [ ] Check dependencies, build scripts, and package contents for unexpected files or secrets.

## Builds, releases, and deployment

- [ ] Run the applicable repository checks described in [README.md](README.md) and [WORKFLOW.md](WORKFLOW.md).
- [ ] Inspect GitHub Actions artifacts, release assets, and packaged `.ipk` files before publication. Excluded Git files can still accidentally enter a generated package.
- [ ] Do not put TV credentials in GitHub Actions or public logs. A cloud build does not require access to a private home network.
- [ ] Distinguish locally tested changes from cloud-only builds. Do not claim compatibility with untested TV models or firmware versions.
- [ ] Obtain explicit repository-owner approval before publishing, changing visibility, deploying to a device, or contacting anyone on the owner's behalf.

## If sensitive information was exposed

1. Stop further publication or sharing.
2. Revoke or rotate any affected credentials and invalidate access where possible.
3. Assess commits, forks, releases, Actions artifacts, and logs. Merely editing the latest file is not sufficient.
4. Follow GitHub's documented sensitive-data removal procedure when rewriting history is necessary, and coordinate with repository collaborators.
5. Verify the cleanup before resuming publication.

For the development and contribution process, see [WORKFLOW.md](WORKFLOW.md). For installation instructions and known limitations, see [README.md](README.md).
