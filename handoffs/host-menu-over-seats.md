# Handoff — the menu covers the seats on the host's screen

_Saved 2026-11-24 · `C:/git/melee`, on `main` at `3a7060d2`. Nothing for it is written yet._

## Goal

Adrien, on staging, opening a table: « je vois le menu qui passe par-dessus
les places des joueurs sur l'écran de l'hôte ». The menu trigger (`AppMenu`,
top right) is drawn over the seats on the host console. It is a reported bug:
fix it.

## Where to look

- The console's lobby: `apps/game/src/features/host/lobby-stage.tsx`,
  `table-lobby.tsx` / `.sass` (the seats drawn with `seat-grid`).
- The menu's placement: `presentation/components/app-menu.sass` reads
  `--app-menu-position`, set by each page (see `sass-architecture`, _A
  `:has()` on the root never reaches past it_).
- The player's screen already had the same collision at 375px: on the
  player lobby the menu sits over the first seat row (seen in this session's
  screenshots). Check whether it is the same cause, and fix both.

## Verify

Muted browser, `MAX_PLAYERS_PER_ROOM` (24) seats with long names, phone width
and ~1000px, both palettes, console with and without a seat taken. Nothing
under the menu at any of `ROOM_VIEWPORTS`; consider adding the case to
`e2e/choice-fits.spec.ts` so it stays held. CHANGELOG entry, push to `main`.
