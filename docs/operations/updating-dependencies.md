# Updating the dependencies

Brings every dependency of every workspace package, pnpm itself and Biome's
configuration to their latest.

Prerequisites: on `main`, everything committed; Node 26 (`node --version`).

```powershell
pnpm deps:upgrade
```

It runs `corepack use pnpm@latest`, `pnpm -r up -L` (every dependency to its
latest, majors included, in the root and in each of `apps/*` and
`packages/*`) and `biome migrate --write`.

Then:

1. Read `git diff -- '**/package.json'`: for each version whose first number
   changed (or second, under 1.0), read the package's release notes for
   breaking changes. Three need more than that:
   - **TypeScript** stays on the native 7.x line; a tool that needs the
     JavaScript compiler API would pin it back (`.claude/CLAUDE.md`).
   - **Wrangler** may move the `compatibility_date` it accepts: bump it in
     `apps/server/wrangler.jsonc` deliberately, never as a side effect.
   - **`@adrienlcp/*`** are Adrien's own bricks: a change to one is made in
     its repository, and lands here only as this bump.
2. Check everything:

   ```powershell
   pnpm validate
   ```

   Expected: lint, spelling, build, typecheck, tests with coverage and the
   end-to-end journeys all pass.
3. Commit, then `pnpm ship` ([deploying.md](deploying.md)), and try staging
   before production.

The CI actions (`.github/workflows/ci.yaml`, `deploy-production.yaml` and
`.github/actions/setup-workspace`, the `uses:` lines) are not touched by this
command: bump their `@vN` by hand when GitHub announces a new major.

## Common errors

| Symptom                                     | Fix                                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ERR_PNPM_PEER_DEP_ISSUES` or peer warnings | A package has not caught up with a new major of its peer. Hold the peer one major back in `package.json` (`"name": "^<previous major>"`), `pnpm install`, and retry later. |
| Biome errors after the upgrade              | Run `pnpm lint` (it fixes what it can), then read what remains: a new rule, or a renamed option `biome migrate` could not move.                                            |
| Playwright cannot launch Chromium           | Playwright moved to a new browser build: `pnpm exec playwright install chromium`.                                                                                          |
| TypeScript errors in code nobody touched    | A dependency's types changed: read its release notes; fix the call sites.                                                                                                  |
| `corepack` refuses to download pnpm         | `corepack enable` (as administrator once), or update Node.                                                                                                                 |
| Something breaks and there is no time       | `git checkout -- '**/package.json' pnpm-lock.yaml`, then `pnpm install`: back to the previous versions.                                                                    |
