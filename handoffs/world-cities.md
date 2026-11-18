# World cities missing from the quantity bank

Found by Portuguese session 05 (`docs/plans/72-portuguese.md`, _05 — what
landed_). The world's cities in `apps/server/scripts/build-quantity-bank.ts`
(`CITIES`: direct classes city, big city, million city, metropolis, capital,
independent city; 500 000 people; an article in en and fr; 20 sitelinks)
miss cities every table knows: **Madrid, Buenos Aires, Brussels, Los
Angeles, Seville** at least. Lisbon was missing too and is now asked by name
as a Portuguese town, which only a Portuguese table is dealt.

## The work

1. Find why each is missed (its `P31` is outside the six classes, its best
   `P1082` is a metro figure or below the floor, a qualifier date) — one
   SPARQL probe per city. Fix the source rather than listing names, unless
   only a few stragglers remain: then `UNION { VALUES ?item { … } }`, as
   `FRENCH_TOWNS` does for Paris and `PORTUGUESE_TOWNS` for Lisbon. Move
   Lisbon to the world's cities if the fix catches it.
2. **Figures of existing rows must not move.** A rebuild re-fetches every
   query whose text changed and Wikidata's figures drift: merge the new rows
   into the committed bank instead of taking the build's output whole (05
   did it with a scratch script: old rows kept as they were, new rows
   appended), and check every existing row's `value` is unchanged.
3. New rows need `pt` names in pt-PT (_Madrid_, _Bruxelas_, _Sevilha_) and
   the famous lists: `FAMOUS_QUANTITY_NAMES` (French names) and
   `FAMOUS_IN_PORTUGAL` (by entity).

## Done when

The cities above are in the bank for every table, `quantity-bank.test.ts`
holds one of them, `pnpm validate` is green, this file is deleted and its
row struck from `handoffs/README.md`.

<!-- cspell:words Bruxelas Sevilha portuguese -->
