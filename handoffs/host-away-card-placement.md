# Handoff — where the host-away card goes on a player's screen

_Saved 2026-11-24 · `C:/git/melee`, on `main`._

Adrien, on staging: the « l'hôte a décroché » card showed **lower down**,
while the rest of the player's screen (a game's results) stayed visible.
« Avant, le bloc prenait tout l'écran non ? … Après c'est peut-être utile de
laisser des choses visibles, je sais pas trop. »

## To do

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
   arriving and leaving; CHANGELOG; push to `main`.
