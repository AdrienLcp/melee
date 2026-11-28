# Handoff — change what the room plays without closing it, an end to every evening

_Saved 2026-11-28 · `C:/git/melee`, on `main`. Wave 2: starts once
`ready-and-reconnect` is on `main` (same settings and ready code). Start with
the `impeccable` skill for the menu and the console panel._

## 1. Switching the game with everyone already in the room

Adrien: « elle a coché tous les jeux (les trois derniers avec arbitre
obligatoire y compris, elle s'est trompée), pour remettre la game qu'on voulait
c'était relou : on a dû fermer le salon et en recréer un, alors qu'on était
tous déjà dans le salon. On aurait dû pouvoir juste changer la partie pour
lancer une mêlée générale. Soit on n'a pas trouvé comment faire. »

**The path exists and nobody found it.** `host.updateSettings` accepts a new
line-up between two rounds (`socket-handler.ts:2407-2529`, refused only while
a round is in play), and the panel's Jeu tab edits it mid-game
(`evening-rounds.tsx`, `setup-tabs.tsx:390-399`). Back to the lobby is two
steps: « Terminer la partie » in the menu (`app-menu-leaflet.tsx:140-149`) →
final board → « Retour à la table » (`finished-actions.tsx:105-107`,
`host.playAgain` → `restartGame`, line-up kept, scores at 0). And there is no
way to load a **ready-made** evening once a game has started.

**Decided.**

- The console's menu, while a game is on, offers **« Changer de partie »**:
  one press (with a confirm that says the scores restart) back to the lobby,
  seats kept, nothing planned, the picker and the ready-made row on the
  stage. Server-side it is `host.backToRoom` from any phase (the `replay`
  handler already accepts `revealed`, `socket-handler.ts:2217-2235`; extend it
  to a round in play, closing the round cleanly). The final board keeps its
  two buttons.
- The lobby's ready-made row stays reachable from the panel's Jeu tab too, so
  a host can swap the evening between rounds without the lobby. Decide by
  testing whether that is clearer than the menu entry alone; one of the two
  must be obvious within two taps.
- **Host-judged games in a multi-tick line-up.** Buzzer, Challenge and Slate
  are judged in every mode (`isJudgedInEveryMode`,
  `packages/core/src/room/game-modes.ts:63-66`). Ticking several games with one
  of them in is how she got there. The pick list says « L'hôte juge » already
  (`game-pick-list.tsx:91`): make the consequence plain at the moment it
  matters — when the line-up holds one, the start press says which games the
  host will judge, sitting those rounds out. Do not forbid it.

## 2. A default end to every evening

Adrien: « par défaut j'ai l'impression qu'une partie est "sans fin", je
préfère qu'on mette une limite. Genre un nombre de points ou de case ou de
manche ».

Today endless: Buzzer and Challenge (`DEFAULT_ROUND_COUNT`,
`room-settings.ts:28-67`) and the two biggest ready-mades, Mêlée générale and
Sans frontières (`ready-made-line-ups.ts:379-432`). Everything else has a
count.

**Decided: rounds, not points.** A round pays at most 100 everywhere, so a
points target only adds an end nobody can see coming, and the track board
already has its finish (`track-finish.ts`). Mêlée générale and Sans
frontières → **20 rounds**, like the others; Buzzer and Challenge → 10 (the
host still ends early or plays on from the final board). `null` stays a choice
in the panel, never a default. Update the tests that pin these
(`ready-made-line-ups.test.ts`, `room-settings` tests) and `CLAUDE.md`'s
sentence on `roundCount` if it reads as the default.

## Verify

Socket-harness test: back to the lobby from a round in play keeps every seat
and clears the round. Muted browser: open a line-up of every game, then from
the console's menu go back and start Mêlée générale, with three players
seated — nobody rejoins. Film the menu, the confirm and the stage change.
CHANGELOG entries.
