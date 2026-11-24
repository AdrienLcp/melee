# 79 — « Sans frontières »: an evening nobody is left out of

**Done** 24/11/2026 — one session, its pieces run side by side.

Adrien, 23/11/2026: besides _Mêlée générale_, an evening where no question,
game or round is tied to one country or its culture — for a Christmas table
where some speak only French, some only Portuguese, some both, and for any
table of mixed cultures anywhere.

## The constraint: one table, two languages

A French-only and a Portuguese-only player at one table means **each screen
reads the round in its own language**. Plan 72 left the games in three kinds:

- **Every language on every row**, each screen reading its own: timeline, most
  likely, black square, estimate, higher or lower, Atlas, Petit Bac's
  categories.
- **One language for the table**: the quiz, mystery word, longest word, think
  alike, five clues.
- **No language**: reflex, lights, inner clock, swatch, matchsticks, make the
  number.

## Shape, as settled

- **A sixth ready-made line-up, `international`**, second on the shelf after
  _Mêlée générale_: _Sans frontières_ / _Without borders_ / _Sem fronteiras_.
  Built like the grand mix — every game no host judges, one entry per value of
  its main axis — less the word games, and spelled out wherever a game deals a
  table's own content, so a bare entry never brings the host's country back
  through their remembered setup. The host's screen language changes nothing
  in it but the quiz's `language`, which its country subjects no longer read.
- **Word games are out, and say why**: mystery word, longest word and think
  alike match words, and a match between two dictionaries never happens;
  Petit Bac would pay a word in the other language double as nobody else's.
  No word game can be fair to a table that does not share one language.
- **`homeCountry` is the one tag, on every bank that holds a country's own
  rows**: `CountryCode | null` on the row (`null` = every table's) and on the
  game's settings (the table's country, seeded by `homeCountryFor(locale)` and
  re-synced by `askedIn`), dealt by `row.homeCountry === null ||
  row.homeCountry === settings.homeCountry`. Estimate, higher or lower and the
  blind test had it; timeline and black square take it here. A French table
  still meets the Bastille and French dishes; a Portuguese one no longer does,
  and the borderless evening deals neither.
- **The quiz's country subjects read per screen.** Flags, capitals and
  silhouettes are built in every language and merged into one question whose
  prompt, choices and answer are `Localized<string>`; every other quiz row
  carries its one language in all three locales, so a screen always reads its
  own. A pick is said as its index, so the reveal names it in the reader's
  language; a typed answer is graded against every language's names.
- **Five clues reads per screen too**, and its rows are dealt by `homeCountry`
  rather than by language: the borderless evening deals the universal ladders
  handoff 10 tagged.
- **Content**: Atlas on countries and world capitals alone, never a city set;
  the blind test's decades, film scores and flash on `homeCountry` `null`
  (the world's playlists), no chart; estimate, higher or lower, timeline and
  black square on `null`; of the quiz, its three country subjects only.
- **The rest of the quiz stays out**: OpenQuizzDB, Mintaka and the rebus exist
  in one language each and lean on one culture, with no tag to say otherwise.

## Measures

- **Timeline: 31 events tagged `FRA`** of 218 — the Veil law, Mitterrand,
  the TGV, _Les Visiteurs_, the death of Johnny Hallyday, Marignan, the Fifth
  Republic… Left everyone's: what the world was taught or watched — the
  Bastille, Charlemagne, Joan of Arc, Napoleon, 1998 (a Brazilian knows that
  final), Notre-Dame's fire, the Paris Olympics, Disneyland Paris, _Amélie_.
  No row is Portugal's, the UK's or the US's alone. A `null` table still
  deals at least 34 rounds at every level (200 trials; 42 with every row).
- **Black square: 9 themes tagged `FRA`** — French dishes, the films of Oury
  and Veber, French champions, presidents and kings of France, its regions,
  Zola's and Hugo's books (_Hernani_ is a French classroom's). The tag sits
  on the Wikidata theme's spec, and a test holds the built bank to it. Left
  everyone's: the capitals bordering France, Besson's films, the US states
  and presidents — tagging those `USA` would take them from every table,
  since no locale is the United States'. 250 themes for a `null` table.
- **Five clues** deals by `homeCountry` now, and English maps to none: the 20
  British and American people handoff 10 wrote no longer reach any table.
  Every subject keeps 48 to 60 universal ladders, above the 40 a table needs.
- **The capitals' decoys are aligned by identity**: three cities chosen by
  Wikidata id, refused when any of their names in any language is already
  offered, so choice _i_ is one place in every locale.
- **Stored rounds migrate**: a quiz or Five clues round stored in the
  one-language shape reads as its text copied into each locale
  (`withLocalizedQuiz`, `withLocalizedFiveClues`).

## Left out

- A per-country tier for black square (plan 72) — still the lever if a
  Portuguese table finds a theme flat.
