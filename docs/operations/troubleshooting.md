# When a step breaks

Find the step, read its log, apply the fix. The pages of each action carry
their own table of errors; this one covers what lies between them.

## Read the failure

A failed CI or production run:

```powershell
gh run list --limit 5
```

```powershell
gh run view <id> --log-failed
```

Expected: the log of the failing step only. Re-run it once the cause is fixed
— or straight away for a network hiccup:

```powershell
gh run rerun <id> --failed
```

A failed end-to-end shard uploads its traces (`playwright-traces-<shard>`),
and a failed Lighthouse its reports (`lighthouse-reports`), as artifacts of
the run: `gh run download <id> -n <name>`, then
`pnpm exec playwright show-trace <trace.zip>` for a trace.

## By step

| Step                | Symptom                                           | Fix                                                                                                                                 |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Push                | The pre-push hook stops it                        | It runs `lint:ci`, `spell` and `typecheck` over every file on disk: see `.claude/rules/committing.md`.                              |
| CI `pnpm install`   | `ERR_PNPM_OUTDATED_LOCKFILE`                      | `pnpm install` here, commit `pnpm-lock.yaml`, ship.                                                                                 |
| CI lint             | `biome ci` errors                                 | `pnpm lint` here, commit, ship.                                                                                                     |
| CI spelling         | `Unknown word`                                    | Fix the typo, or add a real word to `cspell.json` → `words`.                                                                        |
| CI build or tests   | A failing test or type error                      | Reproduce with `pnpm validate` here; fix; ship.                                                                                     |
| CI end-to-end       | A journey fails on CI only                        | Read its trace (above); `pnpm test:e2e` here reproduces it on ports of its own.                                                     |
| CI Lighthouse       | A score under its floor                           | `pnpm lighthouse` here, alone, after `pnpm validate`.                                                                               |
| `deploy-staging`    | Its deploy steps skipped on a green run           | A newer commit is the head of `main`; its own run deploys. Nothing to fix.                                                          |
| A deploy job        | `Authentication error [code: 10000]`              | The Cloudflare token expired or lost a permission: renew it ([secrets.md](secrets.md)).                                             |
| A deploy job        | It fails at once on a missing token               | The repository lacks `CLOUDFLARE_API_TOKEN`: `pnpm secrets:sync` ([secrets.md](secrets.md)), then `gh run rerun <id>`.              |
| A deploy job        | The D1 migration step fails                       | Read the SQL error: a migration is additive only. A database gone: recreate it ([hosting.md](hosting.md)).                          |
| `deploy-production` | `is not on main` / `has no green validate run`    | See [deploying.md](deploying.md), _Put a commit in production_.                                                                     |
| Site                | Old version still showing                         | `/api/health` names the commit served; hard-reload. A wrong commit: check which run deployed it.                                    |
| Site                | Error screen, console errors                      | Roll back ([deploying.md](deploying.md)), then reproduce locally. The error reports are in [observability.md](../observability.md). |
| `pnpm dev`          | `POST /api/rooms` answers 500                     | See `.claude/rules/worktrees.md` (`--persist-to` and a short path), or another session holds ports 3100 and 5273.                   |
| Any script          | A `Bitwarden …` message                           | [secrets.md](secrets.md), _Common errors_.                                                                                          |
| Any script          | `pnpm: command not found` or a wrong pnpm version | `corepack enable`, open a new terminal.                                                                                             |

## Still stuck

- Cloudflare status: https://www.cloudflarestatus.com — GitHub:
  https://www.githubstatus.com
- Deploy by hand, from a clean clone of `main`, with the token read from
  Bitwarden: [hosting.md](hosting.md), _Deploy by hand_.
