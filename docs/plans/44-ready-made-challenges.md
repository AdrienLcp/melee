# 44 — Ready-made challenges

**To do.** Asked 24/10/2026. A challenge round no longer needs the host to
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

## Decisions taken

- **Dealt by the server, not drawn in the console.** A round drawn from the
  running order has no console moment to draw in, and the server already deals
  every other bank without repeats.
- **No new game.** The bank is the challenge's content, the way flags are the
  quiz's.
