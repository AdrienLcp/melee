# Hosting

One Worker per environment serves everything — the built app as static
assets, the API, the socket — so the QR code resolves on the origin the host
was served from. Every piece is declared in `apps/server/wrangler.jsonc`,
production at the top level and staging under `env.staging`.

| Piece                | Provider                                | Production                                | Staging                                     |
| -------------------- | --------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| The Worker           | Cloudflare Workers, account `431a5290…` | `melee`                                   | `melee-staging`                             |
| Its address          | Cloudflare DNS, zone `adrienlcp.com`    | custom domain `melee.adrienlcp.com`       | custom domain `staging.melee.adrienlcp.com` |
| Rooms and wall pairs | Durable Objects (SQLite), in the Worker | `RoomObject`, `WallPairingObject`         | their own copies                            |
| Reports, live rooms  | D1                                      | `melee-observability` (`67578d39…`)       | `melee-staging-observability` (`f064adf3…`) |
| Rate limiters        | Workers rate limiting, in the Worker    | namespaces `1001`, `1003`, `1005`, `1007` | namespaces `1002`, `1004`, `1006`, `1008`   |
| Daily purge          | Cron trigger, in the Worker             | `23 3 * * *`                              | `23 3 * * *`                                |

The `workers.dev` address is off: the game is only served at its own domain.
The identifiers the scripts read are in `scripts/operations/hosting.ts`. The
CI secrets that let GitHub deploy to Cloudflare are covered in
[secrets.md](secrets.md); what the D1 database holds, in
[`../observability.md`](../observability.md).

## How it is created

Almost nothing by hand: the CI's deploy step runs `wrangler deploy` (with
`--env staging` for staging), which creates the Worker on the first run,
uploads a new version on each run after, creates its Durable Object classes
from `migrations`, and attaches the custom domain in `routes`, with its DNS
record and certificate. A Worker deleted by mistake comes back with the next
deploy — `pnpm ship` for staging, `gh workflow run deploy-production.yaml` for
production — its rooms gone with it. The custom domain answers once its
certificate is issued, a few minutes later.

**The D1 database is the exception**: `wrangler.jsonc` names it by id, and a
deploy does not create one. Recreating it, in a terminal set up as in _Worker
secrets_, from `apps/server`:

```powershell
pnpm exec wrangler d1 create melee-observability
```

(`melee-staging-observability` for staging). Expected: the new
`database_id`. Put it in `wrangler.jsonc` in place of the old one, commit and
deploy: the deploy job applies every migration to the empty database before
the Worker ships.

`ADMIN_TOKEN` is optional, so a recreated Worker deploys without it and keeps
`/admin` shut until it is set again (_Worker secrets_).

## Worker secrets

The only value the Worker reads as a secret is `ADMIN_TOKEN`, one per
environment ([secrets.md](secrets.md), _The entries_). Unlock first
([secrets.md](secrets.md), _Unlocking_), then in that terminal:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "431a529079f2d76802b95056e39950f0"; $env:CLOUDFLARE_API_TOKEN = bw get password "Cloudflare Pages token"
```

From `apps/server`:

```powershell
bw get password "melee ADMIN_TOKEN production" | pnpm exec wrangler secret put ADMIN_TOKEN
```

```powershell
bw get password "melee ADMIN_TOKEN staging" | pnpm exec wrangler secret put ADMIN_TOKEN --env staging
```

Expected: `Success! Uploaded secret ADMIN_TOKEN`. Close the terminal
afterwards: it holds the token.

## Deploy by hand

The last resort, when CI cannot deploy: from a clean clone of `main` only (it
ships whatever the folder holds), in a terminal set up as in _Worker secrets_:

```powershell
pnpm install --frozen-lockfile
```

```powershell
pnpm build
```

From `apps/server`, staging first, then production without `--env staging`:

```powershell
pnpm exec wrangler d1 migrations apply OBSERVABILITY --remote --env staging
```

```powershell
pnpm exec wrangler deploy --env staging --var "GIT_COMMIT:$(git rev-parse HEAD)" --var "GIT_COMMIT_EPOCH:$(git log -1 --format=%ct)"
```

The two `--var` are what `/api/health` reports; without them it says `dev`.

## Common errors

| Message                                                          | Fix                                                                                                                                                                  |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A `Bitwarden …` message                                          | See [secrets.md](secrets.md).                                                                                                                                        |
| `Authentication error [code: 10000]`                             | The Cloudflare token lacks a permission listed in [secrets.md](secrets.md), or expired: renew it.                                                                    |
| The migration step fails on a D1 database it cannot find         | The database named by id in `wrangler.jsonc` is gone: recreate it (_How it is created_).                                                                             |
| `wrangler deploy` refuses the custom domain: a DNS record exists | A record already holds the hostname: in the dashboard, _adrienlcp.com → DNS → Records_, delete it, then re-run the deploy.                                           |
| The site answers `522` or a certificate error                    | The certificate is not issued yet: wait ten minutes. Still failing: dashboard → _Workers & Pages → melee → Settings → Domains & Routes_, and follow what it reports. |
| `/admin` refuses every key, `/api/admin/*` answers 404           | The Worker has no `ADMIN_TOKEN`, or one shorter than 32 characters: set it (_Worker secrets_).                                                                       |
