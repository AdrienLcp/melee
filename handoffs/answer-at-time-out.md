# Handoff — an unsent answer still counts when the clock runs out

_Saved 2026-11-28 · `C:/git/melee`, on `main`. Wave 3: starts once
`reveal-standings` and `console-on-a-tv` are on `main` (the award schema and
the podium). Last session of the series: it runs the one `pnpm validate`, then deletes the `handoffs/`
folder if the table is empty._

Adrien: « Dans le jeu allumettes, je te l'avais déjà dit, et il faut que ce
soit pour tous les jeux comme ça : quand on a changé un truc, qu'on n'a pas
encore validé, mais que le chrono arrive à la fin, il faut quand même prendre
en compte ce que le joueur a changé en dernier et l'envoyer comme réponse.
Imagine le joueur n'a pas le temps de cliquer sur valider alors qu'il avait
trouvé la solution à une seconde de la fin. »

« Je te l'avais déjà dit »: read `git log --grep=lean` and the plan that
introduced `player.lean` before starting, and say in the final reply why
matchsticks was left out then.

## What exists

`player.lean` (`packages/protocol/src/client-message.ts:253-288`): the client
streams its draft (`apps/game/src/features/player/use-lean.ts`,
`lean-sender.ts`, throttled 300ms, every change sent from 250ms before the
close — `helpers/lean-delay.ts`), the server keeps it (`registerLean`,
`round-service.ts:669-736`) and banks it unsent at the close
(`takeUnsentLeans`, `:847-875`), paid with `isUnsent: true` and no speed. The
server has no grace past `durationMs` (only Petit Bac and Le compte est bon
add 500ms), so the lean is the only way a last-second change counts.

Covered today: Atlas pin, Shades, Timeline, Mot le plus long, Le compte est
bon, Pense comme la table, Petit Bac (its own line sender), Slate.

**Lost today:** Allumettes (the move), Le juste chiffre (the number), Plus ou
moins (the picks), Mot mystère (a full word typed, not sent), and every typed
line — quiz, blind test, black square, five clues — excluded on purpose (« a
typed line is a guess only once it is sent », `client-message.ts:262-263`).

## Decided

Every game whose answer is edited before it is sent leans, so the last state
on screen at the close is the answer:

- Allumettes: the stick moved — a `match` lean exists in the schema, wire the
  move screen (`matchsticks-move.tsx`) to it.
- Le juste chiffre: the number in the field.
- Plus ou moins: the pick.
- Mot mystère: a full-length word in the row counts as one last try.
- Typed lines (quiz, blind test, black square, five clues): the field's
  content at the close is graded as one last guess. Adrien's rule beats the
  old one; rewrite the comment and `docs/realtime-protocol.md` to say so. A
  blank field is no answer.

All paid as `isUnsent` (no speed share), shown as such on the podium (the
`unsentSeats` line). The anti-cheat holds: a lean is a draft from the player
to the server, nothing comes back before the reveal
(`.claude/rules/realtime-protocol.md`).

## Verify

A socket-harness test per newly covered game: a lean then the close pays the
lean; a send after a lean still wins. Break each once. Muted browser: in
Allumettes, move the stick with one second left, never press — the reveal
pays it. Same for a typed quiz line. Then the one `pnpm validate` of the
series, push, CHANGELOG entry.
