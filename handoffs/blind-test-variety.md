# Blind test — a wide, varied evening, never The Last of Us twice

> « On a enchaîné plusieurs blind tests et il y avait BEAUCOUP de thèmes
> musique de film ou jeux vidéo, littéralement une fois sur deux, voire plus.
> Et les réponses étaient très souvent "The Last Of Us" ou son compositeur. Ce
> genre de choses ne devrait pas se produire, ça fait pas pro et ça fait mal
> préparé. »

> « Quand on fait une partie avec un seul jeu (genre que du blind test), par
> défaut il faudrait qu'il soit réglé pour contenir tous les thèmes possibles
> non ? Genre toutes les décennies, tous les tops, etc. »

Server work plus the host's remembered setup. There is little UI, and none of
it on the round screens. It can run beside the black square handoff.

## What exists (audited 2026-11-07)

- There is one source, `catalogue`, with three strands:
  `{charts, decades, hasFilmScores}` (`packages/protocol/src/track.ts:64-118`).
  Its default is `EVERY_STRAND` (`track.ts:112-116`;
  `DEFAULT_BLINDTEST_SETTINGS`, `packages/protocol/src/game.ts:293-298`). **The
  default already says "everything".**
- **What breaks it is the remembered setup.** `rememberSettings`
  (`packages/core/src/room/host-preferences.ts:169-212`, called from
  `host-console-page.tsx:269`) stores the blind test's `source` under
  `games.blindtest`, even from a line-up. `restoredSettings` (L135-154,
  applied in `use-restore-stored-setup.ts:67-70`) lays it back over the
  defaults, and `restoredTable` (L98-104) does the same for a single-blind-test
  line-up.
  - The ready-made line-ups seed **film-only**: Free-for-all opens on one
    (`ready-made-line-ups.ts:97`), and Music ends on one (L177-180).
  - After either one, the next blind test opens film-only. That is very likely
    what the evening hit.
- The pool is in `apps/server/src/infrastructure/music/deezer-client.ts`.
  - `fetchTracksFor` (L98-160) draws one strand whole. Film alone means 8
    random composers from `FILM_COMPOSER_IDS` (49, L324-374; Santaolalla at
    L339), through `/artist/{id}/top?limit=100`.
  - Several strands are sampled at 3 playlists and 3 composers (L410-439).
    Then `evenedOut` (L169-179) gives **film a full third**.
- `film-score.ts` takes any album titled "soundtrack" or "score". It treats
  "game", "video" and "hbo" as noise (L39-83) and folds seasons (L99-100). So
  the game soundtrack and the HBO soundtracks become **one work, "The Last of
  Us"**, which fills Santaolalla's top tracks.
- Repeats are blocked **per Deezer track id only**: `withoutRepeats`
  (L186-188), and `room.playedContentIds` for the evening
  (`round-service.ts:1804`). There is no cap per work, per composer or per
  artist.
  - Decoys come from the same pool and the same kind (`drawChoices`,
    `track-pool.ts:247-282`). So TLOU is an answer *or a decoy* in nearly
    every film round where Santaolalla was drawn.
  - The draw is `drawPlayableTrack` (`apps/server/src/domain/round/track-pool.ts:30-82`).
    It refills only when the pool is empty (L202-233).

## Decided

1. **A room playing the blind test alone opens on `EVERY_STRAND`.** The
   remembered `source` no longer leaks across rooms.
   - Recommended: stop storing `source` from a line-up or ready-made entry
     (filter it in `rememberSettings`). A source the host picked by hand for a
     single-game room stays remembered.
   - Weigh that against dropping `source` from `rememberedSetupFor` altogether,
     and decide.
   - Also check that the ready-made line-ups' film-only entries are what
     Adrien wants. A "Music" evening ending on film scores is probably fine
     **as a named variant**, but it must not seed the next room.
2. **Film weighs less in a mixed pool.** Replace `evenedOut`'s equal share
   with weights per strand: film at **half a share**, and decades split so each
   decade weighs the same. With everything on, film then comes out around
   1 track in 6, not 1 in 3.
3. **One work at most once per evening, one composer or artist at most twice.**
   - Cap per pool before `evenedOut`: at most 1–2 tracks per film work and per
     artist.
   - Keep a played set of works and artists on `Room`, beside
     `playedContentIds` (`room.ts:141`). Fill it in `drawPlayableTrack`, and
     filter refills against it in `refillWhenEmpty`.
   - Decoys never repeat the round's own work. Prefer decoys not used earlier
     in the evening.
4. **Video-game and TV soundtracks are not film.** Either keep them out of the
   film strand (stop treating "game", "video" and "hbo" as noise, so those
   albums are recognised and filtered), or make a deliberate strand of their
   own, off by default. Recommended: out. A table that asked for film scores
   wants films.

## Verify

- Unit tests on the pool:
  - an `EVERY_STRAND` pool holds film under ~20%;
  - no work appears twice over a simulated evening of 30 rounds, with one
    fixture composer whose catalogue is all one work;
  - the host preferences no longer carry a line-up's `source` into a fresh
    single-game room.
- Run a real draw against Deezer (dev server) for ~40 rounds. Print the
  strand, work and artist of each track, and paste the tally in the final
  reply.
- If the setup screen changes, check it in a real browser, **muted**: this
  game plays music (`melee:volume = '0'` in an init script,
  `docs/browser-driving.md`).
- The quiz banks (`question-bank.json`, `videogames-fr.json`) also lean on The
  Last of Us. Look, and thin it out if one work dominates.
- Update `docs/plans/61-cumulative-track-sources.md` and the CHANGELOG.
