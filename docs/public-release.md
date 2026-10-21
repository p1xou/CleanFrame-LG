# CleanFrame-LG public release checklist

This is a reusable checklist for human maintainers and AI coding agents, not a record of private equipment or past approvals.

## Scope and licensing
- Identify the exact revision and intended release features.
- Preserve [Nathan Clark's original CleanFrame](https://github.com/nthnclrk/CleanFrame) copyright and MIT license.
- Review [LICENSE](../LICENSE), [CREDITS.md](../CREDITS.md), and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) for third-party image, font, video and logo rights.

## Privacy
- Complete [PRIVACY-REVIEW.md](../PRIVACY-REVIEW.md), including Git history, logs and build artifacts.
- Exclude credentials, TV keys, network identifiers, private recordings, proprietary fonts without redistribution rights, `.local/` and `dist/` from source publication.
- Inspect the actual IPK contents: files ignored by Git can still appear in generated packages.

## Validation
- Run `npm ci`, `npm run check`, `npm run check:lg` and `npm run check:public`.
- Run relevant browser tests when available; record them separately from real LG TV tests.
- Produce an LG IPK using the official CLI or **Build LG preview** GitHub Actions workflow and verify its checksum.
- Document tested LG models, webOS versions, supported features, installation instructions and known limitations.
- Do not claim the application replaces webOS Home or has been tested on models without evidence.

## Publication
- Have the maintainer review the diff, release notes, licensing, privacy checklist and artifacts.
- Obtain explicit approval before releases or repository visibility changes; editing access alone does not imply publishing permission.
- Include the appropriate notices and checksum with redistributed packages.
- Keep device credentials and private media out of GitHub Releases and Actions artifacts.

See [WORKFLOW.md](../WORKFLOW.md), [README.md](../README.md), [development.md](development.md), and [testing.md](testing.md).
