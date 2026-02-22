# Update dependencies

Ways to update project dependencies (npm).

## Option 1: Update to latest versions (recommended)

Use **npm-check-updates** to rewrite `package.json` to the latest versions, then install.

1. From the project root, run:
   ```bash
   npx npm-check-updates -u
   ```
   This updates all version ranges in `package.json` to the latest. Review the diff before committing.

2. Install the new versions:
   ```bash
   npm install
   ```

3. Run the app and tests to confirm nothing broke:
   ```bash
   npm run dev
   npm run lint
   npm run build
   ```

**Variants:**

- **Only devDependencies:**  
  `npx npm-check-updates -u --target minor` (or use `-u -d` for dev only; see `npx npm-check-updates --help`).
- **Preview only (no file changes):**  
  `npx npm-check-updates` (no `-u`). Shows what would be updated.
- **Interactive:**  
  `npx npm-check-updates -i` to pick which packages to upgrade.

## Option 2: Update within current semver ranges

To refresh the lockfile without changing version ranges in `package.json` (e.g. stay on `^5.0.0` but get latest 5.x):

```bash
npm update
```

Then run `npm run dev`, `npm run lint`, and `npm run build` to verify.

## One-liner (update all to latest and install)

```bash
npx npm-check-updates -u && npm install
```

Report whether the commands succeeded or show any error output.
