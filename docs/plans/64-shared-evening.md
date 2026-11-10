# 64 — An evening shared by link, and a door for an assistant

**In progress** — asked 10/11/2026. Session 1 (schema, link codec, `/mcp`)
landed; session 2 (the evening page and _copy the link_) is next.

## Why

A host composed _Free-for-all_ (`grandMix`) — every game, spaced, each on options that
vary the evening — with an assistant that could read this repository. One
that cannot does not know the games exist, let alone their options, and has
nowhere to put what it composes. Two holes, one feature:

- **An evening travels as a link.** Saved evenings already go out and back in
  as a file (`saved-evenings-transfer.tsx`, stage 49), and stage 49 left
  "sharing by link" for later. A link is what a chat, a message or an
  assistant can hand over.
- **An assistant gets a door**: a remote MCP endpoint on the Worker that
  describes the games and turns an evening into that link.

## The shape

- **`eveningSchema`** (`protocol/evening.ts`) is an evening as it travels:
  the `SavedEvening` shape, strict — an entry is a game's whole settings or
  only its kind, at least one, `LINE_UP_MAX_ENTRIES` at most. The name's cap
  moved there from core, as `EVENING_NAME_MAX_LENGTH`.
- **The link** is `/:locale/evening#1.<payload>` (`EVENING_PAGE_ROUTE`), the
  payload the evening's JSON, deflated and base64url'd
  (`core/room/evening-link.ts`). Decoding returns `unknown`: the page reads it
  through the app's lenient `savedEveningSchema`.
- **`/mcp`** (`MCP_ROUTE`) answers JSON-RPC over plain HTTP POST, stateless:
  `initialize`, `ping`, `tools/list`, `tools/call`, notifications accepted
  with a 202. Two tools:
  - `describe_games` — every game, what it is, its default settings, whether it
    may sit in the draw, how an evening is put together, and the ready-made
    _Free-for-all_ as a worked example.
  - `prepare_evening` — validates an evening (schema, then `orderHolds` and
    `dealsHold`), answers each problem by its path so the assistant can fix
    it, and returns the link on success.

## Settled

- **The MCP opens no room.** It returns a link; the room opens when the host's
  own browser follows it, through the ordinary door. So the room-creation rate
  limit still counts real addresses — every assistant calls from its
  provider's few — and no host token passes through a chat transcript.
- **The fragment, never the query.** A fragment reaches no request, so a
  shared evening never lands in a server log and `/legal` stays true. The MCP
  reads the evening it is handed and stores nothing.
- **Reading a link is lenient, writing one is strict.** A link outlives the
  build that wrote it; the lenient schema keeps an entry whose settings
  changed shape as its game, so a shared link never freezes the settings
  schema. The `1.` prefix is there for the day the payload itself changes.
- **Hand-rolled, not the MCP SDK.** Four methods, no session, no stream: the
  same reasoning as the raw WebSocket. A library would bring a transport and
  a schema dialect this endpoint never uses.
- **Any origin may call `/mcp`.** The spec's origin check guards a _local_
  server against DNS rebinding; this one is public and holds no credential,
  so a browser-based client is let in like any other.
- **Out of scope:** an evening's own questions (a quiz on the family). Every
  game that serves its own content deals it from its banks; carrying a host's
  deck is a stage per game, measured when one is asked for.

## Sessions

1. **done** — `eveningSchema`, the link codec, `/mcp` with both tools, tests.
2. The evening page at `/:locale/evening` (impeccable first): the evening's
   name, its games and its length, _Open a room_ (`openLineUp`) and _Keep it_
   (into the saved evenings), and the state for a link this build cannot
   read. _Copy the link_ beside each saved evening. Filmed, both palettes,
   phone width. Then `docs/mcp.md`: the URL to give an assistant.
