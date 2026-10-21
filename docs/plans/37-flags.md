# 37 — Flags

**Done 21/10/2026.** A flag on the wall and
on every screen, the room names the country. Asked 21/10/2026 to widen the
evening.

## A rubric, not a game

The question stage 32 asked of quotes, and the same answer: the pool, the
countdown, both answer modes, the speed bonus, the reveal and the board are the
quiz's, unchanged. A flag is a quiz question whose prompt is a picture, whose
answer is a country and whose decoys are three other flags. So it is a **tenth
chip**, `flags`, and the well-known switch the quiz
already has is the difficulty switch the stage asked for. A table that ticks
it alone plays a flags round; one that ticks it beside history mixes them.

## What was built (server)

- **`flags` in `questionCategories`**, and `flag` on `questionPromptSchema` —
  `null` on every other question, otherwise a file name `flagFileSchema` holds
  to `<12 hex>.svg`, so a frame can never point a screen at another address.
  `PROTOCOL_VERSION` 38: a player tab parses `category` as an enum.
- **Dealt, not banked.** `question-bank.json` is rebuilt from a dozen downloads
  over an hour, so the flags are not written into it: `flag-questions.ts` builds
  the rows from `flag-bank.json` on the first draw and `bankedQuestions()`
  appends them, which puts them under every corpus sweep the bank already runs
  (winnable decoys, no repeated question, the forty well-known per subject).
- **The country names moved to `packages/core/src/countries/`**, since the
  server now grades a typed flag against the name the map prints. The app's
  dictionaries import them from there. `accepted` adds what a table says
  instead — *UK*, *Holland*, *RDC*, *Burma* — fourteen per language.
- **`scripts/build-flag-bank.ts`** (`pnpm --filter @melee/server flags:build`)
  copies `flag-icons` 7.6.0 (MIT) into `apps/game/public/flags/`, 2.1 MB,
  and writes `flag-bank.json`: each country's file, its three decoys and whether
  it is well known.
- **A file is named after its content, never its country**, because the prompt
  carries the name to every player. `flag-icons` also writes the country's code
  into every id and class (`id="ar-c"`, `class="bo-fil1"`); those are rewritten
  to `f-`, and `flag-questions.test.ts` reads every served file for a telling
  prefix — seen red with one put back.
- **Decoys look alike first, then live nearby**: 49 hand-written groups of
  flags a table mixes up (Romania and Chad, Ireland and Ivory Coast, the Nordic
  crosses, the pan-Arab and pan-African colours), then the nearest countries by
  the centre of their longest outline on the atlas. Neighbours' flags share
  colours often enough that the fill is rarely an easy one.
- **229 flags of the map's 236.** Seven fly a flag `flag-icons` draws exactly
  like another's — Heard Island (Australia), Saint Helena (the Union Jack), four
  French collectivities (the tricolour) — or that 4:3 makes identical: Monaco
  is Indonesia at another ratio. The build refuses any two files that hash
  alike.
- **77 well known**, chosen by hand: a flag is known from a pitch, a beach
  towel or the news, which no traffic count measures.
- **One prompt**, *Whose flag is this?* in both languages, because
  territories fly flags too. `quiz-game.test.ts` plays a flag to a player and
  checks the file arrives and the country never does — seen red with the answer
  pasted into the prompt.

## What was built (screens)

- **`FlagPicture`** (`presentation/components/flag-picture.tsx`) prints a
  flag on the card at 4:3, with the card's rule around it so a white field —
  Japan, Cyprus — keeps its edge. While the question is open its alt text is
  *The flag to name*; on the reveal, where the country is printed beside it,
  it is empty.
- **`AskedQuestion`** draws it under the subject and above the prompt, read
  after the prompt. The console sizes it at 40% of the stage's height, since
  the picture is the question and the sentence the same five words every time;
  the player's card keeps the default, so four choices still fit at 390.
- **The reveal keeps the flag on the card turned over**, above the country,
  on the console's panel and the player's answer card.
- **The credits page names `flag-icons`**, Panayiotis Lipiridis, MIT, and what
  the build changed.
- Ten chips tiled five by two and two by five landed with the server half.
- Seen muted at 1280×800 and 390×844, four choices in light and typed in dark:
  the question on console and player, then the reveal on both. The wall renders
  the same `RoomStage` and was not seen paired.

## Decisions for Adrien

- A rubric rather than a game, as above.
- Monaco is out rather than shown at 4:3 beside Indonesia.
- The 77 well-known flags and the look-alike groups are a first pass, in
  `build-flag-bank.ts`; a flag a table finds unfair is one line there.
