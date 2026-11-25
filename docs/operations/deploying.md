# Deploying

Two Workers on Cloudflare, built from the same commit by the same config
(`apps/server/wrangler.jsonc`):

| Environment | Address                               | Worker          | Deployed by                                         |
| ----------- | ------------------------------------- | --------------- | --------------------------------------------------- |
| staging     | `https://staging.melee.adrienlcp.com` | `melee-staging` | every push to `main`, once CI is green: `pnpm ship` |
| production  | `https://melee.adrienlcp.com`         | `melee`         | `deploy-production.yaml`, run by hand, and only     |

Each has its own Durable Objects and its own D1 database: a room opened on
staging does not exist in production, and a test evening never reaches a real
table. Staging answers `Disallow: /` in `robots.txt` (`INDEXABLE=false`), and
the analytics server refuses its origin, so it is neither listed nor counted.
Nothing is built or deployed from this machine.

## Ship to staging — `pnpm ship`

Prerequisites: on `main`, everything committed, `origin/main` pulled, `gh`
logged in ([README.md](README.md)).

```powershell
pnpm ship
```

Expected: `git push` output, then `ship: pushed; watching CI run <id>`, the
run's jobs ticking green — checks, the end-to-end shards, Lighthouse,
`validate`, then `deploy-staging` — and
`ship: deployed to https://staging.melee.adrienlcp.com`, followed by the
command that puts it in production. The run takes about as long as its
slowest end-to-end shard. Check the commit staging runs:

```powershell
curl.exe -s https://staging.melee.adrienlcp.com/api/health
```

`build` is the short commit.

| Error                                                | Fix                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `only main deploys`                                  | `git switch main`, merge or cherry-pick the work there.                                                                 |
| `the working tree has uncommitted changes`           | Commit (or `git stash`) first. Another session's files count too: wait for it to commit.                                |
| `origin/main has commits this checkout lacks`        | `git pull --rebase`, then `pnpm validate`, then `pnpm ship`.                                                            |
| `nothing to ship`                                    | Every commit is already pushed. To re-deploy staging on the same commit: `gh workflow run ci.yaml`.                     |
| `the CI run failed`                                  | Open the run link it prints; see [troubleshooting.md](troubleshooting.md).                                              |
| `pushed; follow the deploy on …/actions`             | `gh` is missing or logged out; the push is done, watch the page. `gh auth login` fixes it for next time.                |
| The push stops on `lint:ci`, `spell` or `typecheck`  | The pre-push hook checks every file on disk, untracked ones included: fix it, or wait for the session whose file it is. |
| Green run, `deploy-staging` skipped its deploy steps | A newer commit reached `main` during the run: only the head of `main` deploys, and its own run does it.                 |

## Put a commit in production

Production gets nothing on a push. Once staging has been tried:

```powershell
gh workflow run deploy-production.yaml
```

deploys the commit staging runs, and

```powershell
gh workflow run deploy-production.yaml -f commit=abc1234
```

any commit of `main`. Or on GitHub: **Actions → Deploy production → Run
workflow**, leaving the field empty for the commit staging runs.

The workflow refuses a commit that is not on `main` or has no green `validate`
run, then builds that commit, applies the D1 migrations and deploys it — about
two minutes. Follow it:

```powershell
gh run list --workflow deploy-production.yaml --limit 1
```

```powershell
gh run watch <id> --exit-status
```

Expected: every step green, then `/api/health` reports the commit:

```powershell
curl.exe -s https://melee.adrienlcp.com/api/health
```

A room in progress survives a deploy: its Durable Object keeps its state and
the screens reconnect.

| Error                                | Fix                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `<sha> is not on main`               | Only a commit of `main` goes to production: push it there first.                        |
| `<sha> has no green validate run`    | Its CI run failed or is still running: wait, or fix and ship again.                     |
| `Authentication error [code: 10000]` | The Cloudflare token expired or lost a permission: renew it ([secrets.md](secrets.md)). |

## Roll back

The same workflow, with the last good commit:

```powershell
gh workflow run deploy-production.yaml -f commit=<last good commit>
```

When even two minutes is too long, `pnpm exec wrangler rollback` from
`apps/server`, in a terminal set up as in [hosting.md](hosting.md), _Worker
secrets_, puts the previous version back at once, with no build — the one
command run from a laptop, since it ships nothing new. The next run of the
workflow replaces it, so follow it with a proper deploy of the fix. A
migration already applied stays: migrations are additive for that reason.

## Nothing else is deployed from a laptop

`wrangler deploy` from a checkout ships whatever the working tree holds,
uncommitted changes included, and stamps no commit. Both environments are
deployed by CI only, with the `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` repository secrets that `pnpm secrets:sync` writes
([secrets.md](secrets.md)). The last resort when CI cannot deploy is in
[hosting.md](hosting.md), _Deploy by hand_.
