# Taverla and Gamenight, piece by piece

Measured on 17/10/2026: Taverla at `6c4d06f` (33 stages, five games, deployed),
Gamenight at `dc86674` (a scaffold: room, host console, big screen, world map;
player phones, teams, modes and the board planned in its
`docs/plans/next-steps/`, not built).

Most verdicts go Taverla's way because most of Gamenight's pieces are a plan
where Taverla's are shipped and tested. Where Gamenight is ahead, it is ahead
for real: the world map, team play, and the shape of a whole evening.

| Piece | Taverla | Gamenight | Verdict | Why |
|---|---|---|---|---|
| Room / session | 4-character code, room opened before the game (`settings.game` nullable), host token, three nested exits, closed 10 min after the last socket | Room code + host code, roles `screen` / `host`, erased 48 h after its last change | **Keep Taverla's** | Built and proven by `second-console.test.ts` and the takeover rules. Gamenight's longer life is the one thing worth weighing: see open decision 9 |
| Join / seats | Client-minted session id per room and role, a seat that survives a screen lock, remembered nickname, mid-round join stamp, `host.removePlayer` | Planned: hashed player tokens over REST, rejoin by pseudo on a new phone | **Keep Taverla's** | Shipped, and it already does what Gamenight's step 1 plans. Rejoin-by-pseudo stays an idea (decision 12) |
| Surfaces | Host console (a display or a phone) + the **wall**, a paired third role with no answer and no control | Big touch screen + host console on a phone | **Keep Taverla's, merge one thing** | The wall *is* Gamenight's big screen. What Gamenight adds: the big screen takes answers by touch. That becomes the wall answering for the team on turn (step c) |
| Protocol | Role-scoped unions, `encodeChecked` strips leaks, five guarantees, `PROTOCOL_VERSION` | One snapshot for every role, commands checked by `command-roles.ts`; per-role views planned | **Keep Taverla's** | The anti-cheat is the product's spine and Gamenight would have had to build it |
| Durable Object / state | One DO per room, hibernating sockets, the whole room as one stored snapshot, one alarm aimed by `roomDeadlines`; the same engine on Node for the socket suites | One DO per room on SQLite with schema migrations, a Node SQL double for tests | **Keep Taverla's** | A room is one snapshot; tables and migrations buy nothing for it. Taverla's Node engine is what lets the socket suites run a real server |
| Round engine | Countdown, buzz, lockout, simultaneous rounds (choice / typed), server-stamped arrival, round roster stamp, auto-advance, reveal hold | One question picked by the host, a touch on the screen, the host resolves; turns and modes planned | **Merge** — Taverla's engine, Gamenight's *turn* | A team turn is a Taverla round whose roster is one team's seats; a set is one round per team. The roster stamp already refuses everyone else (step c) |
| Scoring | Per seat, `POINT` of 1 000 with a speed bonus capped at the answer, verdicts by shape | Per team, host-confirmed awards, `score.adjust`; a replaceable `ScoringStrategy` for the board planned | **Merge** | Games keep scoring players; the shell sums per team (Gamenight's idea, Adrien's proposal). The board is a pure strategy over team results (Gamenight's). `score.adjust` has no Taverla equivalent and is taken |
| Game / activity seam | `settings.game` and `round.content` discriminated on `kind`; no registry, on purpose; the **server** holds the banks and judges | An `Activity` plug-in registry in the web app; the room knows no game; the **host console** judges with the bank in the browser | **Keep Taverla's, take a descriptor** | Two reasons. A bank in the web bundle ships every answer to every phone once phones answer. And judging on the console needs the host's phone awake and attentive, which an evening paced between dishes cannot promise. What is worth taking is a per-game capability table (teams? turns? the wall answering?) — a `switch` in core like `answerModesFor`, not a registry; with six games the third case is long past |
| Map engine | None | Natural Earth 1:50m (`world-atlas`), Equal Earth (`d3-geo`), atlas ids to ISO alpha-3, French names with and without article, a hit test in map units with a 24 px tolerance, country marks; tested | **Take Gamenight's** | All of it moves, into `@taverla/core/map/` and the app. One change of nature: judging becomes geographic (a longitude and latitude, a distance in km) and runs on the server ([d](d-map-engine.md)); the map-unit hit test stays as the client's *which country is under the marker* |
| Design system | Stage 29's game box: matte board, die-cut pieces, paper cards, eight pawns, `DESIGN.md`, contrast pairs tested, no-scroll at sixteen viewports | Structural markup on placeholder tokens; three gitignored board mock-ups (box, goose game, chalet), all with the round in the middle and a 40-case track around it | **Keep Taverla's, take the board layout** | Both projects landed on a game box independently, and Taverla's is built. Taverla even built the track around the console (`b4d509e`) and removed it (`ca612c2`) because it cost a wide screen 120 px a side and said nothing the standings did not. With teams and a board scoring mode, the track *is* the score, so the argument flips (step f) |
| i18n | `@adrienlcp/i18n`, French and English, `/fr` and `/en` prerendered | `@adrienlcp/i18n`, French only, country names in a dictionary | **Keep Taverla's, take the country names** | English names are owed (decision 7) |
| Tests | Socket suites on a real server, three Playwright journeys, the sixteen-viewport no-scroll spec, coverage, spell, Lighthouse | Reducer and admission unit tests, hit-test and marks tests, stylesheet audits, token contrast, share-and-crawl | **Keep Taverla's, take the map tests** | Taverla already holds the contrast test and its prerender covers the crawl files. The hit-test and marks suites come with the map |
| Deploy / legal / SEO | One Worker, `taverla.adrienlcp.com`, `/:locale/legal` | One Worker, `gamenight.adrienlcp.com`, `/legal` | **Keep Taverla's** | `gamenight.adrienlcp.com` redirects to Taverla once the map ships ([h](h-later.md)) |

## Two surprises worth keeping

- **The ring track already exists in git.** Stage 29 drew a 50-square score
  track around every console edge, with pawns standing on `score % squares`,
  and removed it a day later. The board starts from that code, not from
  Gamenight's mock-ups.
- **A game can already change between rounds.** `reshapesRound` refuses
  `game.kind` only while `isRoundInPlay`, and `revealed` is outside that
  window, so a line-up of several games needs a draw on the console, not a new
  engine. Seat scores survive the switch untouched — step b's socket test
  `[line-up] carries every seat’s score across a change of game` says so.
