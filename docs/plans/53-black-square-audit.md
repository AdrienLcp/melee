# 53 — Black square: a simple theme, hard answers

Adrien's rule, from playing it: **the theme must be simple; the difficulty
comes from the answers, the high-paying ones being the hard ones.** *Les
lauréats du prix Nobel de chimie* breaks it — the table cannot name even the
cheap cells — and *Les présidents des États-Unis* breaks it the other way:
its nine most read are all easy, so the 3-point cells pay for nothing hard.

The bank is `apps/server/src/infrastructure/questions/black-square-bank.json`,
built by `apps/server/scripts/build-black-square-bank.ts` from
`black-square-themes.ts` / `black-square-templates.ts`. Today it keeps each
theme's nine most read truths (French Wikipedia, `PAGEVIEW_DAYS = 60` in
`frwiki-notability.ts`), and a round on `answerCount` deals the first
`answerCount` of them (`black-square-round.ts`); `tierOfCell` in
`packages/core/src/blacksquare/sheet-pay.ts` pays by third of that rank.

## What was measured (26/10/2026, 167 themes)

**Page views cannot judge a theme.** Sorted by each theme's third most read
answer — the floor of its cheap tier —, the specialist themes land *above*
the ones a table plays easily, because views compare a laureate with an album,
and a 60-day window read in October is Nobel season:

| Theme | 3rd answer | views |
|---|---|---|
| Les albums des Beatles | Sgt. Pepper's… | 5 175 |
| Les lauréats du prix Turing | Geoffrey Hinton | 9 904 |
| Les lauréats du prix Nobel de chimie | Irène Joliot-Curie | 15 138 |
| Les lauréats de la médaille Fields | Grigori Perelman | 15 620 |

Inside one theme the ranking is mostly right but news-bent: Karl Deisseroth
heads *physiologie ou médecine*, Francis Halzen sits third in *physique*,
*The Phoenician Scheme* second for Wes Anderson. So no threshold on views
decides which theme stays; a census does, and views only rank answers — over a
window long enough to flatten a news week.

## Step 1 — the census: cut the specialist themes (one session)

The test, per theme: **would an ordinary table name three answers unaided?**
A theme that fails is deleted from `black-square-themes.ts` (and its template
instance excluded), not flagged — it has no room it would suit.

Read on the whole list, not from memory; the first pass flags, to confirm:

- the science prizes — Nobel de chimie, de physique, de physiologie ou
  médecine, d'économie; prix Turing; médaille Fields;
- the prizes nobody outside the trade follows — prix Booker, Lion d'or, Ours
  d'or, Golden Globe du meilleur film dramatique;
- painters whose *titles* the table does not know though it knows the painter
  — Turner, Hopper, Raphaël, Vélasquez, Brueghel, Rembrandt, Renoir, Matisse,
  Manet, Dalí; keep the ones with three household titles (Van Gogh, Monet,
  Léonard de Vinci, Picasso, Vermeer) — judged one by one;
- discographies past the hits — Queen, Daft Punk;
- the borderline, decided in the session: secrétaires généraux de l'ONU,
  capitales d'Océanie, Peter Weir, Akira Kurosawa, Annie Ernaux.

Write each verdict into the commit message (kept / cut, one line), so a later
census does not redo it. Rebuild the bank; the server tests that count themes
or name one move with it.

## Step 2 — rank on a year, not on sixty days (one session)

`pvipdays` stops at 60. The yearly figure comes from the Wikimedia REST
per-article endpoint (`metrics/pageviews/per-article/fr.wikipedia/all-access/
user/<title>/monthly/<from>/<to>`), one request per candidate, cached in
`scripts/.cache` like the rest. Sum the last twelve full months. Check the
three news-bent themes above reorder as a table would expect, then rebuild.

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
