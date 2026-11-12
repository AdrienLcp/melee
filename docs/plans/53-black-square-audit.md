# 53 — Black square: a simple theme, hard answers

Adrien's rule, from playing it: **the theme must be simple; the difficulty
comes from the answers, the high-paying ones being the hard ones.** _Les
lauréats du prix Nobel de chimie_ breaks it — the table cannot name even the
cheap cells — and _Les présidents des États-Unis_ breaks it the other way:
its nine most read are all easy, so the 3-point cells pay for nothing hard.

The bank is `apps/server/src/infrastructure/questions/black-square-bank.json`,
built by `apps/server/scripts/build-black-square-bank.ts` from
`black-square-themes.ts` / `black-square-templates.ts`. Today it keeps each
theme's nine most read truths (French Wikipedia, `PAGEVIEW_DAYS = 60` in
`frwiki-notability.ts`), and a round on `answerCount` deals the first
`answerCount` of them (`black-square-round.ts`); `tierOfCell` in
`packages/core/src/blacksquare/sheet-pay.ts` pays by third of that rank.

## Done beside the steps — one answer per franchise (07/11/2026)

From the 06/11 game night: a DreamWorks grid held four _Shrek_. **A theme
banks one answer per franchise**, and the franchise's own title over a
sequel more read than it (_Shrek_, not _Shrek 2_). The build gathers a
theme's truths before keeping nine, so the next films fill the freed cells:

- **a shared series or media franchise** (P179, P8345), read by
  `scripts/wikidata-series.ts` and stored on each answer as `series`;
- **a shared title stem** on works — `franchiseStemOf` in
  `packages/core/src/blacksquare/franchise-stem.ts` cuts a subtitle and a
  sequel's number, so _Shrek le troisième_ stems to `shrek`;
- **a whole title of at least eight letters inside another's**, on films and
  books — _Trainspotting_ in _T2 Trainspotting_, which no stem joins.

What did not hold, so nobody tries it again:

- **P155/P156 (follows, followed by) are not a sequel.** On a book or a film
  they are as often the author's bibliography: they put _1984_ and _Animal
  Farm_ in one franchise, three Coen films in another. Not read.
- **A series can be the subject's whole output.** Every Marvel Studios film is
  in the MCU, every Balzac in _La Comédie humaine_, every Disney feature in
  the studio's own list. `UMBRELLA_SERIES` in `black-square-themes.ts` names
  them, read off the series the banked truths share most; a new theme whose
  grid collapses to a handful is the sign one is missing.
- **The stem is for works only.** On countries _Corée du Nord_ and _Corée du
  Sud_ share two words; on albums the band's own name runs inside half its
  discography.

A work not released at build time is dropped (P577 in the future, or missing
on a film). Cut once each franchise counted once, their grids reaching
obscure titles: James Cameron, Peter Jackson, Marcel Pagnol, Illumination.
`black-square-bank.test.ts` holds the rule without the network: no two
answers of a theme share a `series`, and no two works share a stem.

## Done beside the steps — one answer per thing, hand-written themes (10/11/2026)

The same complaint on the hand-written bank: _Légumineuses_ held seven
_Haricots_ of seven colours. **One answer per thing**: a variety, a sub-kind
or a synonym of another answer is folded into it as aliases, so it still
lights that cell, and the pool is refilled with different things. 74 themes
were swept, by a shared-word scan and a read for varieties with names of
their own (_Mirabelle_ under _Prune_, _Typhon_ under _Ouragan_).

Where the line was drawn, so it is not argued again:

- **A theme listing dishes keeps its dishes**: _Tapas_ beside _Patatas
  bravas_, _Dim sum_ beside _Xiaolongbao_, _Curry_ beside _Korma_ — a dish is
  not a variety of a way of eating.
- **Beer styles stay apart** (_IPA_, _Pale ale_, _Stout_, _Porter_): a
  brewer names each; so do consoles (_PSP_ beside _PlayStation_).
- **Species stay apart when the table names them** — _Caméléon_, _Gecko_
  beside _Lézard_ — but _Serpent_ absorbs every snake in _Reptiles_, which
  held six beside it and has a _Serpents_ theme of its own.

`black-square-bank.test.ts` refuses two answers of an authored theme opening
on the same French word unless `FIRST_WORDS_SHARED_ON_PURPOSE` names it — the
word being the theme's own (_Sauce_, _Mer_) or a coincidence (_Corée_).

## What was measured (26/10/2026, 167 themes)

**Page views cannot judge a theme.** Sorted by each theme's third most read
answer — the floor of its cheap tier —, the specialist themes land _above_
the ones a table plays easily, because views compare a laureate with an album,
and a 60-day window read in October is Nobel season:

| Theme                                | 3rd answer         | views  |
| ------------------------------------ | ------------------ | ------ |
| Les albums des Beatles               | Sgt. Pepper's…     | 5 175  |
| Les lauréats du prix Turing          | Geoffrey Hinton    | 9 904  |
| Les lauréats du prix Nobel de chimie | Irène Joliot-Curie | 15 138 |
| Les lauréats de la médaille Fields   | Grigori Perelman   | 15 620 |

Inside one theme the ranking is mostly right but news-bent: Karl Deisseroth
heads _physiologie ou médecine_, Francis Halzen sits third in _physique_,
_The Phoenician Scheme_ second for Wes Anderson. So no threshold on views
decides which theme stays; a census does, and views only rank answers — over a
window long enough to flatten a news week.

## Step 1 — the census: cut the specialist themes — done 12/11/2026

The test, per theme: **would an ordinary table name three answers unaided?**
A theme that fails is deleted from `black-square-themes.ts`, not flagged — it
has no room it would suit.

Most of the cut had already landed with the pool (`4b620968`, 08/11), which
took the Wikidata bank from 163 themes to 61 without writing its verdicts
down: every science prize, every trade prize (Booker, Lion d'or, Ours d'or,
Golden Globe), Daft Punk, the five borderline ones (secrétaires généraux de
l'ONU, capitales d'Océanie, Peter Weir, Kurosawa, Annie Ernaux), and every
painter but Van Gogh and Léonard de Vinci. The census read the 61 left, each
on its banked answers rather than on its title.

**Cut (4)** — a table names one answer, or one franchise:

- _Les albums de Queen_ — a table knows the songs, not the albums;
- _Francis Ford Coppola_ — _Le Parrain_ (one franchise) and _Apocalypse Now_,
  then nothing a table has heard is his;
- _Wes Anderson_ — _The Grand Budapest Hotel_ alone;
- _Sam Raimi_ — _Spider-Man_ (one franchise), _Evil Dead_ to horror fans.

**Kept on a close call**: Guy Ritchie (_Snatch_, _Sherlock Holmes_,
_Aladdin_), the Coen brothers (_Fargo_, _The Big Lebowski_, _No Country for
Old Men_), Clint Eastwood, Tolkien (the _Silmarillion_ third), the Oscar
for best actress. Everything else passes plainly.

**The painters were judged on what the bank held, and two failed for want of
their own titles**: _La Cène_ is filed as a mural, _Les Tournesols_ and _La
Chambre à Arles_ as series of paintings, _La Vierge aux rochers_ as a group,
so the painting query banked none of them, and Léonard de Vinci's grid held
_La Joconde_ and nothing a table names. `paintings-by` now reads those kinds
for its truths (not its black-word candidates), and a truth that is itself
the series its siblings belong to joins them, so a version never stands
beside _Les Tournesols_. Both kept.

**Restored (2)**, the painters the plan's first pass said to keep, judged one
by one: **Monet** (_Impression, soleil levant_, _Les Nymphéas_, _Les
Coquelicots_ — black word Manet's _Olympia_) and **Vermeer** (_La Jeune Fille
à la perle_, _La Laitière_, _La Dentellière_ — black word _La Ronde de
nuit_). **Picasso stays out**: _Guernica_ and _Les Demoiselles d'Avignon_,
then no third title a table says unaided. A painting filed apart from its
series is joined by hand — `sameThing` on the theme spec: _Le Bassin aux
nymphéas, harmonie verte_ is in no Nymphéas series on Wikidata.

The bank is 59 Wikidata themes; the floor in `black-square-bank.test.ts` is
55. Views did not move on the rebuild — the build reads them from its cache —
so every theme not named above banks the same nine.

## Step 2 — rank on a year, not on sixty days (one session)

`pvipdays` stops at 60. The yearly figure comes from the Wikimedia REST
per-article endpoint (`metrics/pageviews/per-article/fr.wikipedia/all-access/
user/<title>/monthly/<from>/<to>`), one request per candidate, cached in
`scripts/.cache` like the rest. Sum the last twelve full months. Check the
three news-bent themes above reorder as a table would expect, then rebuild.
The sixty-day figures sit in `VIEWS_CACHE` (`frwiki-notability.ts`), keyed by
entity alone with no window, which is why step 1's rebuild kept October's
numbers: the yearly sum takes a cache of its own.

— cut here: specialist themes gone, ranking on a year, bank rebuilt and
tests green —

## Step 3 — the 3-point cells must be hard (one session)

Keeping the nine most read leaves an easy theme with no hard cell. Keep a
**spread** instead: from the theme's truths ranked by views, the cheap third
from the top, the dear third from further down the list — still answers a fan
names, so floored on rank within the candidates that clear
`LEAST_CANDIDATE_SITELINKS`, never on raw views (step 1's lesson).

The deal has to follow: `slice(0, answerCount)` on a spread nine gives a
three-answer round the three easy ones. Store the tier with each answer and
deal `answerCount` evenly across the tiers, so `tierOfCell` still reads a
third of the dealt cells. Decide in the session whether the bank keeps nine
or more per theme, with the dealt subset drawn per round.

Verify on the wall and a player screen, muted, on a theme from each end
(presidents, a director): the 1-point cells found in seconds, the 3-point ones
by somebody at the table, not by nobody.
