# Player screen fixes after a two-player evening

Four reports from Adrien after a real game, all on what a screen shows. Every one
is UI: start with the `impeccable` skill, verify each in a muted browser, at
phone width and with a full room (`MAX_PLAYERS_PER_ROOM` long names) where the
screen lists seats.

## 1. Atlas: the confirm box's arrow shows a square

> « dans le jeu Atlas, quand on place notre guess, avant de valider, on voit un
> bloc avec une flèche et des boutons "valider" et tout, mais la flèche est
> buguée, on voit la partie haute du carré »

- Buttons: `apps/game/src/features/player/map-answer.tsx:59-81`, placed in
  `MarkerActions`, `apps/game/src/presentation/components/world-map.tsx:343-387`
  (position from `perchedOver`, `apps/game/src/helpers/map-view.ts:212`).
- Arrow: `world-map.sass:109-151`, an `&::after` 0.875rem square rotated 45deg,
  centred on the box's bottom edge, `[data-below]` flips it (line 135).
- Probable cause (read, not yet seen rendered): half the diamond sits *inside*
  the box and paints over its content (no `z-index: -1`, no `isolation`), and
  the box's 4px `--chipboard` ledge (`box-shadow … 0 4px 0`, line 114) leaves
  the diamond starting above the ledge, so its outline does not join the box's.
- Decided: draw only the half that sticks out (clip-path or a border
  triangle), offset by the ledge so the point continues the box's outline, in
  both orientations (`data-below`) and both palettes. Screenshot it first to
  confirm the cause.

## 2. Quiz: keep the question on the reveal

> « Laisser la question affichée quand on affiche la réponse d'une question à
> un quiz. »

- No protocol change: the quiz round view keeps `prompt` after the reveal
  (`packages/protocol/src/room.ts:578-583`, sent by
  `apps/server/src/domain/room/room-view.ts:556-566`).
- Console and wall: `RevealPanel`, quiz branch at
  `apps/game/src/features/host/reveal-panel.tsx:164-185` — draws flag,
  silhouette, rebus, answer and note, never `prompt.prompt`. One fix covers
  both (through `RoomStage`, `room-stage.tsx:427-458`).
- Player: `Revealed`, quiz branch at
  `apps/game/src/features/player/player-round.tsx:1364-1383`, same omission.
- Reuse `AskedQuestion` (`presentation/components/asked-question.tsx`) or
  `RoundQuestion` (`features/player/round-question.tsx:13`) for the sentence
  only — flag, silhouette and rebus are already drawn on the reveal.
- The wall never scrolls (`screen-roles`): check the full-table reveal on the
  wall still fits with the question added; the question gives way (smaller
  voice) before the answer does.

## 3. "4e sur 6" when you answered first

> « Sur le device du joueur les gens sont surpris que ce soit écrit "4eme sur 6"
> par exemple alors qu'ils ont répondu en premier. »

- `player.standing.ofRoom` (`dictionary-fr.ts:1466`), rendered by `YourRound`,
  `apps/game/src/features/player/player-round.tsx:1009-1050` (line 1042), right
  under the round's payout and speed bonus.
- The rank is the **game's** standing (`standingOf`,
  `packages/core/src/scoring/scoreboard.ts:82`: case, then score, then name;
  `teamStandingOf` for teams), not this round's. Placed under "+N", it reads as
  the round's placing. Adrien's players are right to be surprised.
- Decided: say both, each labelled. The round's own placing from
  `round.awards` (first right answer = 1st of the round) beside the payout,
  and the game standing labelled as such ("au général" / "overall"). A seat
  that scored nothing this round shows no round placing. Team room: the
  team's game rank stays, labelled the same way.

## 4. Disable controls while disconnected

> « Quand on est déconnecté ou en reconnexion, il faut désactiver tous les
> boutons non ? »

Yes — on the player page a press offline is silently dropped (`send` returns
`false`, no queue: `use-room-socket.ts:292-306`), which reads as a broken
button.

- Status: `useConnection()` (`presentation/connection/connection-provider.tsx`)
  gives the settled status (`useSettledStatus` holds a blink of 1 s, so a
  Wi-Fi hiccup does not flash the screen).
- The console already disables by hand (`isLive`, `host-console-page.tsx:241`,
  ~140 sites). The **player page disables nothing** (`player-page.tsx:267-281`).
- Decided: `inert` on the round/stage container inside `Main` (never `Main`
  itself, never the AppMenu) when status is not `open`, plus a visible cue —
  the stage dimmed under `[inert]` and one short "Reconnecting…" line (the
  existing `connection.*` strings, `dictionary-en.ts:426-430`). `inert` also
  catches tiles, sliders, fields and reorder lists a Button-only context would
  miss. `focusFirstControlInMain` already skips `[inert]` (`main.tsx:49`).
- Stay usable offline: the AppMenu (language, theme, volume, fullscreen,
  install, the plain-navigation exits), `ConnectionRefused`'s retry, audio
  unlock.
- Apply the same seam to the console's stage, then delete the hand-passed
  `isLive` props it makes redundant — only those whose control sits inside the
  inert container.
- Verify by cutting the dev server's socket (stop `wrangler dev`) with a player
  page open: stage dims after ~1 s, nothing pressable, menu still opens; restart
  and everything comes back.

## Done when

Each of the four is seen in a muted browser, `pnpm validate` is green, the
changelog says what players will notice, and this file is deleted.
