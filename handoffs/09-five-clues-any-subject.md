# Five clues, step 1: any subject, and clues that rule choices out

Starts once `05-content-fixes.md` has landed (it renames the Congo the game
deals). Read `README.md`, then `docs/plans/73-five-clues.md` and
`docs/game-catalogue.md`. Mapped read-only on 23/11/2026, lines from
`7ded3593`. Handoff 10 follows with the new subjects' content.

Adrien: "Five clues is cool but has quite a few flaws. It's always
countries? Can't we have other themes — fictional characters, real people,
films, a bit of everything? It needs to grow a lot. And a clue said 'South
America' but every choice was a South American country, so the clue excluded
nothing. Each clue of that kind should rule out a choice every time, e.g. a
North American country among the choices when a clue is 'South America'."

## Today

- Bound to countries end to end: a fixed tuple `size / region / outline /
  cities / flag` (`packages/protocol/src/five-clues.ts:59-117`), an answer
  with `countryCode` (`:158`), the view's `answer` and `choices`
  (`room.ts:935-946`), content from country banks only (`five-clues-bank.ts`),
  grading on `acceptedCountryNames`, screens switching per kind
  (`five-clues-clue.tsx` with `CountrySilhouette`, `FlagPicture`; the reveal
  translating `atlas.country.${code}.name`, `five-clues-reveal.tsx:185`).
  The round itself (`five-clues-round.ts`) is mostly generic.
- **Decoys are chosen not to discriminate, on purpose**: the three same-region
  countries with the nearest capitals (`five-clues-bank.ts:180, 228`), so the
  region clue never strikes one (plan 73:58-64). Adrien reverses that choice.

## Decided

- **A subject-agnostic ladder**: five rungs, each `text` or `image`
  (`{ kind: 'text', text } | { kind: 'image', file, alt }`, the session
  settles the exact shape), an answer `{ name, accepted[] }` with no code, and
  a `subject` (country, person, character, film… — the list is handoff 10's).
  Countries keep their rich rungs (silhouette, flag, size printed in the
  screen's locale) as one producer of that ladder, flattened at deal time or
  kept as a variant — whichever keeps the screens one code path.
- **Each clue rules out at least one choice as it opens** (in `choice`): a
  staircase where decoy _k_ survives clues 1..k and fails clue k+1. For
  countries: d1 from another region (fails the region clue), d2 same region
  but a size ≥3× apart (fails size), d3 same region and size but a clearly
  different outline — which needs a shape descriptor (aspect ratio,
  compactness, landlocked) computed at build. Cities can't be guaranteed to
  rule out (players may not know them); flag + capital rules out everything.
  The rung order is the session's to settle so each step eliminates; check
  pool depth per region at build and fall back where it's thin. For other
  subjects, each authored rung names which decoy it rules out (handoff 10
  writes them).
- Typed and buzzer modes keep working on `accepted[]`; the near-miss guard
  ("forgiveness stops one edit short of the nearest answer the bank calls
  wrong") holds.
- Rewrite plan 73's decoy paragraph with the reversal and its reason.

## What breaks and must follow

The protocol tuple and `countryCode`, console / wall / seat components, the
typed near-miss guard, the difficulty draw through `countryTierOf`,
`playedFiveCluesId(code)`, the MCP `game-notes.ts`, CLAUDE.md's description,
`five-clues-game.test.ts`, `five-clues-bank.test.ts`. The anti-leak test
(no seat or wall frame carries the answer before the reveal) stays, seen red
once with the guard removed.

## Done when

Countries play on the new shape with a staircase (a test asserts every clue
rules out at least one choice on every dealt country, or the fallback is
named), the three modes still served, the screens unchanged to the eye
except where a rung is text or image, filmed. Plan 73, protocol doc,
changelog, delete this file and its README row.
