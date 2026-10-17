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
the shape of a team evening. When every step below has landed, the Gamenight
repository is archived.

**The December cut.** Teams, the setup and sharing, the line-up, team turns, the world map with a
movable marker, the board, checked on 16:9 and 9:16 touch displays and
rehearsed on site. Everything marked *later* waits for that rehearsal.

## Reference

| File | What it holds |
|---|---|
| [comparison.md](comparison.md) | Both codebases piece by piece — keep Melee's, take Gamenight's or merge — and why |
| [product-model.md](product-model.md) | The target: one room, a line-up of games, Teams and Board as two switches, host-paced from a phone or a laptop |
| [open-decisions.md](open-decisions.md) | Every choice left to Adrien, each with the working assumption the steps are written against |

## Steps

Steps a → e are in order: each reads the protocol the previous one adds. s runs once a and b have
added their settings, f beside d and e once their screens exist; g is last
before December.

| # | Step | In one line | State |
|---|---|---|---|
| 0 | Taverla becomes Melee | Scopes, storage keys, the `melee` Worker on `melee.adrienlcp.com`, the old domain redirected by `apps/server/former-host`, SEO, copy | done 17/10/2026 — `a6169a6` |
| a | [Teams in the shell](a-teams.md) | Seats drawn into teams; every game's round results aggregated per team; *teams only* is a seat named after a team | protocol, core, server done 17/10/2026 — the app's screens to do — MVP |
| b | [The line-up](b-line-up.md) | The host ticks the games of the evening (presets, one tick = today's quick game); the next game is drawn or picked between rounds; players' *ready* on the wall | to do — MVP |
| s | [The setup and sharing](s-setup-and-sharing.md) | The setup's leaflet grouped in disclosures; copy the link and the native share beside the square | to do — MVP |
| c | [Team turns](c-team-turns.md) | A set: each team plays its own round in turn, the others watch; the wall answers for the team on turn | to do — MVP |
| d | [World map: engine and judging](d-map-engine.md) | Gamenight's atlas, projection and names in `@melee/core`; a seventh game judged on the server from a geographic point | to do — MVP |
| e | [World map: the marker](e-map-marker.md) | Pinch, pan, a movable marker, confirm — on a phone and on the touch wall; the reveal says *à 480 km* | to do — MVP |
| f | [The board](f-board.md) | Pawns on a track around the round on the wall, from the ring stage 29 built and removed; one replaceable scoring strategy | to do — MVP |
| g | [Big touch screens and rehearsal](g-touch-screens-and-rehearsal.md) | 4K 16:9 and 9:16 in the no-scroll spec, touch targets for a standing crowd, then the venue | to do — before December |
| h | [Later](h-later.md) | French cities, more modes, catch-up, archiving Gamenight | later |
