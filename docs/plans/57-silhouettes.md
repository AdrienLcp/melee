# 57 — Silhouettes (a quiz rubric)

**To do.**

A country's outline goes up alone, filled, no map around it, no neighbour, no
label — *which country is this?* Four names on a pick, a field on a typed
round, a buzz on the buzzer.

**Not a game: a rubric of the quiz**, the third of its kind beside `flags` and
`capitals`. Both of those are `questionCategories` entries ticked as chips in
the quiz's setup, with no door of their own, and a silhouette is the same
question with a different picture: a country's name as the answer, three
countries as decoys, `isWellKnown` deciding what *Rester grand public* deals.
Giving it a kind would build a second quiz.

Category `silhouettes`, labelled *Silhouettes* in both languages.

## Rules, as settled

- **The picture is a file named after its content**, like a flag:
  `apps/game/public/silhouettes/<12-hex>.svg`, so the name gives nothing away
  and the player is sent `questionPrompt.silhouette` — a file name, never a
  code. The schema is the flag's (`^[0-9a-f]{12}\.svg$`).
- **Drawn once, at bank build time**, from the `world-atlas` 50m TopoJSON both
  apps already depend on: the country's merged outline
  (`countryOutlines()` logic) through `geoPath` with a projection fitted to
  that country alone — Equal Earth recentred on its centroid, so Russia and
  Chile are not torn by the antimeridian or the frame. `digits(1)` on a
  100×100 box: a few kilobytes a file. No topology ships to the quiz.
- **Mainland only when the overseas parts would give it away or shrink it to
  a dot**: France without Guyane and the Réunion, Norway without Svalbard,
  the United States without Alaska and Hawaii, the Netherlands without the
  Caribbean. Read from the existing *mainland box* in `countryOutlineOf`, not a
  hand list, then checked by eye.
- **Painted with a token, not a colour in the file**: the SVG holds the path in
  `fill="#000"` and the screen draws it as a `mask-image` over a
  `--silhouette-ink` token, so both palettes own its colour.
- **Which countries.** Every country the flag bank names whose outline is
  recognisable at 50m — the micro-states (Monaco, San Marino, Vatican, Nauru,
  Tuvalu…) and the archipelagos that render as a scatter of dots are left out,
  by an area floor measured at build time and a read of the contact sheet. The
  decoys are the flag bank's own (`decoys[3]`), which already prefer
  neighbours — a neighbour is exactly the hard silhouette decoy.
- **`isWellKnown`** is the flag bank's, so the two rubrics agree on what a
  general-public table knows.
- **Not `choiceOnly`**: typed works, *Italie* is typed as easily as picked.

## Steps

1. **The bank.** `apps/server/scripts/build-silhouette-bank.ts`
   (`silhouettes:build`), beside `build-flag-bank.ts`: draws each SVG, names
   it by content hash, writes `silhouette-bank.json` (`{code, decoys, file,
   isWellKnown}`); a contact sheet HTML in the scratchpad to read by eye
   before committing. `silhouettes` in `questionCategories`, the prompt arm in
   `question.ts`, `silhouette-questions.ts` beside `flag-questions.ts`, merged
   in `question-bank.ts`. A test that every banked file exists and every
   decoy is a banked country. `PROTOCOL_VERSION` bumped.
2. **Screens.** `SilhouettePicture` beside `FlagPicture`, the
   `--silhouette-ink` token in both palettes, the chip in the quiz's setup,
   `quiz.category.silhouettes` in both dictionaries, the reveal showing the
   outline beside the name. Seen muted on a console, a wall and a phone.

## How to tell it is done

- A quiz with only *Silhouettes* ticked deals outlines; four names on a pick,
  typed accepted with the country's aliases.
- No frame sent to a player names the country before the reveal.
- The outline reads in both palettes, and France is the hexagon.
- `pnpm validate` green.
