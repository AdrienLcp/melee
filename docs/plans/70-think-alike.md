# 70 — Think alike

A prompt goes up — _a red fruit_, _something you find in a fridge_ — and every
seat writes one answer on its own screen. The answers are grouped, and a seat
is paid by how many of the others wrote the same thing: Petit Bac turned inside
out, where the word nobody else wrote pays double. The reveal is the round:
the wall turns the groups over one by one, from the lone answers up to the
biggest, and the table cheers the crowd it was part of.

The twentieth game, **everyone at once** and paid at the close, the way the
estimate is: one answer a seat, priced against every other once the field
shuts. Kind `thinkalike`, translation prefix `thinkalike.*`, answer mode
`match`. _Pense comme la table_ in French, _Great minds_ in English — the
saying's first half, which no game owns.

## Rules, as settled

- **One prompt a round**, dealt from a bank written by hand in French and
  English: prompts with an obvious answer and a few runners-up, where a table
  of eight splits five, two and one. A prompt is not the answer and travels to
  every screen from the first frame. The room's `language` on the game's arm
  picks the wording, as the word games pick their dictionary: a table matches
  words, so every seat must be writing in the same language, whatever its own
  screen is set to.
- **One answer a seat, sent once**, at most 40 characters. The first word that
  comes to mind is the game, so there is no second try; a draft still on a
  screen when the clock runs out is sent for it, as a lean is everywhere else.
  The round closes once every seat it opened on has sent, or on the clock —
  **20 s by default, 10 to 60** — because a long clock lets a table out-think
  itself, which is the opposite game.
- **The same answer** is the shared normalisation — case, accents, spacing, a
  leading article — plus a plural fold: each word of four letters or more
  drops a final `s` or `x`, so _fraises_ is _fraise_ and _choux_ is _chou_. A
  word of three letters keeps it (_jus_, _bus_), and a fold that meets a word
  ending in `s` in the singular (_souris_) folds every spelling of it alike,
  so nobody is split from their crowd by it. Nothing closer folds on its own:
  _frigo_ and _réfrigérateur_ are the host's call (below).
- **The host merges, at the reveal.** The console may put one group into
  another — _frigo_ into _réfrigérateur_ — and take it back out, and the round
  is paid again on the spot, as Petit Bac's strike is. Not a room vote: a vote
  after every round doubles the round's length, and the argument over _frigo_
  happens aloud anyway; the host taps what the table decided. A seated host
  merging into their own group does it on the wall, in front of everyone.
- **The pay**: a seat's share of the round is how many of the _other_ seats
  the round opened on wrote its answer — `matched / others` of
  `MOST_A_ROUND_PAYS`. Matching every other seat pays the whole round, a lone
  answer nothing, a blank nothing. With eight seats, a crowd of five pays each
  member 4/7 (57), a pair 1/7 (14). Paid against _every_ other seat, not the
  biggest crowd, so a table split into pairs is a poor round for everyone
  rather than a perfect one.
- **No speed.** The clock is the pressure; paying it on top would reward the
  quickest typist, and the crowd's answer is no faster than a lone one. The
  room's `paysForSpeed` has nothing to switch off here (`paysTheClock: false`).
- **No duel.** Two seats thinking alike is a coin with one side: both paid in
  full or neither.
- **No level.** A prompt is not harder, it splits a table more or less, and the
  bank is written to split it a little every time.

## The shape, as decided

- **Mode `match`**, a mode of its own rather than `typed`: `typed` in the quiz
  allows as many guesses as the round does and is graded against a bank
  answer at once; here one line is sent and graded against the room, at the
  close. The attempt is `{ kind: 'match', answer }`, the verdict
  `{ kind: 'match', matched, others }`, priced by
  `@melee/core/thinkalike/crowd-pay`. `isFullyBanked` is the whole table
  writing one answer.
- **Anti-leak is the whole game until the close.** While the field is open a
  seat is sent its own answer and nothing else; the console — seated or not —
  and the wall are sent _who_ has sent, never a word. Every answer, grouped,
  goes public at the reveal: `groups` is `null` until then.
- **The groups travel smallest first** — lone answers, then pairs, up to the
  biggest crowd, ties by spelling — the order the wall turns them over in. Each
  carries its key, the spelling most of its members wrote and its authors; a
  merged group carries the keys folded into it, which is what _take it back
  out_ names.
- **A latecomer** is the estimate's: the round is stamped as it opens.
- **The host's own prompts** — an evening brought by an assistant
  ([68](68-evening-content.md)) — are public lines like most likely's: on the
  game's settings arm, dealt before the bank.

## Step 1 — plan, protocol and core (one session)

- `packages/protocol/src/think-alike.ts`: the prompt, the answer (≤ 40), a
  group as revealed, the round's clock bounds.
- `core/thinkalike/crowd-key.ts`: `crowdKey`, the shared normalisation with the
  plural fold, and `crowdGroups`, smallest first, merges applied.
- `core/thinkalike/crowd-pay.ts`: `pointsForMatch`, and `matchesOf`, each
  seat's `matched` and `others` from the groups.
- `apps/server/src/infrastructure/questions/think-alike-bank.json` and
  `think-alike-bank.ts`: the prompts in both languages, dealt unheard first.
- Each rule seen red under a mutation.

**Done 13/11/2026.** What it settled beyond the plan:

- **The kind, the mode and the verdict wait for step 2**, as Petit Bac's did:
  `thinkalike` in `gameKinds` or `match` in `answerModes` breaks every
  `Record` over them across the server and the app, so they land with the
  server that serves them. Step 1 is `think-alike.ts` alone in the protocol.
- **A merge that would close a loop is ignored** by `crowdGroups`, so a forged
  pair of merges cannot hang the grouping; the server still refuses merging
  into a group that is itself merged, which keeps the console's undo simple.
- **The plural fold runs per word before the normalisation**, because
  `normalizeAnswer` drops the spaces the fold needs to find a word's end.
- **187 prompts**, every one in both languages (`z.record` over the question
  languages is exhaustive), and none ending in `?`, `.` or `!`: a prompt is a
  line to complete, not a question asked aloud.

— cut here: plan written, protocol file, core rules and bank committed, tests green —

## Step 2 — the server (one session)

- `thinkalike` in `gameKinds`, **not** in `shelvedGames`; its arm of
  `settings.game` (`language`, `roundDurationMs`, `ownPrompts`), ten rounds by
  default, `match` its only mode, in `game-capabilities.ts`, `room-settings.ts`,
  `spaced-cycle.ts`, `ready-made-line-ups.ts` beside the others.
- The `match` mode, attempt and verdict; `domain/round/think-alike-round.ts`:
  the content, the answers kept, the pay at the close (`payEstimates`'s
  place), the merge and its undo (`host.mergeGroups`, `host.splitGroup`,
  refused outside `revealed`).
- The views: a seat's own answer, everyone's `answered`, `groups` at the reveal.
- `think-alike-game.test.ts`: no seat, console or wall frame carries another
  seat's word while the field is open, seen red with the guard removed; the
  pay; a merge re-paying and its undo; a latecomer refused `joined_mid_round`;
  the round closing once every seat has sent.

## Step 3 — the screens (one or two sessions)

Directions through `impeccable` first. A seat: the prompt large, one field,
_send_, then its answer held while the others write. The wall: the prompt, the
clock, a mark per seat that has sent. The reveal: the groups turned over one
by one, smallest first, each with its authors and what it paid. The console:
the merge, the setup (language, clock), the shelf, the door, both
dictionaries.

## Step 4 — the evening's own prompts

`ownPrompts` filled from an evening ([68](68-evening-content.md)), the MCP's
`describe_games` note, the ready-made line-ups.

## How to tell it is done

Muted, with `MAX_PLAYERS_PER_ROOM` seats at phone width and a paired wall:
nobody's word reaches another screen before the close; the round closes as
the last seat sends; the reveal turns the groups over smallest first; a merge
moves the board; two seats writing _Fraises_ and _une fraise_ are one crowd.
