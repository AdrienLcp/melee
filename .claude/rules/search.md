---
description: Text search over the app's records — one normaliser on both sides, every word must match; answer matching is a different job
paths:
  - "apps/game/src/helpers/**"
  - "apps/game/src/features/**/use-*.ts"
  - "packages/core/src/helpers/**"
  - "packages/core/src/round/answer-matching.ts"
---

# Search

## A search over records

Melee has none yet. The day one arrives — filtering held tables, players, a
list the user scrolls — it matches the way a person types:

- **Both sides are normalised the same way**: NFD, diacritics stripped, case
  folded, every run of punctuation and whitespace collapsed to one space.
  `lefevre` finds `Lefèvre`, `jean pierre` finds `Jean-Pierre`.
- **Every word of the query must match**, in any order. A ranking is a later
  decision, not a default.
- **One helper owns it**, `apps/game/src/helpers/search-text.ts` (or
  `packages/core/src/helpers/` if the server searches too), imported by every
  search.

```ts
const DIACRITICS = /\p{Diacritic}/gu
const NOT_LETTER_OR_DIGIT = /[^\p{L}\p{N}]+/gu

export const searchableText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(NOT_LETTER_OR_DIGIT, ' ')
    .trim()

export const matchesQuery = ({ query, text }: { query: string; text: string }): boolean => {
  const words = searchableText(query).split(' ').filter(Boolean)
  const searchable = searchableText(text)

  return words.every((word) => searchable.includes(word))
}
```

A combo box filtering its own short list of options keeps react-aria's
`useFilter`; the helper is for records.

## Answer matching is not search

`normalizeAnswer` in `packages/core/src/round/answer-matching.ts` judges a
guess, and folds further on purpose: it drops whitespace entirely (`daftpunk`
is `daft punk`), strips a leading article and forgives typos up to the nearest
decoy. Its first steps are the search's — NFD, diacritics, case, everything
not a letter or digit — and they stay that way; the rest is a verdict, and
neither helper is bent toward the other.

## The blind test's search is Deezer's

The free search sends the host's query to Deezer through the server, so the
field says so (`blindtest.source.queryHint`) and the legal page lists it — see
`privacy.md`. No third-party search service is added for the app's own
records: the query would leave the site.
