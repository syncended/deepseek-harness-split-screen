# Releasing

## One-time setup

1. **Register on npm** — https://www.npmjs.com/signup
2. **Create a Granular Access Token that bypasses 2FA** — https://www.npmjs.com/settings/syncended/tokens → Generate New Token → **Granular Access Token**:
   - Permissions: **Packages and scopes** → **Read and write**, scope `@syncended` (or this package).
   - **Two-factor authentication: Bypass two-factor authentication** — required for CI because it cannot enter an OTP.
   - A classic **Automation** token also works, but granular + bypass is recommended.
3. **Add the token to GitHub Actions secrets** — repository → Settings → Secrets and variables → Actions → New repository secret:
   - Name: `NPM_REGISTRY_TOKEN`
   - Value: the npm token from step 2.

## Every release

```bash
# Bump package.json, create the matching commit and v* tag, then push both.
npm version patch   # or minor, major, or an explicit version such as 0.1.1
git push --follow-tags
```

The `Release` GitHub Actions workflow starts for every `v*` tag. It checks the JavaScript, runs the tests, and publishes the package with npm provenance:

https://www.npmjs.com/package/@syncended/dsh-split-screen

After publication, users install it with:

```bash
dsh plugin --profile web add @syncended/dsh-split-screen
```

## First release

The repository already starts at `0.1.0`. After configuring `NPM_REGISTRY_TOKEN`, create the initial release without bumping the package version:

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```
