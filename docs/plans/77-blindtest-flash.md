# 77 — Blind test « Flash »

**Done** 24/11/2026 — one session.

Adrien, 23/11/2026: a new blind test mode, a song everyone recognises at
once, heard for one second or less, depending on the table's culture, and
in _Mêlée générale_.

## Shape, as settled

- **A variant of the blind test, not a game.** Two settings that combine
  freely:
  - **The classics**, a fourth strand of the catalogue (`hasClassics`,
    defaulted to `false` so a stored source still parses): the decades'
    playlists above a floor of their own, the table's country's beside the
    world's. Like the film scores it pins its floor whatever the room's
    difficulty says (`pinsItsOwnFloor` folds the difficulty away for a
    catalogue of those two alone).
  - **The window**, `clipWindowMs` on the blind test's settings: `null` for
    the whole clip, else 500–5 000 ms, offered as _Tout · 2 s · 1 s · 0,5 s_
    under _Ce qu'on entend_. `roundDurationMs` stays the round's length,
    renamed _Durée de la manche_ on screen so neither choice flips the label.
- **The span is stamped on the round** (`round.content.clip`, public: it is
  the round's rule, not its answer): `{ startMs, windowMs }` from
  `clipSpanFor`, so a speaker reloading, a wall paired late and a pause
  resumed all start and stop on the same second, and a setting changed
  between rounds reaches only the next. A round stored before it reads as the
  whole clip from the top (`withClipSpan`, beside `withHoldFields`).
- **The speaker closes the window on its own position** (`hasPlayedClipWindow`),
  watched on every frame and on `timeupdate` for a hidden tab, so a clip that
  started late still sounds its whole window. Past it (`isClipWindowOpen`) a
  reload, a resumed pause or a wrong buzz hears nothing more, the stall check
  stands down, and the deck waits at the flash's end so the reveal plays the
  track on from there. A replay under the reveal goes back to the flash's
  second.
- The console and the wall say _Une seule écoute_ where a round says _À
  l'écoute…_. A line-up row names the entry _Flash_ and its settings
  _Flash de 1 s_.
- **`homeCountry` `null` deals the world's alone.** It used to fall back on
  France's decade playlists, so an English table heard French hits.
- **In _Mêlée générale_** as one blind test entry — the classics, 1 s, a
  15 s round — with the room's `homeCountry`. Rock's chart gave it its entry:
  an eleventh blind test left the dealer no order spacing the blind test its
  share (`spacedCycle`'s Free-for-all test), and the seventies to the
  nineties deal rock already.
- `PROTOCOL_VERSION` 77 → 78.

## Measures

**The pool**, from the decade playlists' `rank`, measured 24/11/2026 (unique
playable tracks / artists / left at two a artist):

| Table          | Floor                          | Pool            |
| -------------- | ------------------------------ | --------------- |
| World (`null`) | 850k                           | 226 / 164 / 199 |
| France         | 850k                           | 297 / 219 / 266 |
| Portugal       | world 850k, its own at a fifth | 457 / 294 / 371 |

- Past 800k the rank no longer separates one hit from another (the editors'
  lists are hits already); 900k cuts _Freed From Desire_ and _Plus près des
  étoiles_ for nothing. France's playlists hold 71 tracks at 850k.
- Portugal's own playlists clear 200k with Xutos, GNR, Variações and
  Abrunhosa (231 tracks); 300k (118) is the fallback if a table finds it too
  deep. They also carry Brazilian and Cape Verdean rows — a listener's list.
- **The chart stays out.** `/chart/0` is geolocated on the caller (60 of 100
  in Top France from a French address) and today's — Jul, this week's
  releases — ranked 866k to 1M, so no floor tells it from a classic.
- Two Portuguese playlists hold 126 and 145 tracks: decade playlists are now
  asked for 200 (`DECADE_PLAYLIST_LIMIT`).

**Where the second starts**, on the decoded energy of 120 famous previews
(RMS per window against the preview's median; energy is a proxy for
"recognisable", not a measure of it):

| Offset | Full (≥ 0.7) | Quiet (< 0.35) |
| ------ | ------------ | -------------- |
| 0 s    | 88%          | 1%             |
| 2 s    | 92%          | 0%             |
| 10 s   | 97%          | 0%             |
| 12 s   | 98%          | 0%             |

Previews are already cut from the middle of the song and have no fade; the
misses at 0 are slow intros (_Hotel California_, _Creep_, _Skyfall_). Ten
seconds in (`FLASH_START_MS`) wins them back for three losses, none quiet;
a half-second window gives the same order.

## Verified

Muted (`melee:volume` `'0'` and `--mute-audio`), with `HTMLMediaElement`'s
`play`, `pause` and `currentTime` counted in an init script — the session
never hears a clip — on a console and a paired wall, 24 seats with 20-letter
names, a phone at 390 and the console at 390:

- The wall plays from 10.000 s and pauses at 11.013 s; the reveal resumes at
  11.013 s. The console as the speaker: 10.000 → 11.007 s.
- Reloaded past the window and pressed again: no play, no stall message; the
  reveal plays from 11.0 s (it played from 0 before the deck was left at the
  flash's end).
- Two seconds, the room paused at 11.12 s and let go 2.7 s later: resumed at
  11.12 s, stopped at 12.003 s.
- Filmed: the countdown dissolving into _Une seule écoute_ on the wall, and
  the setup's difficulty fold closing as the film scores are unticked.

<!-- cspell:words générale entend Durée timeupdate seule écoute près étoiles Xutos Verdean geolocated Variações Abrunhosa -->
