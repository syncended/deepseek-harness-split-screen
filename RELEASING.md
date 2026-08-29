# Releasing

Releases use tag-driven npm publication with provenance.

## One-time setup

1. Create an npm granular access token for `@syncended/dsh-split-screen` with package read/write access and CI-compatible 2FA bypass.
2. Store it in the GitHub Actions repository secret `NPM_REGISTRY_TOKEN`.
3. Confirm the release workflow has npm provenance permissions.

Manage tokens at <https://www.npmjs.com/settings/syncended/tokens>.

## Every release

Start from a clean `trunk` branch and run:

```bash
npm run check
npm test
npm pack --dry-run
```

Create and push a version commit and matching `v<version>` tag:

```bash
npm version patch   # or minor, major, or an explicit version
git push --follow-tags
```

The release workflow verifies the tag/version match, reruns checks, inspects package contents, and publishes with npm provenance.

Package page: <https://www.npmjs.com/package/@syncended/dsh-split-screen>

Verify installation in a disposable Web profile:

```bash
dsh plugin --profile web add @syncended/dsh-split-screen
# Use -w if the pnpm-backed profile requires workspace-root installation.
dsh web --no-open
```

Refresh the existing Web GUI, open **Split**, and verify vertical/horizontal splitting, pane reset, and sidebar session assignment.
