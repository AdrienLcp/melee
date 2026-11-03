# 61 — Cumulative track sources

**Goal.** A blind test draws from any combination of *top charts*, *decades*
and *film scores*, ticked together, instead of one of them or the fixed
`all` mix. The host's ask (03/11/2026): "a complete blind test should have
every decade, the film scores and the charts" — which is what `{ kind: 'all' }`
already deals, shown as a strip with *nothing* pressed. Nobody reads an empty
strip as "everything", so the mix has to be what is ticked.

## What exists (mapped 03/11/2026)

- `packages/protocol/src/track.ts:60-110` — `trackSourceSchema`, six arms:
  `all`, `chart { genreIds }` (empty = every genre), `decade { decades }`
  (already a set, empty = every decade), `film`, `playlist`, `search`.
  `DEFAULT_BLINDTEST_SETTINGS` (`game.ts:293`) opens on `all`.
- `apps/server/src/infrastructure/music/deezer-client.ts` — `strandsOf`
  (l.411) turns `all` into three strands (whole chart, 3 of 12 decade
  playlists, 3 composers), `catalogued` filters each strand on its own rules
  (film ignores difficulty, `FILM_SCORE_FLOOR`), `evenedOut` trims every strand
  to the thinnest (unweighted, six rounds in seven were score cues, 27/10),
  `withoutRepeats` dedupes.
- `apps/server/src/domain/round/track-pool.ts` — `isSameSource` /
  `discardPoolIfStale` (l.141-180) switch on the kind; `drawChoices` keeps
  film decoys with film answers. `asksForAFilm` is per round
  (`room-view.ts:714`), so a mixed pool already plays.
- `apps/game/src/features/host/playlist-picker.tsx` — one `ToggleGroup` in
  `single` mode, nothing pressed = `all`; genre and decade strips under their
  own kind; decades and film fire a preview on the press.

## Decisions

1. **One `catalogue` arm replaces `all`, `chart`, `decade` and `film`:**
   `{ kind: 'catalogue', charts: GenreId[] | null, decades: TrackDecade[] | null, hasFilmScores: boolean }`,
   refined to hold at least one strand. `null` = that strand is not drawn,
   `[]` = all of it. `playlist` and `search` stay their own arms — a list the
   host names is not a catalogue and is never mixed. The default is all three
   on, which is today's `all`.
2. **Two levels on screen.** A `SegmentedControl` *Where the tracks come from*:
   *The catalogue · A Deezer playlist · A search*. Under the catalogue, a
   `ToggleGroup` (multiple) *Top charts · Decades · Film scores* that refuses
   to untick its last stamp (`disallowEmptySelection`); the genre strip shows
   while charts are ticked, the decade strip while decades are, the film hint
   while film is. One strip mixing toggles and exclusive choices was rejected:
   pressing *A search* would silently untick three others.
3. **Sampling keeps the cost rule.** A catalogue of one strand draws it whole,
   as the single arms do today; two or more sample like `all` does
   (`DECADE_PLAYLISTS_PER_MIXED_POOL`, 3 composers) and go through
   `evenedOut`.
4. **Difficulty is pinned only for a film-only catalogue.** In a mix it reaches
   the charts and decades, as `catalogued` already does.
5. **The scoring line has three cases**: songs only (title and artist), film
   only (the film), mixed (title and artist, or the film for a score) — a new
   `blindtest.scoring*` key for the mixed one. Today it is keyed on
   `source.kind === 'film'`: `lobby-stage.tsx:297`, `player-round.tsx:965`,
   `scoringKey` in `presentation/i18n/translation.ts:119`.
6. **No preview for the catalogue.** Its lists are curated and never come back
   empty; the auto-preview on a decade or film press only spends Deezer quota
   (its count was taken off the screen on 03/11). Delete the chain:
   `API_ROUTES.decadeTracks` / `filmTracks`, `decadePreviewQuerySchema`,
   `fetchDecadeTracks` / `fetchFilmTracks`, the server routes
   (`http/routes.ts:276-300`), `blindtest.source.noneInDecade` /
   `noneInFilms`, and their branches in `use-playlist-preview.ts`.
   `catalogue-logging.test.ts` exercises partial-failure logging through
   `filmTracks`: move it to the round's draw, which logs the same faults.

## Migration

- `PROTOCOL_VERSION` 66 → 67.
- Stored settings parse through a `z.preprocess` on the blind test's source
  that maps the old arms (`all` → all three, `chart` → charts only, `decade` →
  decades only, `film` → film only), so `HostPreferences`, saved line-ups,
  recent tables and the export file keep their blind tests rather than being
  dropped by `usableGameSetups` / `savedEntryOf`.
- The Durable Object reads its room without a schema (`room-object.ts:99`):
  add a load-time patch beside `withSeatColours` / `withHoldFields` for
  `settings.game` and every `settings.lineUp[]` entry.
- `packages/core/src/room/ready-made-line-ups.ts:163-174` (French chart, 80s,
  film) moves to one-strand catalogues.

## Readers to update

- `presentation/i18n/line-up-entry-names.ts` — one strand names the entry
  (*Film scores*, *the 80s*, *French chart*), several give no name, as several
  decades already do (l.27-38).
- `packages/core/src/room/settings-summary.ts:23,59` and
  `use-settings-summary.ts:93` — the summary's `source` kind.
- `settings-panel.tsx:273` — `pinsItsOwnDifficulty`.
- Tests: `deezer-client.test.ts` (`[all]` and the weighed suite become
  catalogue cases, plus a two-strand case), `track-pool.test.ts`
  (`isSameSource` across catalogues), core `room/` tests listed by
  `grep -rln "kind: 'all'\|kind: 'film'\|kind: 'decade'\|kind: 'chart'"`,
  `line-up-entry-names.test.ts`, `codec.test.ts`.
- e2e: `strip-rows.spec.ts:370-379` presses `.track-source .segment` index 1
  expecting decades — rewrite for the two levels.
- Docs: `docs/game-catalogue.md:126-162`, `apps/game/PRODUCT.md` (the blind
  test's sources line), `docs/architecture.md`, the changelog (protocol 67).

## Done when

A host ticks decades and film scores, unticks charts, opens a round, and the
draws alternate between songs of the chosen decades and score cues, each
round's answer line right; a stored `all` from before reloads as the three
ticked; `pnpm validate` is green; the picker is checked in a browser, muted,
at phone width and in French.
