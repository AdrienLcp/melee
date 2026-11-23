# An « International » evening: nobody left out

Starts once 05, 08 and 09 have landed (it deals their fixed flags, the flash
blind test on `homeCountry: null`, and Five clues' new shape). Read
`README.md`, `docs/plans/14-question-languages.md`, `docs/plans/72-portuguese.md`
and `docs/game-catalogue.md`. Mapped read-only on 23/11/2026, lines from
`7ded3593`. Write the plan (`docs/plans/78-international.md`) first and cut it
into sessions if it outgrows one (~150k tokens).

Adrien: "besides Mêlée générale, I'd like an 'international' game where no
question is specific to one culture. In French or Portuguese we don't get the
same cities in Atlas (French cities in French, Portugal's in Portuguese);
quizzes lean French in French; same in other games. I'd like a purely
international game, no question, game or round tied to one country or its
culture. For Christmas my in-laws will play: some speak only French and have
always lived in France, others speak only Portuguese and come to France only
for Christmas, others are in between. Nobody should feel excluded by a
question or a round — and the same if people of different cultures anywhere
in the world play together. Create a special game for it."

## The real constraint: one table, two languages

A French-only and a Portuguese-only player at one table means **each screen
must read the round in its own language**. Today (plan 72) games split in
two:

- **Every language on every row**, each screen reading its own locale:
  timeline, most likely, challenge, black square, estimate, higher-lower,
  Atlas (picks sent as an index), Petit Bac's categories. **Ready.**
- **One language for the table** (`language` on the entry, one bank row sent):
  quiz (all rubrics), mystery word, longest word, think alike, five clues.
  **Not playable by a mixed table as is.**
- **No language**: reflex, lights, inner clock, swatch, matchsticks, make the
  number. **Ready.**

## Decided

- **The line-up** (`ready-made-line-ups.ts`, a sixth entry beside `grandMix`,
  a name of its own in fr/en/pt): the no-language games, the every-language
  games with universal content, and the country rubrics once they read per
  screen. **Out**: mystery word, longest word, think alike (a match between
  two languages is impossible) and Petit Bac (a word in the other language
  reads as nobody else's and pays double). Say so to Adrien in the record:
  word games can't be fair to a bilingual table.
- **Country rubrics per screen**: flags, capitals and silhouettes (and Five
  clues on countries) are built per language from one country list
  (`flag-questions.ts:84-118`, `capital-questions.ts:199-219`): deal them as
  codes and let each screen name the choices and the answer in its locale,
  the way Atlas does. Typed answers accept every language's names. This is
  the one protocol change that makes the quiz's universal rubrics playable.
  The rest of the quiz (OpenQuizzDB, Mintaka, rebus) stays out: rows exist in
  one language and lean on one culture; no tag says otherwise (only pt's
  `theme: "Portugal"`).
- **Universal content only**, tagged where a game mixes:
  - Atlas: countries and world capitals only (`atlas.ts:35-44`), never a
    city set.
  - Timeline: tag the ~19 France-specific events of the 218
    (`timeline-bank.ts:26`: Bastille, Tour de France, Veil law…) with a
    country and deal the untagged ones.
  - Black square: tag French themes (French dishes, presidents and kings of
    France, regions, French champions, Veber films — plan 72:186-198) and
    deal the rest.
  - Estimate / higher-lower: `homeCountry: null` already deals universal
    rows only (`quantity-bank.ts:81-83`) — the model the others copy.
  - Blind test: the flash and the decades on `homeCountry: null`, which 08
    makes international only (it fell back to France).
  - Five clues: the universal rows handoff 10 tagged.
- **Where a tag lives**: one field shape across banks (`homeCountry`-like:
  `null` = universal), so a future table from anywhere reads the same rule.
- The front door: the shelf offers it like the other ready-made evenings;
  the host's screen language does not restrict it.

## Done when

A table with one phone in French and one in Portuguese plays the whole
International line-up, each reading every round in its own language, seen in
a browser (two contexts, different locales, a wall in a third), muted; the
tags in place with core tests that the International deal never returns a
tagged row. Plan 78, changelog, CLAUDE.md, delete this file and its README
row.
