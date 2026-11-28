# Handoff — the console's reveal on a TV: texts over texts

_Saved 2026-11-28 · `C:/git/melee`, on `main`. Wave 2: starts once
`reveal-standings` is on `main` — both rework the reveal's podium
(`round-podium`, `reveal-panel.sass`), and this one lays out what that one
lists. Start with the `impeccable` skill. Adrien pastes the seven photos into
this session: read them before anything else._

Adrien: « ma sœur a lancé la partie sur le navigateur d'une télé très récente,
ça marche pas trop mal, mais ça nous a fait remarquer pas mal de soucis de UI,
des textes qui se chevauchent etc, je te laisse voir les screens ».

## What the photos show

The **console with no wall**, seven seats, landscape, the setup rail on the
right (Partie / Jeu / Table / Salle / Joueurs). The aspect and type size say a
short viewport, about **960×540 CSS px** (a 1080p panel at 2×) — reproduce
there first in Chromium; if it does not reproduce, the TV's engine is the
cause and the fallback is the fix.

1. **Every reveal — the Menu pill sits on the first row of « Classement
   général »** and hides the leader's score (« 2 309 » half covered, « 279 »,
   « 380 »…). The same collision `staging-pass-follow-ups` fixed on the lobby
   seats, back on the reveal's standings: `--app-menu-position` per page
   (`app-menu.sass`), the standings column must start below it or the menu
   move.
2. **Most likely reveal.** « Passer cette manche » is drawn over the last
   tally row (its « 1 voix »); the red « Manche suivante » covers the
   « Qui de nous ? » podium; « Terminer la partie » runs over the podium's rows
   2 and 3 (« +100 »). The actions are positioned over the round's block
   instead of after it in the flow — `screen-roles.md` forbids exactly this.
3. **Timeline reveal.** « Manche suivante » covers podium rows 2-3 (R.O.M,
   MMA, « Dans l'ordre 90 +6 » cut in half). Same cause as 2.
4. **Five clues reveal (Sri Lanka).** The clue ladder collapses: the capital
   and its flag, « Kandy · Galle » and « Anuradhapura » print over one
   another in rungs 20 and 40, the leader's podium chip (« Adrien 36 +2 »)
   sits inside rung 40, the silhouette in rung 60 overflows it, and the
   wrong guesses' chips (Taiwan, Bangladesh, Népal) overlap the last rung
   (« 65,6 mille km² »). Rungs are fixed-height and their text does not fit.
5. **Blind test reveal.** The title « Amoureuse (Remasterisé en 2008) » runs
   into the standings column; the podium row's « 90 +4 » and the answer chips'
   pawns run under the standings' ranks. The stage column does not hold its
   width (`min-width: 0`, a clamp on the title, an ellipsis).
   Also: **« (Remasterisé en 2008) » is catalogue noise** shown to the room —
   the grading folds `- Remastered 2011` (`CLAUDE.md`, _Guess_), but the
   displayed title keeps Deezer's French-localised suffix. Fold the shown title
   too (the same noise list, in its localised forms), never the quiz's.
6. **Mot mystère reveal.** Seven grids in an inner scroll box, the second row
   cut at the bottom, « Marinette… » ellipsised. The wall never scrolls, and a
   console with no wall is what the room reads: fit seven (and 24) grids by
   shrinking them, per the give-way order of `screen-roles.md`.
7. **Mot mystère in play** (bars per seat): reads fine — the reference for
   what the others should feel like.

## Fix, and keep it held

Fix each on the console with no wall, then check the same reveals on a wall
at the same viewport. Add **960×540** (and 1280×720) to `ROOM_VIEWPORTS` and
to the shapes `screen-roles.md` checks, with a line on TVs: short, wide,
viewed from three metres, no hover. An e2e fit check (`e2e/choice-fits.spec.ts`
is the model) asserting no overlap between the actions, the podium and the
standings at those viewports, for the reveals above.

Find the TV's engine if the photos or Adrien say which TV (a recent LG runs
webOS Chromium ~108–120, a Samsung Tizen ~94–120): check what the app relies
on that such an engine lacks (`:has()`, container queries, `text-wrap`, view
transitions) and give each a fallback where its absence breaks a layout.

## Verify

Muted browser, 960×540 and 1280×720, 7 then 24 seats with long names, both
palettes: each of the six reveals above, nothing drawn over anything, nothing
scrolling on the console's stage. Film one reveal's entrance per game touched.
CHANGELOG entries.
