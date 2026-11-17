# Portuguese 04 — Black square in Portuguese

Series: `handoffs/README.md`. Read `docs/plans/72-portuguese.md` first, then
the black square plan in `docs/plans/` for what a theme, an answer, an alias
and a `why` are for.

## The work

Black square rows carry `labels`, `aliases` and `why` per language, in two
sources under `apps/server/src/infrastructure/questions/`:

- **Generated** — `black-square-bank.json`, 57 themes of about ten answers,
  from Wikidata. Teach its build script `pt` and rebuild: Wikidata holds
  Portuguese labels and aliases for most of these. Read the rows where it
  fell back or holds a Brazilian spelling.
- **Hand-written** — nine `black-square-authored-*.json` files, 202 themes of
  12-19 answers: about 3,000 answers with aliases and a `why`. One subagent
  per file, each spot-read by a second. Aliases are what a Portuguese table
  would actually _say_ (abbreviations, the common name beside the official
  one), not a translation of the French aliases. A theme whose answers are
  French culture (French singers, French dishes) gets Portuguese labels like
  any other — whether such themes should be dealt to a Portuguese table is
  session 01's "room's country" decision, applied here if it covers black
  square.

Keep the obvious-to-obscure order the pay depends on: an answer obvious in
French may be obscure in Portuguese and the reverse — flag those rather than
reorder silently.

## Done when

Every theme holds `pt` everywhere it holds `fr`, the bank test checks it,
`pnpm validate` is green, this file is deleted and its row struck from
`handoffs/README.md`.
