# Handoff — five follow-ups from Adrien's staging pass

_Saved 2026-11-24 · `C:/git/melee`, on `main`._

**One session for all five, one `pnpm validate` at the end, one push to
`main`** — Adrien: « c'est vraiment des sujets minuscules, je ne veux pas un
validate pour chacun … je veux tout traiter d'un coup ». Start with the
`impeccable` skill once, for the three that touch layout (2, 3, 4) and the
press (5); the two that need his choice (3 and 5) go to him as **one**
comparison page served on `http://127.0.0.1:<port>`, a link he opens in his
own browser, while the rest is being built. Verify everything in one muted
browser pass at the end (24 seats, phone width and ~1000px, both palettes),
film every motion touched, one CHANGELOG entry per change, then delete this
file.

## 1. The menu covers the seats on the host's screen

### Goal

Adrien, on staging, opening a table: « je vois le menu qui passe par-dessus
les places des joueurs sur l'écran de l'hôte ». The menu trigger (`AppMenu`,
top right) is drawn over the seats on the host console. It is a reported bug:
fix it.

### Where to look

- The console's lobby: `apps/game/src/features/host/lobby-stage.tsx`,
  `table-lobby.tsx` / `.sass` (the seats drawn with `seat-grid`).
- The menu's placement: `presentation/components/app-menu.sass` reads
  `--app-menu-position`, set by each page (see `sass-architecture`, _A
  `:has()` on the root never reaches past it_).
- The player's screen already had the same collision at 375px: on the
  player lobby the menu sits over the first seat row (seen in this session's
  screenshots). Check whether it is the same cause, and fix both.

### Verify

Muted browser, `MAX_PLAYERS_PER_ROOM` (24) seats with long names, phone width
and ~1000px, both palettes, console with and without a seat taken. Nothing
under the menu at any of `ROOM_VIEWPORTS`; consider adding the case to
`e2e/choice-fits.spec.ts` so it stays held. CHANGELOG entry.

## 2. Mystery word: one short refusal

Adrien: typing a word that does not exist shows « essai non compté » on top
of « ce mot n'est pas dans le dictionnaire ». He wants only « Ce mot n'existe
pas » or « n'est pas dans le dictionnaire ».

- The refusal is `error.not_in_dictionary` (`dictionary-fr.ts:656`):
  _Ce mot n'est pas dans le dictionnaire. Ça ne t'a pas coûté d'essai._, and
  `not_one_word` beside it carries the same tail. Find where else the
  mystery word screen prints a « non compté » line (the player's grid, under
  `features/player/`, `mysteryword.*` keys) — two lines say it twice.
- Keep one short sentence in all three locales (en, fr, pt): « Pas dans le
  dictionnaire. » The grid not losing a row already says no try was spent.
  Check `longestword` uses the same code before changing its words.
- Verify in a muted browser at phone width; CHANGELOG entry.

## 3. Where the host-away card goes on a player's screen

Adrien, on staging: the « l'hôte a décroché » card showed **lower down**,
while the rest of the player's screen (a game's results) stayed visible.
« Avant, le bloc prenait tout l'écran non ? … Après c'est peut-être utile de
laisser des choses visibles, je sais pas trop. »

### To do

1. Read the history before answering (`git log -S` on the host-away card,
   `swapsThePlayerScreen`, `LiftedNotice`; CLAUDE.md _A state change moves_
   and `screen-roles`): did the card take the whole screen and stop, on
   which phases, and was that a choice or a regression? Say which to Adrien.
2. Proposal to weigh with him, not a decision: where nothing is pressed
   against a clock (a reveal, the final board, the lobby), keeping the
   results under the card is worth it — but the card goes **at the top of
   the first viewport**, never below what is already there. Mid-round the
   card keeps replacing the round, which cannot be played anyway.
3. Start with the `impeccable` skill (layout); verify muted at phone width
   on the lobby, a reveal and the final board, 24 seats; film the card
   arriving and leaving; CHANGELOG.

## 4. The game being played, named on every screen

Adrien: « afficher le nom du jeu en cours sur l'écran de l'hôte (et sur le
wall) pendant que les joueurs jouent — et peut-être aussi sur l'écran du
joueur s'il y a la place ».

- Start with the `impeccable` skill: it is layout on three roles. The reveal
  already heads the round with the entry's name (`ThisRoundHeading`,
  `playedRoundName` in `presentation/i18n/line-up-entry-names.ts`); during
  `countdown → playing → buzzed` nothing names the game. Look at the console
  and wall headers (`round-chrome`, the header's `LeavesInPlace` pieces,
  `arrival-notice`) for where a glyph + game name fits, and at the player
  header for the room it has.
- Constraints: `screen-roles` (the wall never scrolls; an answering screen
  never scrolls, so on a player the name is the first thing to give up),
  `sass-architecture` (it enters and leaves with a motion), one entry name
  rule: the game's name alone, the entry's only beside another entry of the
  same game (`useEntryName`).
- Propose as example pages first if more than one placement is plausible;
  build, verify muted with 24 seats at every role and width, film the header
  as a round opens and closes, CHANGELOG.

## 5. The next-round press, in the game's colour?

### Where it stands

`3a7060d2` shipped proposal **A, one piece**: a coral press, _Manche
suivante_ on top and the next game's glyph and name (game name alone) on a
smaller line under it. Proposal **B** was a tab in the game's colour rising
out of the press's top edge. The mockups that showed both
(`C:/git/melee-mockups/seat-and-next-round-press/`) are gone from disk.

Adrien, after seeing A on staging: « montre-moi les deux propositions qu'il y
avait, je me demande s'il ne serait pas mieux entièrement de la couleur du
jeu ».

### To do

1. Start with the `impeccable` skill. Rebuild a comparison page (one index
   linking or showing every option side by side, real content, served on
   `http://127.0.0.1:<port>`, link given to Adrien to open in his own
   browser): **A** as shipped, **B** the tab, and **C** the whole press in the
   game's colour — `--spine-<game>` ground, `--on-spine-<game>` ink (dark ink
   for reflex), `--spine-edge-<game>` edge.
2. Weigh C honestly and say it to him: the coral is the product's single
   _go_ colour on every screen; a press repainting per game loses that, and
   the buzzer's vermilion beside coral is 1.35:1, so a buzzer next round
   would look like the default press. Show each game's colour (reflex's pale
   one at least) and the disabled socket.
3. Build what he picks; film the change of game (the press repainting and
   the name rolling). Code: `apps/game/src/features/host/next-round-press.tsx`
   / `.sass`, `reveal-actions.tsx`, DESIGN.md _The next-round press_.
