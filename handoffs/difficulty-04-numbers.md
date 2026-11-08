# Difficulty, part 4 — things a French table knows, in Plus ou moins and Le juste chiffre

Wave 3, after parts 1–3 (rules and Adrien's first words in
`difficulty-01-setting.md`).

## What part 1 left (landed)

`tierOfQuantity` in `quantity-bank.ts` is the stand-in:
`isFamousQuantity → easy`, `isWellKnown → medium`, rest `hard`, used by both
`drawQuantity` and `drawPairs` (`dealByDifficulty`, a whole round of pairs from
one tier). **This changed what a default room plays**: both draws used to go
famous-first, and `mixed` now deals a hard-tier quantity or round one time in
three — the gap Adrien's "things a French table knows" is about. A server test
already pins `easy` to famous rows (`__tests__/difficulty.test.ts`).

## What Adrien said

> Les « plus ou moins », ce ne sont pas les valeurs que je remets en question,
> c'est les choses à comparer en elles-mêmes, je ne les connais jamais
> pratiquement, on pourrait avoir des trucs plus connus. Dans les superficies
> par exemple ça pourrait être la France comparée à un autre pays ? Ou des
> villes de France ? Que ce soit en nombre d'habitants ou en superficie ?

So the ratio band stays (`MIN_PAIR_RATIO = 1.15`, `MAX_PAIR_RATIO = 4`,
`packages/core/src/higherlower/pair-deal.ts:20,23`) in `mixed` and `hard`; the
fix is **which things** are compared.

## Why they are unknown today

- Both games read `apps/server/src/infrastructure/questions/quantity-bank.json`:
  4 578 rows, six families (`packages/protocol/src/estimate.ts:13-20`).
  "Well known" (`isWellKnown`, 980 rows) is ≥ 2 000 French Wikipedia views over
  60 days (`scripts/frwiki-notability.ts:30,40`) — which lets in Gabon, Nauru,
  Shenyang, Tianjin.
- A hand-picked list of ~232 truly famous rows exists
  (`famous-quantities.ts:61-209`, `isFamousQuantity` `:203`), but **only Plus ou
  moins uses it, and Le juste chiffre never does** (`quantity-bank.ts:46-59`
  draws uniformly among well-known rows). Plus ou moins exhausts it and falls
  back to Gabon vs Gambia (`quantity-bank.ts:71-85`).
- Wikidata `sitelinks` is fetched at build time and dropped
  (`scripts/build-quantity-bank.ts:33,181,228,299`).

## The work

1. **Content a French table knows**, added to the bank by its build script:
   - **French cities** — population and **area** (a new family, `area.city`:
     protocol family list, units in both dictionaries under `estimate.*` /
     `higherlower.*`). `city-bank.ts` already lists French cities for Atlas;
     reuse its list as the seed.
   - **France against the world** — a pair that holds France on one side is a
     natural `easy` pair; let the higher-lower deal prefer one side from a
     "home" set (France, its regions and big cities) in `easy`.
   - Look at French regions, départements, rivers (Loire, Seine, Rhône…),
     mountains (Mont Blanc…), monuments (Tour Eiffel, Tour Montparnasse…);
     keep what a table at a party would know.
   - Grow the famous list where it is thin, and make it a `tier`.
2. **Tiers** for every row: hand list and the home set → `easy`; keep
   `sitelinks` and cut the rest by it into `medium` / `hard`. Replace part 1's
   stand-in mapping.
3. **Le juste chiffre** draws through the tier draw like everything else, so
   in `mixed` a third of its questions come from the famous list it never used.
4. **`easy` only** may widen Plus ou moins' ratio band (e.g. 2× to 20×) so a
   child's pair is never a coin flip. `mixed` and `hard` keep today's band.
   The estimate scoring (`estimate-pay.ts`, zero at 3× off) stays as it is.

## Done when

A deal at `easy` in either game shows only things like Paris, Lyon, la France,
la Loire; `mixed` shows a third of them; a server test proves each; a muted
browser round of each game at Facile looks right.
