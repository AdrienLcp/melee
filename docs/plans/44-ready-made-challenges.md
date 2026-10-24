# 44 — Ready-made challenges

**Done.** Asked 24/10/2026. A challenge round no longer needs the host to
think of one: *Bring back something red* is dealt from a bank when the line is
left empty, and the host can still type one of their own.

## Why it is a bank and not a game

*First to bring back a red object* is already the challenge's shape: the
wall shows a line, the table plays away from every screen, the host places the
first three (`core/challenge/place-pay`). What it lacks is the line. Today an
empty field draws *untitled* on the wall (`challenge.ts`, `challengeText`
optional on `host.startRound` and on the next-round message), which only works
when the host says it aloud — and a round drawn from the running order
(stage 42) is always empty.

## Step 1 — the bank

`apps/server/src/infrastructure/questions/challenge-bank.json`, written by hand
in both languages at once, `labels: { en, fr }`, as the timeline's bank is. Each
line carries a `category` so the deal can vary them:

- **fetch** — something red, an odd sock, a coin from another country,
  something that starts with M, the oldest object you can find in the room
- **do** — everyone in the team on one chair, a human pyramid of three, a
  hum the others name
- **festive** — something that glitters, wrapping paper, a bauble; tagged
  `isFestive` so it is dealt in December only if the host asks (step 3)

Around 120 lines. **The test for keeping one**: it can be done in a living room
in under two minutes, by anyone, with no purchase and nothing broken — no *go
outside*, nothing a seat in a wheelchair cannot do. A line that needs a
judgement the host cannot make at a glance (*the funniest object*) goes.

## Step 2 — the server deals it

When a challenge round opens with no `challengeText`, the server deals an
unplayed line from the bank, varying the category from the last round, and the
round carries it **in every locale** as the timeline's events do, so each screen
reads its own. A typed line still wins and rides as it does today, in the one
language it was typed in.

`challengeText` stays optional on the wire. What changes is that *absent* now
means *deal one* rather than *untitled*; the host who wants to say it aloud
types *Listen* — that is a line too. Tests: a dealt round carries a bank line,
a typed one carries the typed text, two rounds of an evening never deal the
same line, and no seat's or wall's transcript carries the line before its
round opens (step 3's `nextChallenge`).

**Done, with step 3.** The challenge arm's `text` is `labels: ChallengeLabels |
null` (a typed line is the same text under each locale; `null` only once the
bank is spent), so `PROTOCOL_VERSION` goes to 48 — an old tab cannot parse the
arm. The deal lives in `infrastructure/questions/challenge-dealer.ts`:
`keepChallengeAhead` runs as a room is created and after every settings frame,
`takeChallengeLine` as an untyped round opens (marks it played, deals the next
from another category), `redealChallenge` for the host's press. A blank typed
line deals. `room.nextChallenge` is read through `?? null`, since a room stored
before it reads `undefined`.

## Step 3 — the console

The server deals the next line **ahead**, between rounds, and carries it on the
host's arm alone (`nextChallenge`, every locale) — the wall and the seats would
spoil it. The console shows it as the empty field's placeholder, and an
**Another** button beside it sends `host.redealChallenge`. Typing replaces it,
so the host can read the line before the round, keep it, redeal it or rewrite it. The
challenge's arm gains `hasFestiveLines` (off by default), remembered with the
game's setup.

Verified in a browser, muted: a challenge opened with an empty field shows a
dealt line on the wall and on a phone in another locale, *Draw* fills the field,
a typed line wins.

**Done.** *Another* is the die beside the field (`challenge.line.redeal`), as
the inner clock's count has; it redeals rather than filling the field, since
the placeholder already is the line. The field became a growing text area
(`TextField`'s new `isMultiline`, Enter inserting nothing): a dealt line
scrolled out of a one-line input before the host could read it. The festive
switch sits in the challenge's entry settings; turning it off redeals a festive
line held ahead. Seen muted: dealt placeholder and redeal on the console, the
line on a paired wall in English and on a seat in French, a typed line
winning on both, the switch remembered in `melee:host-setup`.

## Step 4 — reflex takes the pale ink

Asked 24/10/2026, beside this stage. Reflex is the one spine on the home
shelf still inked dark: its saffron (`--spine-reflex`, `_tokens.sass`) is too
light to carry the pale ink, so `--on-spine-reflex` takes the dark one and the
card reads as the odd one out. Find it a background — still reflex's warm
yellow-to-amber family, still distinct from every other spine — dark enough for
`--on-spine-light` to pass WCAG AA (4.5:1 for the card's text) in **both**
palettes, then drop the exception and its comment. `impeccable` first; measure
the contrast rather than eyeball it, and check every place the spine is drawn
(home shelf, ticked box mark, `--phase-ink` on the reflex stage) in a browser.

**Done.** `--spine-reflex` is `oklch(55% 0.115 75)` (#986603, in gamut): the
pale `--on-spine` reads on it at 4.81:1, the spine is one value in both
palettes. Its dark-ink exception, `--on-spine-light` itself and the darkened
`--spine-mark-reflex` are gone; the countdown phase, the reveal's place chip and
the dropped-connection trigger take the pale ink. Seen muted on the shelf
(both palettes, phone and desktop), the reflex page, a ticked lobby box and a
reflex round through its flip and reveal.

## Decisions taken

- **Dealt by the server, not drawn in the console.** A round drawn from the
  running order has no console moment to draw in, and the server already deals
  every other bank without repeats.
- **No new game.** The bank is the challenge's content, the way flags are the
  quiz's.

## Step 5 — the bank, sorted by Adrien

Asked 24/10/2026 after reading the 135 lines. The bank becomes **fetch only**:

- **Drop the `do` category whole**, its tongue twister, *count to 100* and the
  lines where the table names things: several seats doing it at once out loud
  is noise the host cannot place.
- **Drop `festive` whole**, and with it `hasFestiveLines` — the setting, its
  switch in the entry settings, its tests and its strings.
- **One object per line.** Nothing that asks for several things at once.
- **Findable at home and at the office**: no candle, toothbrush and the like,
  no stamp, no envelope, nothing out of the pockets, no odd sock, no coin from
  another country.
- *Something with wheels* goes, *something that rolls* stays.
- **A letter drawn at random.** *Something that starts with M* becomes one
  templated line, `{letter}` filled when the line is dealt, from a short list
  that leaves out the letters nobody can find an object for (K, Q, W, X, Y, Z…);
  the letter is the same in every locale. A rule with no I/O, so the letter set
  and the fill live in `packages/core/src/challenge/`.
- Add new fetch lines in the same spirit to make up the count.

Then render the bank to a page for Adrien to keep sorting (one table per
category, French beside English) before anything else lands.

**Done.** 89 lines, every one a fetch: 37 kept, 52 written. With one kind of
line left the `category` went too — `challengeCategories`, `avoidCategory` and
the deal's *vary from the last* rule had nothing left to vary — so `dealLine`
is an unplayed line at random. `{letter}` is `LETTER_SLOT` in
`core/challenge/letter-slot.ts`, filled from `SLOT_LETTERS` (A B C D F G L M P
R S T) by the server's draw, so the console's line ahead already shows its
letter and a redeal draws another line rather than another letter.
`hasFestiveLines` left the challenge arm, which is `{ kind }` alone again; a
setup stored with it parses, the key stripped.

## Step 6 — a hand of lines for a judging host

Asked 24/10/2026. The line-up already plans the evening's *games* ahead, but a
challenge's *line* is still typed as the round opens or taken as dealt. A host
who only runs the room (`hasJudge`) gets a hand instead of one line:

- **Lines prepared before the evening.** The setup takes a list of the host's
  own lines, kept on the console's machine like the slate's answer keys, and
  sent on the press that opens the round. They are dealt first, in the order
  typed; the bank fills the hand once they run out.
- **A hand of three to five.** The host arm carries the next lines as a list
  (`nextChallenge` becomes a list, host arm only). Each slot can be redealt
  alone — the line it drops is not marked played — or pressed to open the round
  on it, and only that line is marked played. A typed line still wins.
- **Said aloud.** An explicit choice opens a round with a neutral wall, for a
  host who would rather announce the line than show it.
- A **seated** host keeps one line and the die: it plays the round, so it must
  not read a hand of lines it is about to be asked.

Screens through `impeccable`, directions as complete example pages behind one
index link, before any of it is built.

**Done.** Direction B of `.impeccable/directions/challenge-hand/` (local),
chosen 24/10/2026 over a row of cards that each opened the round on a press:
one coral press per moment, and the first line ticked so an untouched hand is
today's gesture. The server holds `challengeHand`, **three** lines
(`CHALLENGE_HAND_SIZE`; five ate the stage on a phone), one to a seated console;
`host.startRound` / `host.nextRound` carry `challengeAt` and
`isChallengeSaidAloud`, `host.redealChallenge` an `at`, and `PROTOCOL_VERSION`
goes to 53. The console's hand is `ChoiceList` (a new radio-row primitive),
composed by `challengeHandOf` in `core/challenge/challenge-hand.ts`: the
host's own unplayed lines first, then the bank's. An own line rides the wire
as typed text and is marked played on the machine once a round opens on it;
its die sets it aside until then rather than playing it. The own lines live in
`melee:challenge-lines` (`localStorage`, since they are written the day
before), edited under the challenge's page of the Games tab — reachable after
the game has been played, because they are no room setting. A round the hold
opens on its own takes the bank's first line, never an own one. Seen muted:
a picked slot after a redeal, an own line played and marked, *said aloud*
reaching a seat as *A challenge at the table*, the hand on a held console.

