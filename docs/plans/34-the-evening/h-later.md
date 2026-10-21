# h — Past December

Taken in this order, one session each, straight after g: nothing here waits
for a test or a rehearsal. Each step is written against a working assumption
in [`open-decisions.md`](open-decisions.md) (19 → 23) so it can land whole; a
step that lands keeps its line here, dated, and loses its details.

1. **One dictionary per locale** — done 21/10/2026: French is a chunk of its
   own (`fr: () => import('./dictionary-fr')` in `presentation/i18n/i18n.ts`),
   awaited before the first render, by the prerender and by a switch of
   language. `/en` stops downloading 15.95 kB gzipped of French, and the
   script budget in `lighthouserc.json` goes back from 275 000 to 260 000.
   English stays in the entry: the library's reference locale is never a
   loader. The country names stay in the dictionaries — 4 kB gzipped a
   locale, not worth a suspense boundary under every map screen.

2. **Board strategies** — done 21/10/2026: `rank` beside `onePointOneCase`
   (the wire name kept, so no stored track is lost), and `catchUp` on the
   track rather than a strategy, applied in `advanceOnTrack`. In a set, a
   turn ranks the team on it alone, since the waiting teams were paid nothing:
   ranking over the whole set would hold every move until the last turn.

3. **Solo and duel** — done 21/10/2026: `playStyle` (`together`, `byTeam`,
   `solo`, `duel`) replaces `byTeam` on the host's start and next, protocol 32,
   and `round.turn` names `teamIds` and `seatIds`. Both are roster rules on the
   round's stamp, drawn in `core/team/turn-seats.ts`; a duel is a set of one,
   and the wall answers in `byTeam` alone, since in solo or a duel the answer
   is a seat's. The console offers the four under *Comment jouer*, two by two,
   with what the chosen one does written under it.

4. **Teams with no phone at all** (decision 21). A room setting, *Answers
   aloud*: no seat needed, teams are named on the console, the wall shows the
   question, and every round is judged on the console by tapping the team or
   teams that had it, through `host.judge` with a team verdict. The world map
   is greyed in the line-up under it — a pawn needs a screen.

5. **French cities** (decision 22). A second `worldmap` question kind,
   *Place-moi Rennes*: metropolitan France from the same atlas, a conic
   conformal projection in the same `d3-geo` pipeline, a bank of prefectures
   and large cities with their coordinates, distance to the city itself
   priced by tighter tiers. Chosen in the round's settings like a blind-test
   source.

6. **The screen-only evening** (decision 23). No host phone: the host console
   runs on the touch display itself, in a layout that is the wall's with the
   host's presses in a drawer. Its shape is the first thing the step settles.
