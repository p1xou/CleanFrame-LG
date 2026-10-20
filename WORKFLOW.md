# Development and GitHub update workflow

## Two separate copies

The private TV project is the working installation source. Preserve its device setup, local tools, downloaded media and installation records. This GitHub checkout is a separate, sanitized source copy. Never replace the TV project with it or remove local files merely because they are excluded from GitHub.

A push updates the source repository; it does not install an update on the TV. A TV installation does not automatically upload source or private files to GitHub.

## Future changes

1. Continue TV work in the existing project and conversation when available. Read its local instructions and setup record before modifying it.
2. Implement and test the requested change in the private TV project. Preserve the installed app identity and preferences unless the task requires otherwise.
3. Transfer portable source changes to this checkout. Preserve upstream attribution, licenses and privacy exclusions. Write GitHub documentation, commit messages and release notes in English.
4. Review the proposed diff and relevant history for credentials, personal paths, network addresses, private media and generated packages. Never bulk-copy the private project into GitHub.
5. Run the relevant checks, then commit and push the reviewed source changes to this private repository as part of the update workflow.
6. Install the TV update only when the current task includes device work. Report installation and GitHub synchronization separately.

## Privacy and visibility

Keep `.local/`, `dist/`, keys, device profiles, passphrases, connection logs and private media out of Git. Never upload a package containing private media to GitHub artifacts or releases. Use the owner's GitHub noreply address for commits.

Keep this repository private. Changing visibility requires an explicit owner request and a fresh review. Attribution links do not authorize messaging the original author.
