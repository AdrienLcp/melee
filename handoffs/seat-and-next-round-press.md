# Handoff — your seat opens, one-piece next-round press

_Saved 2026-11-24 · `C:/git/melee`, on `main`. Nothing for it is written yet._

## Goal

Build the two choices Adrien approved on 2026-11-24 from the mockups:

1. **Your seat opens (seat A).** In the lobby, the _Couleur_ press under your
   name goes. Your whole row becomes the press, with a small chevron at its
   end, and it opens one sheet holding your **name** (rename) and your
   **pawn** (head and colour). The row keeps the height of every other row.
2. **One piece (next-round A).** The next-round press becomes one coral
   piece. _Manche suivante_ stays on top, and the next entry (game glyph and
   entry name, e.g. _Petit Bac · 4 catégories tirées_) is printed on a
   smaller line under it, inside the press, in the press's own ink. The
   spine in the game's colour goes.

His words: « je ne suis pas fan du bouton "couleur" qui apparaît dans la case
du pseudo quand on arrive … ça agrandit la case et sa case voisine » and,
about the press, « ce bouton est très manche, il faut m'en proposer un
nouveau ».

## Mockups

`C:/git/melee-mockups/seat-and-next-round-press/` (outside the repository).
Serve the folder over HTTP, because a `file:///` page loses its relative CSS:

```powershell
python -m http.server 8731 --bind 127.0.0.1 --directory C:/git/melee-mockups/seat-and-next-round-press
```

`index.html` shows every option side by side. **`seat-a.html` and
`next-a.html` are the two that were approved.** `lobby.css` and `reveal.css`
hold the measured look: the sheet's layout (name field and _Changer_ above a
rule, three heads, then 12 colours, taken ones dimmed), the chevron that turns
as the sheet opens, the sub-line that opens with `grid-template-rows: 0fr → 1fr`,
and the name rolling up when the next entry changes. The mockups are plain
HTML with hand-copied tokens. Rebuild them with the app's own primitives
rather than copying their CSS.

## Where the code is

- `apps/game/src/presentation/components/own-pawn-press.tsx` is the press
  being removed. It is used by `features/player/player-round.tsx:243`
  (`youAction` on the lobby `Scoreboard`) and by `features/player/player-teams.tsx:61`
  (on your own team's head).
- `pawn-piece-press.tsx` (a `DialogTrigger` with a `Leaflet` sheet) is still
  used by the host's team recolour in `features/host/lobby-stage.tsx:249`.
  Keep it for that.
- Two pieces already in the menu to reuse rather than redraw:
  `menu-pawn.tsx` (the `PawnPiecePicker` under _Mon pion_) and `SeatName`
  in `menu-seat-rows.tsx` (rename, through `useRoomActions().rename`).
- `use-own-pawn.ts` gives the pawn, its holders, `onRecolour` and `team`.
- Look in `presentation/components/scoreboard*` for how `youAction` is
  rendered: the row itself has to become a react-aria press (a `Button` or
  `DialogTrigger` over the row), not a press added inside it.
- `apps/game/src/features/host/next-round-press.tsx` and `.sass` hold the
  spine to replace. Things to keep: `useLastShown`, the leaving face and its
  `onAnimationEnd` guard (`react-components`, _A state derived during
  render_), `useSizeGlideOnSwap`, and the `spineId` that both this press and
  _As a duel_ in `reveal-actions.tsx` are described by. The narrow layout
  (a band across the top) goes with the spine.
- `apps/game/DESIGN.md` has two passages to rewrite: around line 969
  (_The next-round press_) and line 255 (« the start of the next-round
  press » in the spine palette).
- Strings: `pawn.press.label` / `pawn.press.seat`, and `team.recolour.action`
  if the team head changes too, in `dictionary-en.ts` and every other locale.
  Drop the ones nothing reads any more.

## Still open (decide it yourself)

- **Teams.** With teams, a seat's pawn is its team's pawn. Following seat A,
  your team's head row would open the team pawn sheet (colour only; renaming
  a team is the host's job). Check how `player-teams.tsx` draws that head
  before choosing.
- **The seated host's console lobby.** If it draws its own seat with a
  colour press too, it gets the same treatment.
- Whether the header's `pawn + name` at the top left also opens the sheet.
  The mockup leaves it inert: one way in is enough.

## Verify

- In the browser, muted (`melee:volume` = `'0'` in an init script,
  `docs/browser-driving.md`). Check at phone width and at about 1000 px, with
  `MAX_PLAYERS_PER_ROOM` (24) seats under long names, one seat alone, and both
  palettes. Your row and the rows beside it keep the same height.
- **Film** both motions (`docs/browser-driving.md`, _Filming a motion_): the
  sheet entering and leaving, and the sub-line opening and closing and
  rolling to the next name.
- A table playing one game has no sub-line, and the disabled press stays
  readable. The next-round press still sits in the console's first viewport
  (`screen-roles`).
- Add a CHANGELOG entry for each change. Run `pnpm validate` once at the end,
  then push to `main`.
- When it all lands, delete this file and `C:/git/melee-mockups/seat-and-next-round-press/`.
