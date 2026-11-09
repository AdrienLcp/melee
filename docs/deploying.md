# Deploying

Two Workers on Cloudflare, built from the same commit by the same config
(`apps/server/wrangler.jsonc`):

| Environment | Address                               | Worker          | Deployed by                                     |
| ----------- | ------------------------------------- | --------------- | ----------------------------------------------- |
| staging     | `https://staging.melee.adrienlcp.com` | `melee-staging` | every push to `main`, once CI is green          |
| production  | `https://melee.adrienlcp.com`         | `melee`         | `deploy-production.yaml`, run by hand, and only |

Each has its own Durable Objects: a room opened on staging does not exist in
production, and a test evening never reaches a real table. Staging answers
`Disallow: /` in `robots.txt` (`INDEXABLE=false`), and the analytics server
refuses its origin, so it is neither listed nor counted.

## What each one runs

```sh
curl -s https://staging.melee.adrienlcp.com/api/health
curl -s https://melee.adrienlcp.com/api/health
```

`build` is the short commit.

## Put a commit in production

Production gets nothing on a push. Once staging has been tried:

```sh
gh workflow run deploy-production.yaml                 # the commit staging runs
gh workflow run deploy-production.yaml -f commit=abc1234   # any commit of main
```

Or on GitHub: **Actions → Deploy production → Run workflow**, leaving the
field empty for the commit staging runs.

The workflow refuses a commit that is not on `main` or has no green `validate`
run, then builds that commit and deploys it — about two minutes. Follow it with
`gh run watch <id> --exit-status`, and check `/api/health` reports the commit
before calling it deployed. A room in progress survives a deploy: its Durable
Object keeps its state and the screens reconnect.

## Roll back

The same workflow, with the last good commit:

```sh
gh workflow run deploy-production.yaml -f commit=<last good commit>
```

When even two minutes is too long, `pnpm exec wrangler rollback` from
`apps/server` puts the previous version back at once, with no build — the one
command run from a laptop, since it ships nothing new. The next run of the
workflow replaces it, so follow it with a proper deploy of the fix.

## Nothing else is deployed from a laptop

`wrangler deploy` from a checkout ships whatever the working tree holds,
uncommitted changes included, and stamps no commit. Both environments are
deployed by CI only, with the `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` repository secrets.
