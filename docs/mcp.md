# The assistant's door: `/mcp`

An assistant that cannot read this repository does not know the games exist.
`/mcp` tells it, and turns what it composes into a link the host opens. Stage
64 (`docs/plans/64-shared-evening.md`) holds the reasoning.

## The URL to give an assistant

| Environment | URL                                       |
| ----------- | ----------------------------------------- |
| production  | `https://melee.adrienlcp.com/mcp`         |
| staging     | `https://staging.melee.adrienlcp.com/mcp` |

It is a remote MCP server over plain HTTP: no account, no key, no OAuth.

The site gives a host the same steps at `/:locale/assistant`
(`features/assistant/`, stage 65), from the front door's menu, with the
address of whichever origin serves it. Keep the two in step.

- **Claude (web, desktop, mobile)**: Settings → Connectors → _Add custom
  connector_, and paste the URL.
- **Claude Code**: `claude mcp add --transport http melee https://melee.adrienlcp.com/mcp`
- **Any other client**: a _Streamable HTTP_ server at that URL. It answers
  every request with one JSON body and never opens a stream.

Then ask for an evening in words — _a two-hour evening for a family with
children, nothing to judge_, or _a quiz about our family_ — and open the link
the assistant hands back on the screen that will host.

## What it does

Two tools, both stateless:

- **`describe_games`** — every game, what a round of it is, its default
  settings, whether it serves its own content, how an evening is put
  together, and the ready-made _Free-for-all_ as a worked example.
- **`prepare_evening`** — takes `{ locale, evening }`, checks the evening
  (`eveningSchema`, then the running order and the draw) and answers each
  problem by its path, or the link: `/:locale/evening#1.<payload>`.

The link opens the evening page (`features/evening-link/`): the line-up as a
lid, _Open a table_ through the same door as every lid on the home page, and
_Save_ into the host's own line-ups. A kept line-up goes back out the same way:
_Copy the link_ beside it in the console's saved line-ups.

## What an evening may bring

An evening carries `decks` beside its line-up: a quiz entry may bring its own
questions, written by the assistant from what the host told it (plan 68). The
link page says how many, the console counts what is left of each and when it
is spent, and the entry deals from its bank from then on. The questions travel
in the fragment, are handed to the room by `host.setDecks` and reach no view;
a room's storage is wiped with the table.

**The link is the answer key.** Every question travels in it with its answer,
so whoever holds it can read them — the host included, seated or not. That is
accepted rather than worked around: the assistant page tells the host to open
the link themselves instead of sending it to the table. A table run again from
the home page's history plays every game's bank; the questions stay with the
saved line-up.

## What it never does

- **Open a room.** The room opens when the host's browser follows the link, so
  the room-creation limit still counts real addresses and no host token passes
  through a chat transcript.
- **Store or log an evening.** It reads what it is handed and returns it in a
  fragment, which no later request carries back to a server.

## Checking it answers

```sh
curl -s -X POST https://staging.melee.adrienlcp.com/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'
```

`serverInfo.version` is the build, as `/api/health` reports it. A name with an
accent sent from Git Bash arrives mangled: write the body to a UTF-8 file and
pass it with `--data-binary @file`.
