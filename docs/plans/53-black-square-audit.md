# 53 — Black square: a simple theme, hard answers

Adrien's rule, from playing it: **the theme must be simple; the difficulty
comes from the answers, the high-paying ones being the hard ones.** _Les
lauréats du prix Nobel de chimie_ breaks it — the table cannot name even the
cheap cells — and _Les présidents des États-Unis_ breaks it the other way:
its nine most read are all easy, so the 3-point cells pay for nothing hard.

The bank is `apps/server/src/infrastructure/questions/black-square-bank.json`,
built by `apps/server/scripts/build-black-square-bank.ts` from
`black-square-themes.ts` / `black-square-templates.ts`. It pools each
theme's truths down to the depth a table still names (step 3), ranked on a
typical year of French Wikipedia (step 2: `frwiki-yearly-views.ts`), each
answer stored with its tier; a round deals `answerCount` of them by tier
(`dealBlackSquareAnswers`) and `pointsForCells` in
`packages/core/src/blacksquare/sheet-pay.ts` pays a rare cell three times an
obvious one.

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

## Step 2 — rank on a year, not on sixty days — done 12/11/2026

`frwiki-yearly-views.ts` reads each truth's twelve whole months from the
Wikimedia REST per-article endpoint, one request per article (2 629 for the
59 themes, about twenty minutes), cached in `scripts/.cache` under the
window's own name (`frwiki-monthly-views-<from>-<until>.json`), so a rebuild
next month reads a new year and a second build this month asks nothing.
Only the truths are measured: every theme pins its black word, so a
candidate's views only order the build's review line, which keeps the
sixty-day figure.

**A year's sum still bent; the median month does not.** The first pass
summed the twelve months and put a spike back on top: a series about James
Garfield made him sixth of the American presidents, the Netflix _Seven
Dials_ put it first of Agatha Christie, a death put _Les Oiseaux_ over
_Psychose_, a TV _Mr. Mercedes_ and two new Stephen King titles pushed out
_Shining_ and _Carrie_. The figure is
now the **median month × 12** — five months of news are ignored, a work
read for half the year still counts, and a month the endpoint leaves out
counts as zero, so an article written mid-year ranks low.

What moved, against the sixty-day bank (all 59 themes reordered, 42 changed
at least one of their nine):

- _Hitchcock_: _Psychose_, _Sueurs froides_, _Les Oiseaux_ on top; _La
  Corde_ and _L'Homme qui en savait trop_ out.
- _Ridley Scott_: _Gladiator_, _Blade Runner_, _Alien_ — the sixty days had
  _The Dog Stars_ and _Black Rain_ first.
- _Présidents des États-Unis_: Eisenhower and Biden stay, Garfield never
  arrives.
- _Oscar du meilleur film_: _La Liste de Schindler_, _Oppenheimer_ and
  _Forrest Gump_ in, for three winners a table names later.
- Still news-led where the news _is_ the year: Marvel opens on _Spider-Man:
  Brand New Day_, Spielberg on _Disclosure Day_, Pixar holds _Hoppers_. A
  release read for six months is what a table has heard of; step 3's spread
  is what keeps such a cell cheap or dear.

The three news-bent themes this step was to check (Nobel, physics, Wes
Anderson) were cut by step 1; the ones above are the check.

**The REST endpoint is rate-limited per client**: ten requests a minute for
an anonymous User-Agent, two hundred for one naming a contact (the shared
`USER_AGENT`). A 429 is waited out (`retry-after`, else a minute) rather
than counted as a failure. The endpoint clips its last monthly bucket to
the end stamp, so the request runs to the first of the current month and
drops that partial bucket — a first pass ending on the first of the last
month read eleven months and a day.

— cut here: specialist themes gone, ranking on a year, bank rebuilt and
tests green —

## Step 3 — the 3-point cells must be hard — done 12/11/2026

**A theme pools every answer a table still names, nine to twenty-four,
tiered by thirds of that depth** (`spreadAnswers` in
`apps/server/scripts/answer-spread.ts`). The depth runs down the ranked
list while an answer's views reach **a quarter of the median of the nine
best known** (`DEPTH_SHARE`), among answers clearing `LEAST_SITELINKS` (5,
the black word's floor, now the truths' too). The tier is stored on each
answer in the bank, the shape a hand-written theme and an evening's own deck
(plan 68) already had, and the deal did not change: since `4b620968` a round
deals by tier (`dealBlackSquareAnswers`, a quarter obvious, a quarter rare),
so a pool of any depth deals its rare cells from its rare third. 57 themes,
920 answers instead of 531; a theme's own tier (medium or hard) is still read
on its nine best known.

What the 3-point cells were, and are:

| Theme                | Rare third of the nine                                       | Rare third of the pool                                                                                             |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Présidents des É.-U. | George W. Bush, Eisenhower, Biden                            | T. Roosevelt, L. B. Johnson, Jefferson, Ford, Garfield, Grant, Wilson                                              |
| Spielberg            | Les Dents de la mer, A.I., Les Aventuriers de l'arche perdue | Rencontres du troisième type, Munich, The Fabelmans, Tintin, Pentagon Papers, La Couleur pourpre, Empire du soleil |
| Ballon d'or          | Harry Kane, Ronaldo, Platini                                 | Weah, Modrić, Cruijff, Kaká                                                                                        |
| Union européenne     | Malte, Irlande, Pologne                                      | Hongrie … Slovaquie, Lettonie, Lituanie                                                                            |

Why this rule and not the plan's first wording, so it is not argued again:

- **A rank floor cannot be one fraction.** The depth a table reaches, as a
  share of the answers clearing the sitelinks floor, runs from 0.15 (Agatha
  Christie, 95 titles nobody reads past fifteen) to 0.65 (Spielberg). Views
  _relative to the theme's own nine_ adapt; they never compare two themes,
  which is all step 1 forbade.
- **The median of the nine, not the third answer.** Floored on the third
  most read, the Ballon d'or and the Champions League stopped at nine —
  Ronaldo's two million views put Kane and Platini in the rare third again.
- **Past twenty-four the list is cut, not sampled.** Sampling an evenly
  spaced 18 of 52 actresses dropped Jodie Foster and Meryl Streep from the
  pool; the twenty-fourth best-known American state or Oscar-winning actor
  is already one a table finds last.

The deeper pools surfaced what the nine hid, fixed in the build:

- **Characters are filtered to characters** (`FICTIONAL_CHARACTER`, a
  subclass of Q95074): P1441 also lists a work's places, languages and
  peoples — _maison Stark_, _langues valyriennes_, _Mordor_, _Gondor_,
  _Orque_. It costs _Nazgûl_, a group of characters; allowing groups let
  _Orque_ and _Rohirrim_ back in.
- **Best actress is `award-winning-people`**: two films hold the award on
  Wikidata (_Le Silence des agneaux_, _Vol au-dessus d'un nid de coucou_).
- **An alias that normalises to nothing is dropped** — Greece's 🇬🇷 entered
  the EU pool and graded as no cell.

**Cut (2)**: _Alexandre Dumas_ and _Tolkien_ (step 1's close call). Past
three or four titles their rare third is _La Tour de Nesle_, _Antony_,
_Kean_ and _L'Album de Bilbo le Hobbit_, _Ainulindalë_, _Roverandom_ —
whatever the rule, since the nine already ended on _Pauline_ and _Le Livre
des contes perdus_. The bank floor in the test stays 55.

**Known gap — an article renamed during the year loses its old months.**
The per-article endpoint does not follow a redirect, so _Frodo Bessac_ (the
new translation's name since October 2026) reads two hundred a month and
Frodo and Sam are out of _Les personnages du Seigneur des anneaux_. Summing
a renamed article's old titles needs its redirects, one more request per
title; not done.

No screen changed: a cell's pay and pips read the dealt tiers as before.
