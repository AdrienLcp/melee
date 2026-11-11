# 68 — An evening that brings its own content

**To do.** Six sessions, one handoff each in `handoffs/content-0N-*.md`,
played in order. This file holds what they share. Each handoff holds that
session's own work.

## Why

Stage 64 gave an assistant a door (`/mcp`), and an evening it composes is
settings alone: every game deals from its own banks. What a table actually
asks an assistant for is _a quiz about the family_, _dares for this house_,
_who among us is most likely to…_ for these colleagues. Plan 64 left that out
on purpose: "carrying a host's deck is a stage per game, measured when one is
asked for". Adrien has now asked. The audit of all sixteen games, at
`4345dfc6`, is below.

## The finding that shapes everything: settings reach every screen

`toBaseView` copies `settings: room.settings` into every view
(`apps/server/src/domain/room/room-view.ts:366`). The base view carries
`settings: roomSettingsSchema` (`packages/protocol/src/room.ts:912`), and
host, player and wall views all extend it. So anything placed in a
`gameSettingsSchema` arm or a `lineUp` entry is part of the schema.
`encodeChecked` does not strip it, and every phone receives it in every
snapshot. The protocol already says so for the slate
(`client-message.ts:347-349`).

That gives two kinds of content, and two homes:

| Kind | Example | Home |
| --- | --- | --- |
| **Lines**: the content _is_ the question, and no answer exists | dares, _most likely_ lines, Petit Bac categories, slate labels, a blind test search | a field on the game's settings arm, public, read by the server |
| **Decks**: each item carries its answer | quiz questions, dated events, numbers to estimate, black square themes, slate answer keys | the evening's `decks`, never in settings, held by the server for the host alone |

## Settled

- **Lines live on the arm.** The server draws them, so they also play on the
  rounds nobody pressed. Auto-advance and an expiring reveal hold open a
  round "with none" (`round-conductor.ts:256-259`). This is why a console-side
  list, such as today's `melee:challenge-lines`, cannot be the evening's
  carrier. `HostPreferences` remembers them per game, the same way it already
  remembers Petit Bac's own categories.
- **Decks travel beside `lineUp`, never inside it.**
  - In the evening: `decks`, parallel to `lineUp` the way `lineUpDeals` is,
    with `null` where an entry has none. It is carried by the link and the
    saved evening.
  - Into the room: a new host-only message, `host.setDecks`. The console sends
    it in the lobby, on the first view only, beside the settings frame that
    `useRestoreStoredSetup` already sends.
  - In the room: the server keeps `room.decks` aligned with `lineUp`, and
    remaps it wherever `lineUp` is edited, exactly like `lineUpDeals`. It is
    stored in the Durable Object blob and projected into **no** view.
  - In the host view: a summary only, `{ size, played }` per entry, because
    a seated host is still a player.
  - Out of `GameSettings`, so `HostPreferences` and recent tables never copy
    a deck onto the next room.
- **A deck item is dealt before the bank, and a spent deck hands over to it.**
  An entry holding a deck deals its next unplayed item. Once the deck is spent,
  the entry deals from its bank like any other. `roundCount`, the running order
  and the draw keep their meaning, there is no new end state, and the console
  says the deck is spent. Plan 42's _prepared plays once_ rule does not apply:
  these are bank games carrying a deck, not host-brought games.
- **Item ids are `deck:<deckId>:<index>`**, with `deckId` minted when the deck
  is loaded, never the entry's index, because a drag renumbers entries.
  `playedContentIds` then deduplicates them like bank ids.
- **One pure validator per deck shape, in `packages/core/`.**
  `prepare_evening` runs it and answers each problem by its path. The server
  runs it again on `host.setDecks`, because a console is a client.
- **The link is the answer key.** Whoever the host forwards it to holds every
  answer, and a seated host knows them, as it already does with slate keys.
  That is accepted, and `docs/mcp.md` says it.
- **A size budget the assistant can copy.**
  - The assistant has to re-type the link out of the tool's text, and one
    wrong character makes the whole evening unreadable (no checksum,
    `evening-link.test.ts:42`).
  - `prepare_evening` refuses a fragment over `EVENING_LINK_MAX_CHARS`, set at
    **8 000**, and says what to trim.
  - Measured: about 1 000 characters for `grandMix`, plus about 87 per quiz
    question, or about 130 with a note.
  - Each deck shape has its own count cap on top of that.
- **The MCP input becomes strict.** Protocol arms are plain `z.object`, so an
  unknown key vanishes. Today an assistant sending a deck gets no error and a
  link without it. `eveningSchema` and what it nests use `z.strictObject` on
  the **write** side. Reading a link stays lenient (`savedEveningSchema`).
- **The link version stays `1.`** Decks are an optional field. The page that
  reads a link is always the deployed build, and an old saved evening simply
  has no decks.
- **A deck is played as written, in one language.** A record that requires
  both locales (timeline labels, _most likely_ lines) takes the one text in
  both, as a typed challenge line already does
  (`challenge-round.ts:31-36`). A custom item counts for no difficulty level
  (`docs/game-catalogue.md:397`, Petit Bac's own list).
- **Privacy.** Content passes through `/mcp`, processed and never stored, and
  through the fragment, which no request carries. A quiz about the family is
  personal data, though, so `/legal`'s sentence about what the assistant sends
  ("the line-up it composed, nothing about the visitor"), `docs/mcp.md` and the
  assistant page change in the session that first carries a deck (`privacy`
  rule).

## Not doing, and why

- **Blind test track lists.** `search` (a free query) and `playlist` (a Deezer
  id) already carry a blind test about anything, and they carry the theme, not
  the answers. A list of tracks would need Deezer ids an assistant would
  hallucinate, a resolution step and the secret store.
  `describe_games` should say this better (session 3).
- **Atlas places.** Valuable ("where each of us was born"), but the scale picks
  both the map and the pay reach, a point outside the France map cannot be
  placed, and the name direction needs four candidates. Reopen it when someone
  asks.
- **Buzzer cards.** A quiz deck played in `buzzer` mode is the same evening,
  already judged and scored.
- **Inner clock, Shades, Matchsticks, Reflex.** Their content is drawn or
  generated. A custom Shades colour is the answer itself, and a custom
  matchstick puzzle needs the solver to prove it has one move.

## Sessions

| # | Handoff | What it buys |
| --- | --- | --- |
| 1 | `content-01-deck-store-and-quiz.md` | `decks` on the wire, the host-only store, a quiz deck dealt by the server and accepted by `prepare_evening` |
| 2 | `content-02-quiz-deck-on-screens.md` | The link page, saved evenings and the console carry and show a quiz deck; legal and docs say what travels |
| 3 | `content-03-lines-and-descriptions.md` | `lines` for Challenge and Most likely; `describe_games` explains every setting it leaves out today |
| 4 | `content-04-timeline-and-slate-keys.md` | A timeline deck (family dates), and a slate's answer key as a deck |
| 5 | `content-05-own-numbers.md` | Le juste chiffre and Plus ou moins with their own prompt and unit |
| 6 | `content-06-black-square-themes.md` | A black square theme of the evening's own |

Every session commits and pushes to `main` with its changelog entry and this
plan's table updated. `pnpm validate` runs once, after session 6
(`one-validate-at-the-end`). CI covers each push in between.
