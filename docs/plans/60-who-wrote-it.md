# 60 — Who wrote it (qui a écrit ça ?)

**To do.**

A prompt goes up — *the worst present anyone ever gave you; what you would do
with a free afternoon* — every seat writes a short answer on its own screen,
then every seat gets the answers back, shuffled and unsigned, and says who it
thinks wrote each one. Guessing right pays, and so does fooling the table.

The seventeenth game, **submit-then-vote** in the catalogue's shapes, built on
the two that came before: Petit Bac's write-then-vote round and Most likely's
ballot for a seat.

Kind `whowrote`, translation prefix `whowrote.*`, answer modes `written` then
`authors`. *Qui a écrit ça ?* in French, *Who wrote it?* in English.

## Rules, as settled

- **Two phases inside `playing`**, as Petit Bac has: `writing`, then
  `matching`. The round's content says which, and the reveal comes after the
  second.
- **Writing.** One line per seat, 1–80 characters, editable until the phase
  closes — like a Petit Bac sheet, not a one-shot — because a line is
  rewritten as often as it is written. The phase closes when every seat the
  round opened on has marked itself done, or after `writeMs`, 30–120 s, **60 s
  by default**. A seat that wrote nothing is in the round but has no line.
- **Matching.** Every seat is sent every line but its own, shuffled per seat,
  with **no author on any frame** — the authors are the answer, encoded away
  through the player schema like any answer. It assigns a seat to each line,
  any seat the round opened on but its own, a seat usable more than once (a
  table does not have to solve a permutation). One sheet, one shot. Closes when
  every seat has sent, or after `matchMs`, 20–90 s, **45 s by default**.
- **At least three seats with a line**, or matching is skipped and the round
  goes straight to a reveal of the lines — two lines and two seats is not a
  guess. Never refused at the start: a seat may write nothing.
- **The pay**, `@melee/core/whowrote/`: one point per line attributed right;
  the author one point per seat that attributed their line to someone else,
  capped at two so a long table does not pay a cryptic line more than the
  guessing does. No speed bonus.
- **The reveal**, line by line: the line, its author, how many found it. The
  wall steps through them, as the slate's collected items do.
- **The prompts** — `whowrote-bank.json` beside `most-likely-bank.json`, each
  `{ id, labels: { en, fr } }`, 100 at least, held to Most likely's three
  rules: never situational, kind, gender-neutral in French. Written by hand,
  read row by row. A room is never dealt a prompt twice.
- **Nobody judges.** A seated host plays.
- **No duel**: two authors cannot fool each other.

## Steps

1. **Protocol, core, server.** `who-wrote.ts` in protocol (the line, the
   phases, the matching sheet `{ kind: 'authors', picks: { lineId, seatId }[]
   }`), the pay in core with tests, the prompt bank with its loader and test,
   `who-wrote-round.ts` modelled on `petit-bac-round.ts` (the writing phase,
   the close, the matching), the socket suite: no author on any player frame
   before the reveal, a seat's own line never in its matching list, a seat not
   on the round refused, the three-seat skip.
2. **Screens.** The prompt on the wall with a count of lines written, the
   seat's text field and *done*, the matching list (a line on a card, a row of
   `SeatTile`s under it), the reveal line by line on the wall and as a list on
   every seat. Shelf, spine, dictionaries. Seen muted on a wall, a seated
   console and three phones.

## How to tell it is done

- A room of four opened on *Qui a écrit ça ?* writes, matches and reveals,
  each line with its author and its finders, and the board moves by the pay.
- No player frame names an author before the reveal.
- A room of two writes and goes straight to the lines.
- `pnpm validate` green.
