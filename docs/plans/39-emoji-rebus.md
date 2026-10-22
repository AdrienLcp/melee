# 39 — Emoji rebus

**Done 21/10/2026.** A title written in emojis — 🧊🚢💔 for *Titanic* — on
the wall and every screen, the room names it. Asked 21/10/2026.

## A rubric, not a game

The question stages 32 and 37 asked, and the same answer: the pool, the
countdown, both answer modes, the speed bonus, the reveal and the board are
the quiz's, unchanged. A rebus is a quiz question whose prompt is a row of
emojis. So it is an **eleventh chip**, `rebus`, and the quiz's well-known
switch is its difficulty.

## What was built

- **`rebus` in `questionCategories`**, and `rebus` on `questionPromptSchema`
  — `null` on every other question, otherwise the emojis, words parted by a
  space. Its own field rather than part of the prompt, because the prompt is
  the sentence asking what to name — *Quel film ?*, *Which saying?* — and the
  rebus is the thing to read. `PROTOCOL_VERSION` 40.
- **Dealt, not banked**, like the flags: `rebus-questions.ts` reads
  `rebus-fr.json` and `rebus-en.json` beside the bank and
  `bankedQuestions()` appends them, so every corpus sweep covers them. The
  repeated-question sweep keys a rebus on its emojis, since the sentence is
  one of four.
- **Four kinds in one chip** — `film`, `series`, `song`, `saying` — each
  row carrying its kind so the prompt says what a typed answer owes.
- **Hand-written lists, each language its own**: a French table reads
  *poser un lapin* and *Les Bronzés*, an English one *piece of cake* and
  *Home Alone*. Written by agents to a validator, then read through.
- **Readable on every phone**: every emoji is a fully-qualified sequence of
  Unicode Emoji 12.0 (2019), yellow, and never a flag — Windows draws a flag
  as its two letters. `rebus-emoji.json` is that list, generated from
  `emoji-test.txt` 12.0; `rebus-questions.test.ts` holds every row to it and
  to two to eight emojis.
- **`RebusLine`** (`presentation/components/rebus-line.tsx`) prints the row
  on the card under the subject and above the prompt, in the reader's own
  colour emoji face (`--font-emoji`), a word never broken across lines and
  the size capped so the widest word fits the card. On the reveal it stays
  above the answer, hidden from a screen reader, which reads the answer.
- **Eleven chips** divide by nothing: the strip tiles six, four, two and
  one across, and its last row runs short. `e2e/strip-rows.spec.ts` now lets
  a **grid's** last row run short, and still refuses a wrap's.

## Decisions taken

- A rubric rather than a game, as above.
- **No filter by kind.** The plan asked that a host could hold an evening to
  films or songs; that needs a second axis inside one chip, which the quiz
  does not have. The kind shows in the prompt. A line-up variant cannot hold
  it either.
- Eleven chips with a short last row, rather than finding a twelfth subject
  or folding one.
