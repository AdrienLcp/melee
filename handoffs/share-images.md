# Share images — redraw with every game

Series: `handoffs/README.md`. Needs nothing. Read `apps/game/DESIGN.md`,
_The mark_, first.

## Why

`og.png`, `og-fr.png` and `og-pt.png` (`apps/game/public/`, 1200×630) show
16 spines. Four games joined the shelf after they were last drawn
(`1262f647`): mystery word, longest word, make the number and think alike.
`og-pt.png` (`ddc1fc07`) copied the 16-game layout on purpose, so the three
match.

## The work

1. **A layout for 20 spines.** Two columns of ten no longer fit the
   current spine height (55px, 10px gaps, from y=58): a design change, so it
   starts with the `impeccable` skill and three example pages Adrien compares
   before any file is replaced.
2. **Compose from the live front door.** Run the dev server, then Playwright
   MCP's `browser_run_code_unsafe` at a 1200×630 viewport on `/en`, `/fr`,
   `/pt`, muted (`melee:volume` = `'0'` in an init script). `.playwright-mcp/
   og-compose.js` (git-ignored, may be gone) did it for `pt`: a fixed
   1200×630 card over the page on `var(--board)`; the `h1.wordmark` cloned
   at 126px with its computed font, colour and the dot's colour copied over;
   the promise at 31px Bricolage on three lines from y=406, the sub-line at
   20px Atkinson from y=540; the spines cloned from `.spine` in the
   shelf's DOM order, `.tick` and `.tagline` removed, `data-selected` set,
   names `nowrap`. Promise texts:
   - en: _A whole evening of games. / One QR code, / and the room is
     playing._ — _No install, no account._
   - fr: _Toute une soirée de jeux. / Un QR code, / et la salle joue._ —
     _Sans installation, sans compte._
   - pt: _Uma noite inteira de jogos. / Um código QR, / e a sala joga._ —
     _Sem instalar nada, sem conta._
3. **Check** `share-image.test.ts` (signature, chunks, size) and that every
   name fits its spine in all three locales — _Adivinha a música_ and
   _Frise chronologique_ are the longest.
4. Keep _The mark_ in `DESIGN.md` true, add a CHANGELOG entry.

## Done when

The three images show every game, `pnpm validate` is green, this file is
deleted and its row struck from `handoffs/README.md`.

<!-- cspell:words Adivinha música Frise chronologique soirée salle joue installation compte noite inteira jogos código sala joga instalar nada conta -->
