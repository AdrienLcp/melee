# Open decisions

Every choice this stage leaves to Adrien. Each has a **working assumption**
the steps are written against, so work can start; settling one means updating
the step it names and deleting its line here.

| # | Decision | Working assumption | Step |
|---|---|---|---|
| 2 | A team's round result | The **mean** of its members' results over the seats the round stamped; alternative: the sum, which pays bigger teams | a |
| 3 | What *1 point = 1 case* means on a board counted in `POINT`s of 1 000 with a speed bonus | Cases = the team's round result in whole `POINT`s, floored: speed breaks ties on the standings and moves no pawn by itself; alternative: cases by the round's team rank | f |
| 4 | Who answers for a team on turn | The first submission from any member's phone or from the wall counts; alternative: a designated seat per set | c |
| 5 | The next game: drawn or picked by default | Drawn from the line-up, never the same game twice in a row when there is another, with *change* beside it; alternative: the host picks, *draw* beside it | b |
| 6 | Map scoring and bank size | Tiers 0 km → 3 `POINT`s, under 500 km → 2, under 1 500 km → 1, beyond → 0, plus the capped speed bonus in a simultaneous round; 150 countries in French and English | d |
| 7 | English country names | A dictionary like the French one, because the French prompt needs an article form no API gives; alternative for English alone: `Intl.DisplayNames` over an alpha-3 → alpha-2 table | d |
| 8 | Re-drawing teams after the start | Lobby only; afterwards the host moves single seats, and with teams chosen by the players a seat changes its own team in the lobby alone | a |
| 9 | How long a room outlives its last screen | Ten minutes, as today, since the wall stays connected through dinner; alternative: longer when the line-up holds more than one game — the legal page states the duration and must follow | g |
| 10 | A late seat's team | Drawn teams: the team with the fewest connected seats, ties to the lowest id; alternative: the host places them. Chosen teams: the seat picks, as in the lobby | a |
| 11 | A seat's pawn colour with Teams on | Takes its team's colour everywhere; the eight pawn colours become the teams' (2–6 teams fit) | a |
| 12 | Rejoin by pseudo on a new phone | Not built: a seat comes back by its session id, as today; Gamenight's idea (take over a disconnected seat by typing its name) waits for a real case | — |
| 13 | *Ready* between rounds | An indicator on the wall, never a gate | b |
| 14 | Presets for December | *Soirée de Noël*: quiz, blind test, world map, buzzer; Teams drawn; Board on | b |
| 15 | Board default | On whenever Teams is on; off otherwise | f |
| 17 | A round that pays a team less than a whole `POINT` | Floored to nought cases, so in teams of two or more a right buzz (1/n `POINT`) or a quiz half the team got right moves no pawn — four of Christmas's sixteen rounds are buzzer; recommended alternative: the pawn stands on the team's whole score in `POINT`s, floored, so fractions bank across rounds and case and score rank alike | f |
| 18 | Track length and the end | 30 cases for Christmas (twelve people, sixteen rounds, one or two cases a round); the evening ends on the reveal a pawn reaches the finish, after the set under way; the track is locked past the lobby | f |
| 19 | Board strategies | `points` (today) or `rank` (3/2/1 cases by the round's team ranking, ties share the better place), plus a `catchUp` switch giving a team alone at the back one case more on a round it scores; alternatives: a track sized to the evening, case values scaled to the planned rounds with a final race | h2 |
| 20 | Solo and duel | Solo: one seat answers for its team, rotating set after set; duel: two seats of two teams head to head, every seat duelling before anyone twice | h3 |
| 21 | Teams with no phone | *Aloud*, a fifth kind of teams: named on the console, no seat, every round played together and judged there by tapping the team(s) that had it; the map, the reflex race and the slate unavailable under it | h4 |
| 22 | French cities | Prefectures and large cities of metropolitan France; tiers to the city itself: under 25 km 3 `POINT`s, under 75 km 2, under 150 km 1 | h5 |


Settled 17/10/2026, and moved into the steps: the name is **Melee** (done, `a6169a6`); teams can be drawn **or chosen by the players** (step a, done); the host drives from a phone or a laptop, the wall is the big screen ([product model](product-model.md)); the setup's leaflet and sharing (s, done); a podium closes the evening, with no booby prize (f, done). Settled 20/10/2026: a challenge played off screen pays its placings 3, 2 and 1 `POINT`s (i).
