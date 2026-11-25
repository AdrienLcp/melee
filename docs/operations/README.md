# Operations

Everything needed to run Melee without help: one page per action, each with
its prerequisites, the exact command, what a good run prints, and the errors
met most often.

| Action                          | Command                                  | Page                                                 |
| ------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Deploy to staging               | `pnpm ship`                              | [deploying.md](deploying.md)                         |
| Deploy to production            | `gh workflow run deploy-production.yaml` | [deploying.md](deploying.md)                         |
| Update the dependencies         | `pnpm deps:upgrade`                      | [updating-dependencies.md](updating-dependencies.md) |
| Look up or recreate the hosting | —                                        | [hosting.md](hosting.md)                             |
| Set or renew the secrets        | `pnpm secrets:sync`                      | [secrets.md](secrets.md)                             |
| A step broke                    | —                                        | [troubleshooting.md](troubleshooting.md)             |

## Where things live

| What                  | Where                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| The game              | https://melee.adrienlcp.com, and https://staging.melee.adrienlcp.com before it ([hosting.md](hosting.md))                 |
| Repository            | `AdrienLcp/melee` on GitHub; a push to `main` runs `.github/workflows/ci.yaml`, production is `deploy-production.yaml`    |
| Worker configuration  | `apps/server/wrangler.jsonc`, both environments                                                                           |
| Secrets               | The personal Bitwarden account, read at run time; never a committed file, and only `apps/server/.dev.vars` for `pnpm dev` |
| Hosting identifiers   | `scripts/operations/hosting.ts`                                                                                           |
| Bitwarden entry names | `scripts/operations/secret-entries.ts`, and the `ADMIN_TOKEN` items in [secrets.md](secrets.md)                           |

## Tools on the machine

- Node 26 and pnpm through corepack (`corepack enable`), as `package.json` pins them.
- The Bitwarden CLI, `bw` — set up once, see [secrets.md](secrets.md).
- The GitHub CLI, `gh`, logged in (`gh auth status`) — `pnpm ship` uses it to
  follow the CI run, and production is deployed through it. Without it,
  `pnpm ship` still pushes and prints the Actions page to watch.
