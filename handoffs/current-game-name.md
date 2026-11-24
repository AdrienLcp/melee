# Handoff — the game being played, named on every screen

_Saved 2026-11-24 · `C:/git/melee`, on `main` at `3a7060d2`._

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
  as a round opens and closes, CHANGELOG, push to `main`.
