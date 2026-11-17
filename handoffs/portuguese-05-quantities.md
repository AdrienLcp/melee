# Portuguese 05 — Estimate and higher or lower

Series: `handoffs/README.md`. Read `docs/plans/72-portuguese.md` first,
especially session 01's decision on "the room's country", and
`docs/plans/58-estimate.md`.

## The work

1. **Names in Portuguese** on `quantity-bank.json` (4,993 rows, 1 MB) and
   `price-bank.json` (194 rows, in euros — Portugal's currency too). Batches
   of about 250 rows per subagent, run in parallel, each spot-read by a
   second agent. A quantity's name is short and exact (_altura da Torre
   Eiffel_, _população do Porto_): units stay metric, numbers stay untouched —
   a test compares every row's figures before and after.
2. **France-only rows**: 607 quantities and 171 prices carry `isInFrance`
   (EDF tariffs, French populations). Build whatever session 01 decided so a
   Portuguese table is not dealt them.
3. **Portugal's own rows** — the mirror of `isInFrance` for a Portuguese table:
   a few hundred quantities a table in Lisbon knows (Ponte 25 de Abril, the
   population of Porto, the height of the Torre dos Clérigos) and prices
   (a _bica_, a _pastel de nata_, a CP train fare). Same sources and shape the
   French rows were built from — read how `famous-quantities.ts` and the
   build scripts did it.

## Done when

Every row holds `pt`, figures are unchanged, a Portuguese table is dealt no
France-only row and some Portugal rows, `pnpm validate` is green, this file
is deleted and its row struck from `handoffs/README.md`.

<!-- cspell:words Abril Clérigos Torre altura bica nata população portuguese -->
