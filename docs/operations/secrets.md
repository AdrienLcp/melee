# Secrets

Every token lives in the **personal** Bitwarden account and is read when it
is needed. Nothing secret is committed, and the one file on disk is the
git-ignored `apps/server/.dev.vars` that `pnpm dev` reads.

## The entries

The **password** field of each entry is the value, read by exact name:

| Entry                          | Holds                                                                                                                                                                             | Read by                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Cloudflare Pages token`       | A Cloudflare API token from the _Edit Cloudflare Workers_ template, on the account and the `adrienlcp.com` zone, plus _Account · D1 · Edit_ for the migrations the deploy applies | `secrets:sync` (it becomes the CI's `CLOUDFLARE_API_TOKEN`); a deploy by hand |
| `Github PAT`                   | A GitHub token allowed to write the secrets of `AdrienLcp/melee` (fine-grained: _Secrets · Read and write_ on the repository)                                                     | `secrets:sync`                                                                |
| `melee ADMIN_TOKEN production` | The key `/admin` asks for on `melee.adrienlcp.com`, 32 characters or more                                                                                                         | Worker `melee`, set by hand ([hosting.md](hosting.md), _Worker secrets_)      |
| `melee ADMIN_TOKEN staging`    | The same for `staging.melee.adrienlcp.com`                                                                                                                                        | Worker `melee-staging`, likewise                                              |
| `melee ADMIN_TOKEN dev`        | The same for `pnpm dev`                                                                                                                                                           | `apps/server/.dev.vars`, as `ADMIN_TOKEN=<value>`                             |

The first two are in `scripts/operations/secret-entries.ts`. Each
`ADMIN_TOKEN` item names its environment, production included: `bw get`
matches a name as a substring, so a bare `melee ADMIN_TOKEN` would match all
three. Without it, the admin routes answer 404 and the game runs as usual
([`../observability.md`](../observability.md), _The back office_).

The account id, `431a529079f2d76802b95056e39950f0`, is not secret: it is in
`scripts/operations/hosting.ts`.

## Set up the Bitwarden CLI — once per machine

Prerequisite: the CLI, `pnpm add -g @bitwarden/cli`, then `bw --version`.

### A machine where `bw` is logged in to another account

On a work machine the default `bw` profile belongs to the work account, and
other tools rely on it: leave it alone. The personal account gets a profile of
its own in `~/bitwarden-personal`, which the scripts pick up by themselves
whenever that folder exists.

In a new PowerShell terminal:

```powershell
New-Item -ItemType Directory -Force "$HOME\bitwarden-personal"
```

```powershell
$env:BITWARDENCLI_APPDATA_DIR = "$HOME\bitwarden-personal"
```

```powershell
bw config server https://vault.bitwarden.eu
```

(use the server that hosts the personal account: `https://vault.bitwarden.com`
for the US region, `https://vault.bitwarden.eu` for the EU one)

```powershell
bw login
```

Then close that terminal. Never set `BITWARDENCLI_APPDATA_DIR` for the whole
user account: every `bw` on the machine, the work tools' included, would then
read the personal vault.

Expected: `bw login` answers `You are logged in!`. Checking it later, from
any terminal:

```powershell
$env:BITWARDENCLI_APPDATA_DIR = "$HOME\bitwarden-personal"; bw status
```

prints `"status":"locked"` or `"unlocked"` with the personal email.

### A machine with the personal account only

Nothing more: `bw config server …` and `bw login` in the default profile, as
above without the folder and the variable. With no `~/bitwarden-personal`
folder, the scripts use the default profile.

## Unlocking

Each script asks for the master password when the vault is locked, and keeps
the session for that run only. To type it once for several commands in a
row — the `wrangler secret put` of [hosting.md](hosting.md) among them —
unlock in the terminal that runs them:

```powershell
$env:BITWARDENCLI_APPDATA_DIR = "$HOME\bitwarden-personal"; $env:BW_SESSION = bw unlock --raw
```

That terminal's `bw` now speaks to the personal vault, unlocked. Close it when
done, or run `Remove-Item Env:BW_SESSION, Env:BITWARDENCLI_APPDATA_DIR`.
On a machine with the personal account only, drop the first assignment.

## Set the CI secrets

Both deploy jobs — `deploy-staging` in `ci.yaml` and `deploy-production.yaml`
— read two repository secrets, `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN`.

Prerequisites: the Bitwarden setup above; the entries `Github PAT` and
`Cloudflare Pages token`.

```powershell
pnpm secrets:sync
```

Expected: `CLOUDFLARE_ACCOUNT_ID set`, `CLOUDFLARE_API_TOKEN set`, then the
list of the repository's secrets with today's date beside both.

## Fill `.dev.vars` for `pnpm dev`

Only to open `/admin` on the local server. In a terminal unlocked as above:

```powershell
"ADMIN_TOKEN=$(bw get password 'melee ADMIN_TOKEN dev')" | Set-Content apps/server/.dev.vars
```

Then restart `pnpm dev`. The file is git-ignored (`.dev.vars*`); a worktree
copies it from the main checkout when it needs it.

## Add a secret

A value the game needs and nobody else may read enters Bitwarden before
anything else, because Cloudflare and GitHub never give a secret back.

1. In the personal Bitwarden, folder `Projects`, create a login item named
   `melee <VARIABLE> <environment>` for each environment, production included
   (`melee ADMIN_TOKEN production`, `melee ADMIN_TOKEN staging`,
   `melee ADMIN_TOKEN dev`). Its password is the value; for a random one,
   Bitwarden's generator at 40 characters or more.
2. Hand it on: to each Worker ([hosting.md](hosting.md), _Worker secrets_),
   and to `apps/server/.dev.vars` for local dev.
3. Declare it in `apps/server/src/env.ts`, which is where the Worker reads it.

## Renew a token

1. Create the new token on the provider, with the permissions in the table
   above (Cloudflare: _My Profile → API Tokens_; GitHub: _Settings →
   Developer settings → Personal access tokens_). For an `ADMIN_TOKEN`,
   Bitwarden's generator.
2. Paste it as the password of its Bitwarden entry, replacing the old one.
3. For `Cloudflare Pages token`: `pnpm secrets:sync`, so the CI deploys with
   it. `Github PAT` is read at each run and needs nothing more. An
   `ADMIN_TOKEN` is set again on its Worker ([hosting.md](hosting.md)).
4. Revoke the old token on the provider.
5. Prove it: `pnpm ship` with a commit to ship, or `gh workflow run ci.yaml`
   to deploy staging again.

## Common errors

| Message                                                                         | Meaning and fix                                                                                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Bitwarden is logged out (…)`                                                   | The profile named in the message has never logged in, or was logged out: `bw login` in it, as in the setup above.                                                               |
| `Bitwarden did not unlock: wrong master password?`                              | Retry; the master password is the personal account's.                                                                                                                           |
| `Bitwarden is locked … no terminal to ask the master password`                  | The script ran without a terminal (from another tool): unlock first and set `BW_SESSION`, as in _Unlocking_.                                                                    |
| `no Bitwarden entry named "…"`                                                  | The entry is missing, renamed, or its password is empty in the profile the message names. The script already ran `bw sync`. Fix the entry name in Bitwarden to match the table. |
| `the Bitwarden CLI did not answer`                                              | `bw` is not installed or not on the `PATH`: `pnpm add -g @bitwarden/cli`.                                                                                                       |
| `Bitwarden: reading … from the default Bitwarden CLI profile` on a work machine | `~/bitwarden-personal` does not exist, so the work account was asked: stop, and do the setup above.                                                                             |
| `could not set CLOUDFLARE_…`                                                    | The `Github PAT` token expired or lacks _Secrets · Read and write_ on the repository: renew it.                                                                                 |
