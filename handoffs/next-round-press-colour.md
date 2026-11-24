# Handoff — the next-round press, in the game's colour?

_Saved 2026-11-24 · `C:/git/melee`, on `main` at `3a7060d2`._

## Where it stands

`3a7060d2` shipped proposal **A, one piece**: a coral press, _Manche
suivante_ on top and the next game's glyph and name (game name alone) on a
smaller line under it. Proposal **B** was a tab in the game's colour rising
out of the press's top edge. The mockups that showed both
(`C:/git/melee-mockups/seat-and-next-round-press/`) are gone from disk.

Adrien, after seeing A on staging: « montre-moi les deux propositions qu'il y
avait, je me demande s'il ne serait pas mieux entièrement de la couleur du
jeu ».

## To do

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
