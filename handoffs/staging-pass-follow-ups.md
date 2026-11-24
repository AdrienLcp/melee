# Handoff — staging-pass follow-ups, second half

_Updated 2026-11-24 · `C:/git/melee`, on `main`._

Same rules as the first half: **one `pnpm validate` at the end, one push to
`main`**, muted browser pass (24 seats, phone width and ~1000px, both
palettes), film every motion touched, one CHANGELOG entry per change, then
delete this file.

## Done and committed locally (not pushed)

1. **Menu over the console's seats** — the wide lobby gives the corner its
   own grid row (`host-console-page.sass`, `'invite corner'`); the old
   `> :first-child > h2` rule never matched (the side's first child is the
   folded `.table-start-hold`). `choice-fits` "scored full table" now also
   fails on anything under the menu (seen red without the fix). Player at
   375 had no overlap in any state probed.
2. **Mystery word refusal** — every refusal of `mysteryword.*`,
   `longestword.*` and the `error.*` twins is one short sentence in en/fr/pt
   (_Pas dans le dictionnaire._); the `{word}` echo is gone.
4. **Game named on every screen** — `SpineMark`, `RoundGame` (console and
   wall header), `RoundChrome` takes `lineUp` + `round`; named by
   `playingRoundName` (the press's rule, tested). Checked muted at 1000×760
   both palettes and 375: console, wall, player.

## Left

- **Film point 4's header motion properly.** `.playwright-mcp/round-game-check.mjs`
  filmed the wrong box at the desk layout (`.host-console-page > header` is
  not the header on screen there — the name sits in the stage card). Film the
  name arriving at the first countdown, swapping on a change of game, and
  leaving at the final board, on the console, the wall and a phone.
- **DESIGN.md** — add `RoundGame` / the chrome's spine under the header
  sections, and `SpineMark` beside `ThisRoundHeading`.
- **Point 3 and point 5: Adrien chose 3 → A and 5 → A (24/11).** Comparison page:
  `C:/git/melee-mockups/staging-pass/index.html`, served with
  `python -m http.server 4417 --bind 127.0.0.1` from that folder
  (`http://127.0.0.1:4417/index.html`). Recommended: **3 → A** (card at the top
  of the first viewport on the reveal and the final board, results kept under
  it; mid-round unchanged), **5 → A** (keep the shipped coral press).
  - 3 history: the card never took the whole screen on a reveal — only
    mid-round (`d75a3ada`); the reveal's card in the hold slot was a choice
    (`73de1f5c`, 27/10); the final board never had one. Where to change:
    move the host-away `.fold` out of `.hold` (`player-round-stage.tsx`
    ~308) to the top of `section.player-round.revealed`, give it a grid area
    in `round-beside-standings` (`player-round.sass` 12–45), add the same
    fold first in `section.player-round.finished` (~396), fold first in a
    column per `sass-architecture`; reword the comment in
    `helpers/player-screen-swap.ts` (f683a693) and `player-round-stage.tsx`
    306. Film the card arriving and leaving.
  - 5: if B or C, code in `next-round-press.tsx/.sass`, DESIGN.md _The
    next-round press_; mockup CSS in `compare.css` (`.spine-tab`,
    `.in-colour`). If A, nothing to build — say so in the changelog-free
    reply.
- Stop the dev server (`pnpm dev`, ports 3100/5273) and the 4417 server when
  done, then `pnpm validate`, push, delete this file.
