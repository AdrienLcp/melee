# Portuguese 02 — The interface in Portuguese

Series: `handoffs/README.md`. Read `docs/plans/72-portuguese.md` first
(written by session 01) and `.claude/rules/i18n.md`, `locales.md`.

Everything here is written but **not registered**: `pt` joins `LOCALES` in
session 08, and a `DICTIONARIES` entry for a locale the union lacks fails its
`satisfies`.

## The work

1. **`dictionary-pt.ts`** beside `dictionary-en.ts` (the type source, about
   1,390 leaves). Type it against the English shape so a missing key fails
   now, not at the flip. European Portuguese throughout (_ecrã_, _telemóvel_,
   _equipa_, _pontuação_; never _tela_, _celular_, _time_). Split the file
   across subagents by top-level prefix (one game's `blindtest.*`, `quiz.*`…
   per batch), each batch spot-read by another agent. Keep the tone of the
   French: short, the control named by its place (`ui-less-text`).
   Placeholders keep their kind (`{n:plural}` — Portuguese counts 0 as
   plural, unlike French; check what `@adrienlcp/i18n` does with `pt`).
2. **`COUNTRY_NAMES_PT`** in `packages/core/src/countries/country-names-pt.ts`
   (286 rows, `{ name, withArticle }` per ISO3). Portuguese takes an article
   on most countries, gendered: _o Brasil_, _a França_, _os Estados Unidos_,
   _as Filipinas_, and none on some (_Portugal_, _Angola_, _Cabo Verde_,
   _Moçambique_). Start from `Intl.DisplayNames('pt-PT')`, then write every
   `withArticle` by hand. The dictionaries embed country names too — mirror
   what `dictionary-fr.ts` does.
3. **Petit bac categories** are dictionary keys: translated in step 1.
   Check the default excluded letters still make sense in Portuguese (K, W
   and Y are barely used; Q only before _u_).
4. **Around the dictionary:** `document-head.ts` (page heads, image alt,
   `OPEN_GRAPH_LOCALES` → `pt_PT`), `public/og-pt.png` (redraw the French one
   in Portuguese — `impeccable` if it is designed rather than retyped),
   `features/legal/legal-details.ts` (the legal page must stay true —
   `.claude/rules/privacy.md`), `site-credits.ts`, `public/llms.txt`.

## Done when

The files typecheck against the English shape, `pnpm validate` is green, this
file is deleted and its row struck from `handoffs/README.md`. Nothing is seen
in a browser yet — that is session 08's.
