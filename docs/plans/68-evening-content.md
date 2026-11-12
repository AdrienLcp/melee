# 68 — An evening that brings its own content

**In progress — sessions 1 to 5 done.** Six sessions, one handoff each in `handoffs/content-0N-*.md`,
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

So nothing an assistant brings goes on a settings arm. Two kinds of content
exist, and they share one home:

| Kind                                                           | Example                                                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Lines**: the content _is_ the question, and no answer exists | dares, _most likely_ lines                                                                |
| **Decks with answers**: each item carries its answer           | quiz questions, dated events, numbers to estimate, black square themes, slate answer keys |

Both are **decks**: the evening's `decks`, never in settings, held by the
server and projected into no view. A line has no answer to leak, and it still
stays off the arm, for two reasons:

- Settings ride every snapshot to every screen. Sixty lines of 160 characters
  is about 10 KB, sent again on every frame of the evening.
- A _most likely_ line names somebody at the table. On the arm, any screen
  reads the whole list before it is dealt.

What is already on an arm stays there: Petit Bac categories, slate labels and
a blind test search are short, and every screen sees all of them as the round
opens.

## Settled

- **Lines are decks, dealt by the server.** Challenge and _most likely_
  lines take the deck path below, with arms of their own in `deckSchema`.
  Because the server holds them, they also play on the rounds nobody pressed:
  auto-advance and an expiring reveal hold open a round "with none"
  (`round-conductor.ts:256-259`). This is why a console-side list, such as
  today's `melee:challenge-lines`, cannot be the evening's carrier on its own.
- **A host's own lines go to the room whole, not into a deck.** The lines
  kept on the console's machine (`melee:challenge-lines`,
  `melee:mostlikely-lines`) belong to no entry and change mid-evening, while
  `host.setDecks` is lobby-only and replaces every deck, quiz decks the console
  no longer holds included. So `host.setOwnLines` carries the unplayed ones in
  any phase, sent on the first view and after each edit; every entry of the
  game deals them after its deck and before the bank, each told apart by its
  text (`own:<game>:<text>`) so a resend never deals a played line twice. The
  console marks a line played when a round puts it on the wall.
  A deck item therefore has no `answer` the dealing code may assume: the store,
  the ids and the hand-over to the bank are written over any item.
- **Decks travel beside `lineUp`, never inside it.**
  - In the evening: `decks`, parallel to `lineUp` the way `lineUpDeals` is,
    with `null` where an entry has none. It is carried by the link and the
    saved evening.
  - Into the room: a new host-only message, `host.setDecks`. The console sends
    it in the lobby, on the first view only, beside the settings frame that
    `useRestoreStoredSetup` already sends.
  - In the room: the server keeps `room.decks` aligned with `lineUp`. The
    console remaps `lineUpDeals` and sends the line-up whole, so the server
    realigns decks itself on every settings frame (`decksFollowingLineUp`:
    an identical entry first, then an entry of the same game left at the same
    index, which is one whose settings were tuned). It is
    stored in the Durable Object blob and projected into **no** view.
  - Off the server with the room: the Durable Object's storage is wiped
    (`deleteAll`) when the host closes the table and when it expires, tested,
    and `/legal` says the content goes with the table (session 1). Before
    plan 68 the close and the expiry already deleted the one `room` key, untested.
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
- **A deck is shown by its count, in its game's word, never its lines** — the
  room may be reading the console. The entry page shows it in its header.
- **A deck is counted the same way everywhere.** `DeckNote`
  (`presentation/components/deck-note.tsx`) prints `<game>.deck.count` and
  `<game>.deck.spent`, for any game with an arm in `deckSchema`: the next deck
  game adds those two keys to both dictionaries and nothing else. The console
  prints it on an entry's next round and on that entry's own page. Every copy of an evening carries
  `decks` — `SavedEvening.decks` is required, so a new copy decides — except
  `PlayedLineUp`, which drops them on purpose; `decksForLineUp` realigns them
  on the line-up a room was set to before `host.setDecks`.
- **A deck item may have no category.** `HostQuestion.category` is nullable,
  and the screen shows no chip for `null`; the bank's rows keep theirs.
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
  - Measured: about 930 characters for the 56-entry `grandMix` (2026-11-11),
    plus about 87 per quiz question, or about 130 with a note. The same
    line-up weighs about 6.7 kB in the room settings every snapshot carries
    to every screen, 12.4 kB at the 100-entry cap.
  - Each deck shape has its own count cap on top of that.
- **The MCP input becomes strict.** Protocol arms are plain `z.object`, so an
  unknown key vanishes. `prepare_evening` compares what it was given with
  what the parse kept (`unknownKeysOf`) and answers each dropped key by its
  path, which covers every arm of every union without a strict copy of each.
  Reading a link stays lenient (`savedEveningSchema`).
- **The link version stays `1.`** Decks are an optional field. The page that
  reads a link is always the deployed build, and an old saved evening simply
  has no decks.
- **A deck is played as written, in one language.** A record that requires
  both locales (timeline labels, _most likely_ lines) takes the one text in
  both, as a typed challenge line already does
  (`challenge-round.ts:31-36`). A custom item counts for no difficulty level
  (`docs/game-catalogue.md:397`, Petit Bac's own list).
- **Privacy.** Content passes through `/mcp`, processed and never stored, and
  through the fragment, which no request carries. In a room, it lives exactly
  as long as the table (above). A quiz about the family is
  personal data, though, so `/legal`'s sentence about what the assistant sends
  ("the line-up it composed, nothing about the visitor"), `docs/mcp.md` and the
  assistant page change in the session that first carries a deck (`privacy`
  rule).
- **A timeline deck deals by distinct years, every date played.** The
  bank's `MIN_YEARS_APART` would deal nothing from two births two years
  apart, so a deck's round asks only that no two events share a year, and
  `prepare_evening` refuses a tie. A deck of 5 to 40 events deals five a
  round (`dealDeckEvents`); once fewer than five are left, the round deals
  them all and fills up with events the room already ordered. Rounds of three
  or four were refused because `ORDER_TIERS` counts swapped pairs absolutely,
  tuned on five events — a shuffle of three is perfect one time in six — and
  topping up from the bank mixes a family date with the fall of Rome. The
  wire id is `deck-<index>`: an order names events by a slug the deck's own
  id does not fit, and a round is never half deck, half bank.
- **A slate deck keys one sheet, its entry's.** A prepared game plays once
  (`isPlayedOut`), so an entry is a sheet, and the labels the sheet shows sit
  on the entry: a tasting of three flights is three slate entries, each with
  its labels and its keys. The deck is the positional key list, `null` for an
  item without one, every key past `itemCount` refused; it lands on the host
  arm as the sheet opens, whatever opened it, and the press's typed keys are
  set aside. The deck counts its keyed items, so the note reads _3 home-made
  answer keys_ and turns spent as the sheet opens. An entry still holding a
  deck is never offered as a skip (`offersSkip`'s `bringsADeck`).
- **A number of the evening's own is asked in its own words.** The question
  a screen draws became a union on `kind`: `bank` keeps the family, worded and
  united by the dictionary, and `own` carries the deck's `prompt` and `unit`
  as written, one language shown in every one. A pair holds the same `ask`
  beside its two names, rather than an arm of its own, because the names and
  the values are the same shape either way. The unit is nullable — a bare
  count (_how many crêpes_) has none, and the field then prints no suffix.
  `PROTOCOL_VERSION` went to 75: a tab left open would read `pair.family` off
  a frame that no longer has it.
- **An estimate deck refuses what a ratio cannot pay.** `SPOT_ON_RATIO` and
  `ZERO_PAY_RATIO` pay everyone near a value the table already knows, so
  `estimateDeckProblems` refuses a unit whose first word names a year, an
  age, a percentage or a rank (French and English, accents folded; _litres
  par an_ stays a quantity), and a whole number from 1000 to 2100 with no
  unit, which reads as a year. Ages went in with years: an age of 29 still
  scores against 87. The assistant is told to ask counts, lengths, weights,
  durations and money instead.
- **A pair deck is checked against the bank's own floor.** Two sides closer
  than `MIN_PAIR_RATIO` (×1.15), a tie included, and two sides of one name are
  refused. Its sides are shuffled as dealt, because whoever writes a pair
  most likely puts the bigger first, and a round is one deck pair or the
  bank's, never both.

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

| #   | Handoff                             | What it buys                                                                                                |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | done                                | `decks` on the wire, the host-only store, a quiz deck dealt by the server and accepted by `prepare_evening` |
| 2   | done                                | The link page, saved evenings and the console carry and show a quiz deck; legal and docs say what travels   |
| 3   | done                                | Challenge and most likely decks of lines, `describe_games` notes, the host's own lines dealt by the server  |
| 4   | done                                | A timeline deck (family dates), and a slate's answer key as a deck                                          |
| 5   | done                                | Le juste chiffre and Plus ou moins with their own prompt and unit                                           |
| 6   | `content-06-black-square-themes.md` | A black square theme of the evening's own                                                                   |

Every session commits and pushes to `main` with its changelog entry and this
plan's table updated. `pnpm validate` runs once, after session 6
(`one-validate-at-the-end`). CI covers each push in between.
