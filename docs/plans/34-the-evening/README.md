# Stage 34 — the evening: folding Gamenight into the shelf

**Read one file.** This index is enough to choose; open only the file you need.
A step that lands keeps its row here, dated, and loses its file. Every choice
still open is in [`open-decisions.md`](open-decisions.md): read it before
starting a step that names one, and delete a line once Adrien settles it.

**Why this stage exists (17/10/2026).** Gamenight (`github.com/AdrienLcp/gamenight`)
was started for one evening — a company Christmas raclette, about twelve people
in teams, a 55–86" touch display — and planned player phones, team draws,
rounds played in turn and a board track, all things Melee either has already
or lacks entirely. Melee is the base; Gamenight contributes its world map and
the shape of a team evening. Gamenight's Worker and repository were deleted on
21/10/2026, once the map had landed here.

**The December cut.** Teams, the setup and sharing, the line-up, team turns, the world map with a
movable marker, the board, checked on 16:9 and 9:16 touch displays. Step h
follows straight on: nothing in this plan waits for a test or a rehearsal,
which Adrien runs on the finished state.

## Reference

| File | What it holds |
|---|---|
| [comparison.md](comparison.md) | Both codebases piece by piece — keep Melee's, take Gamenight's or merge — and why |
| [product-model.md](product-model.md) | The target: one room, a line-up of games, Teams and Board as two switches, host-paced from a phone or a laptop |
| [open-decisions.md](open-decisions.md) | Every choice left to Adrien, each with the working assumption the steps are written against |

## Steps

Steps a → e are in order: each reads the protocol the previous one adds. s runs once a and b have
added their settings, f beside d and e once their screens exist, i after f; g is last
before December.

| # | Step | In one line | State |
|---|---|---|---|
| 0 | Taverla becomes Melee | Scopes, storage keys, the `melee` Worker on `melee.adrienlcp.com`, SEO, copy | done 17/10/2026 — `a6169a6` |
| a | Teams in the shell | Seats drawn or chosen into teams, every game scored per team as the sum over the seats a round opened on (a team answering as one paid once); pawns in the team's colour on every screen, trays in the lobby, the standings and the final board; the wire in `docs/realtime-protocol.md` (*Teams are the shell's*) | done 17/10/2026 — `f7ff3af` (server), the app's screens after it |
| b | The line-up | `settings.lineUp` with `game` always among it; *Several games* turns the lobby's shelf into ticks, one game stays one press; the console draws the next game as each reveal goes up (`nextGame`, never twice running) and offers the others beside *Next round*; an evening keeps its own length and hold across games; `player.ready` on every phone, its pawns beside the next game's lid on the wall; *Christmas party* on the home shelf opens quiz, blind test and buzzer in three drawn teams over twelve rounds — the world map joins it at d; `game-capabilities` holds what c and d will ask of a game; the wire in `docs/realtime-protocol.md` (*An evening is a line-up*) | done 17/10/2026 — `baf2287` (server), the app's screens after it |
| s | The setup and sharing | The setup is a leaflet at every width — the inline fold made a 1440×900 console 1 739px tall — popover past the split, sheet below; three groups (*The evening*: game past the lobby, teams, round count; *The round*: the game's own; *The room*: hold, countdown, volume, seat), each closed on its summary, the evening opened first in the lobby and the round after it; the teams strip moved there off the lobby stage, ruled past the lobby; *Copy the link* and *Share* (`shareLink` from `@adrienlcp/browser` 0.6, only where a share sheet exists) under the square's address | done 17/10/2026 |
| c | Team turns | A set: each team plays its own round in turn while the others watch, and the team answers as one — the first answer from any of its seats or the wall is banked for all of them; `byTeam` on `host.startRound`/`host.nextRound`, `round.turn`, `wall.answer`, protocol 27; the console offers *Everyone at once* / *Team by team* where `canPlayByTeam` says so, a reveal with turns left offers only *Next team*, and `useLineUpDraw` waits for the set to end; the turn badge (the team's tray in miniature) in every header, the team's ring around the round card, the wall's tiles live on its turn, *Red play this one* on a phone watching; the wire in `docs/realtime-protocol.md` (*A set is rounds played in turn*) | done 17/10/2026 — `3ae47ce` (server), the screens after it |
| d | World map: engine and judging | A seventh game, `worldmap`, judged on the server: `player.answer { kind: 'point', point }` in a mode of its own (`point`, one shot a seat), measured against Natural Earth's 1:50m outlines read on the Worker (`infrastructure/map/world-atlas.ts`, the one module importing `world-atlas`, `topojson-client` and `d3-geo`); the distance is pure sphere arithmetic in `@melee/core/worldmap/distance` (nought inside, else to the nearest border — Lesotho is a hole in South Africa), a third verdict `{ kind: 'distance', distanceKm }` priced by `distance-tiers` (decision 6: 3 / 2 / 1 `POINT`s at 0, < 500, < 1 500 km, the clock capped by the tier); the country is public in `round.content`, the markers `null` until the reveal; a bank of 157 country codes with per-room no-repeat; protocol 28; not shelved yet, and the projection, the names and the drawing moved to e; the wire in `docs/realtime-protocol.md` (*The world map hides the markers*) | done 17/10/2026 — server |
| e | World map: the marker | The 1:50m atlas and its Equal Earth projection in the round's lazy chunk (`infrastructure/map/world-geometry`), country names for all 236 atlas codes in both locales; one SVG under a transform (`helpers/map-view`) and one pointer hook (`use-map-gestures`) for pinch, pan, a tap that places the pawn and a drag that moves it, on a phone, a mouse and the wall alike; *Je le pose ici* and *Annuler* perched over the pawn on every screen (`perchedOver`, decision 17/10); the reveal names and inks the country, frames it with every pawn and draws each pawn's dashed line labelled *1 331 km*; the wall's 9:16 map full width and low; then shelved — sixth on the shelf, in *Christmas party* (four games, sixteen rounds), the console's picker in rows of three or one of six | done 18/10/2026 |
| f | The board | `settings.board` (off, or a track of 20/30/40 cases) laid in the lobby beside the teams and locked past it; one replaceable strategy in `@melee/core/board` (`onePointOneCase`: whole `POINT`s of the round, floored, walk the pawn), run on the server so every screen draws the same `team.board { case, move }`; the evening ends on the reveal a pawn reaches the finish, after the set under way; standings rank by case, then score; the wall runs the track around the round (down both long sides and across the top when upright), the console corrects a move a case at a time through `host.adjustScore`, a phone's reveal carries seven cases around its pawn, and the final board stands the best three seats on a podium under the winning team; protocol 29, the wire in `docs/realtime-protocol.md` (*The board is the teams' score walked on a track*) | done 20/10/2026 — `6f3c63c` (server), the screens after it, `0175e28` |
| i | Challenges played off screen | A `challenge` game in the line-up — the host types it, the wall shows it, the host places the teams and the pawns walk — and points by hand from the menu in any phase, over the existing `host.adjustScore` | done 21/10 — the line typed beside every press that opens a round, the wall's card, a *— / 1er / 2e / 3e* strip per team or seat on the console, the phone's notice; shelved last, in the Christmas preset (assumed: 20 rounds, four of each). A placing is corrected from the menu's Points, the reveal has no strip of its own. Its spine is walnut, the table's wood, apart from the magenta and indigo it first sat between |
| g | Big touch screens | 4K 16:9 and 9:16 in the no-scroll spec, touch targets for a standing crowd | done 21/10/2026 — `a165fc8`, `dd61ab8`, `f7825f7`: past a short side of 1080px `html`'s font size grows with the screen (`apps/game/DESIGN.md`, *Hierarchy*), the wall itself in `e2e/choice-fits.spec.ts` from 720p to 4K either way up with a `[scale]` test, an upright tablet's wall lobby on one row; every `hover` rule is an enhancement on a control a tap reaches, and the idle-hidden wall menu wakes on the first touch |
| h | [Past December](h-later.md) | One dictionary per locale, board strategies, solo and duel, teams with no phone, French cities, the screen-only evening | in progress |
