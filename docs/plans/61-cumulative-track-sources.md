# 61 — Cumulative track sources

**Done** 03/11/2026, as decided below. Two things the plan did not foresee:
a strip holding several answers now inks each ticked stamp flat in the tray
with a check, because the strands, genres and decades all ticked read as a
wall of lifted pieces (`DESIGN.md`, _Strips_), and the stored-room patch is
its own module, `stored-settings.ts`, beside the other load-time patches.

**Goal.** A blind test draws from any combination of _top charts_, _decades_
and _film scores_, ticked together, instead of one of them or the fixed
`all` mix. The host's ask (03/11/2026): "a complete blind test should have
every decade, the film scores and the charts" — which is what `{ kind: 'all' }`
already deals, shown as a strip with _nothing_ pressed. Nobody reads an empty
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
2. **Two levels on screen.** A `SegmentedControl` _Where the tracks come from_:
   _The catalogue · A Deezer playlist · A search_. Under the catalogue, a
   `ToggleGroup` (multiple) _Top charts · Decades · Film scores_ that refuses
   to untick its last stamp (`disallowEmptySelection`); the genre strip shows
   while charts are ticked, the decade strip while decades are, the film hint
   while film is. One strip mixing toggles and exclusive choices was rejected:
   pressing _A search_ would silently untick three others.
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
  (_Film scores_, _the 80s_, _French chart_), several give no name, as several
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

## Afterwards — a varied evening (07/11/2026)

The game night of 06/11 played several blind tests in a row and heard film or
game music one round in two, very often _The Last of Us_. Four causes, four
fixes:

- **The remembered setup leaked the source.** An evening that closed on film
  scores — two ready-made line-ups do — filed its blind test under
  `games.blindtest`, and every later room opened on film scores alone.
  `rememberedSetupFor` now reads a blind test back on `EVERY_STRAND`, whatever
  it was last played on: the catalogue is tonight's music, like the line-up is
  tonight's games, and a table playing one game expects all of it. Reading it
  there rather than filtering the write also clears the setups already stored.
- **Film weighed a full third of a mix.** `evenedOut` became `weighed`: each
  share pays in by its weight against the thinnest, the chart weighing 1, the
  decades 1 between them (each decade its own share, one playlist apiece in a
  mix) and film `FILM_WEIGHT` 0.4. Measured against Deezer: five
  `EVERY_STRAND` pools held 12–13 film tracks of 72–79 (16.5%), and three
  evenings of forty rounds drew 3, 5 and 5 score cues. A mix asks 6 composers
  (`COMPOSERS_PER_MIXED_POOL`, was 3) so film is not the share that shrinks
  the pool.
- **Nothing capped a work or an artist.** `track-variety.ts` (core) keys a
  track by its work — the film, or the song as its artist recorded it — and
  by its artist. A curated pool keeps one track a work and two an artist
  (`variedPool`), and `Room.trackHistory` keeps an evening from opening a
  work twice or an artist a third time; it survives a restart, as
  `playedContentIds` does. A playlist or a search is not held to it: a Queen
  playlist is all Queen on purpose. Decoys never repeat the round's own work
  and reach for a work the evening has not offered yet.
- **Game soundtracks counted as film.** `film-score.ts` refuses an album that
  calls itself a game's (`VIDEO_GAME_MARKER`), and `filmsScoredIn` refuses
  every release named after a game in the same catalogue — which is the only
  way to catch _The Last of Us Part II (Original Soundtrack)_ and the HBO
  series, filed as nothing but soundtracks. Series otherwise stay in the
  strand: _Game of Thrones_ is shouted like _Interstellar_, and the handoff's
  "TV out" would have emptied Djawadi, Dixon & Stein and McCreary. `game` and
  `video` left `MARKER_WORDS`, which turned _The Imitation Game Soundtrack_
  into _The Imitation_.

The quiz leaned on the same title: a cluster of near-identical Mintaka rows
dealt from six games, _The Last of Us_ among them. Nine dropped as repeats
through `question-repairs.json`, one more for answering _Ocarina of Time_ as
the best-selling Zelda, and two of the five hand-written rows about the game;
the bank's mentions went from 23 to 12.
