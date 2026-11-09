# 62 — Difficulty

**Done** 08/11/2026, in five sessions.

The country rubrics felt hard every evening, and they were: the flag bank is two
thirds obscure (152 of 229 rows), and a draw uniform over it dealt mostly
obscure flags. Adrien asked for everything, easy included, a level a table with
children can pick, and one switch that sets every game at once while each game
keeps its own.

Every game whose server deals content now takes a level — the blind test, the
quiz, the map, the timeline, black square, Petit Bac, _Le juste chiffre_ and
_Plus ou moins_ — set on its page, and the whole line-up's from one strip.

## Decided in part 1

- **One vocabulary, `easy | mixed | hard`, default `mixed`**, on each game arm
  that deals content and never on the room. Not "normal": beside "mixed" nobody
  tells them apart. The words are shared and the meaning is each bank's.
- **`mixed` is a third a tier.** `dealByDifficulty` draws a tier first, then an
  item inside it, however lopsided the bank; `easy` deals the easy tier alone,
  `hard` never deals it, and an empty tier falls through to the nearest rather
  than stall.
- **A level never changes the pay.** Every round still pays at most
  `MOST_A_ROUND_PAYS`: the question gets easier, never the payout, so a score
  means the same from one evening to the next.
- **The evening's level is derived, not stored.** The strip writes one level
  into every entry of the line-up and reads one back only while they agree; a
  room value beside the games' would need a precedence rule no host can see.
- **Look-alike decoys stay** at `mixed` and `hard`. Only `easy` may soften the
  shape of a question.
- **The quiz's `wellKnownOnly` switch is gone** (stage
  [21](21-well-known-questions.md) added it because the French bank cut in thirds
  left _difficile_ nearly empty; stage [22](22-thin-french-subjects.md) filled
  those subjects). A stored setup reads it as `easy`. The blind test's popularity
  floors took the shared names and open on `easy`, the charts a fresh room always
  heard.

## What each part bought

1. **The setting** (`b3317e19`): the protocol field on every arm, the deal
   through `dealByDifficulty`, stand-in tiers until the banks carried their own.
2. **The picker** (`3b41f513`): the level on each game's page in the shell's
   words, and the evening-wide strip under the planned games. A row names its
   level only while the games differ.
3. **The countries** (`a8270d4f`): every country bank carries a tier its build
   script writes. A flag is easy when it is on the hand-picked list a table has
   seen, a neighbour of France or in the G20; French Wikipedia traffic only
   splits the rest, because traffic follows the news. A capital is cut by its own
   traffic and held within one tier of its country's. At `easy` the decoys come
   from three other continents and the map names a place among forty rivals
   rather than eight. The quiz's `mixed` draws its **subject first**, since a tier
   drawn first sent a third of the evening to the four tiered subjects. The
   capitals finding is in `docs/game-catalogue.md`: the repeats a table felt were
   the stand-in's halves, which dealt each obscure capital four times as often as
   a famous one, not the draw.
4. **The numbers** (`0e1662e9`): the quantity bank measures French towns,
   regions and departments, and `easy` pairs hold a French side inside a wider
   band. The reading is in [58](58-estimate.md), _France, added with the level_.
5. **The other games** (`214f37e9`, `34bca5f8`, `ffb41d1b`, `982e52fb`):
   - **The timeline** leaves `mixed` and `hard` alone — close dates are the
     game — and at `easy` deals events a child knows (`knownToChildren`, 69 of
     218 rows) at least thirty years apart, falling back on any events that far
     apart, then on the usual five.
   - **Petit Bac** tiers its categories, not its letters: the host's letter
     picker already owns the rare ones. A host's own list is played as written
     and counts for no level in the strip.
   - **Black square** took its level with its theme pools (`4b620968`): the hand
     written broad themes are easy, the Wikidata ones medium or hard by traffic.
   - **Shades, Matchsticks** and the games with nothing to deal take none; the
     catalogue's _Which games take a level_ says why, and what makes a new game
     take one.

## Turned down

- **A room-wide level** beside the games': two values for one thing, and a
  precedence rule to explain.
- **A level on Shades**: its one knob, how long the colour stays up, is already
  a setting, and the pay curve must not move with a level.
- **Sitelinks as a tier for places**: bot-made stubs make them useless;
  `frwiki-notability.ts` records why.
