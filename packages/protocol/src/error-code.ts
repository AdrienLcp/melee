import { z } from 'zod'

export const protocolErrorCodes = [
  'room_not_found',
  'room_full',
  'room_closed',
  /**
   * The host taking a seat back. Fatal like `room_closed`, and the one exit a
   * player does not choose — so it is the one that has to be said out loud, or
   * a screen holding a `youId` the roster no longer has simply stops counting.
   * It voids the seat too: the room is still there, and a claim replayed on the
   * next reload would walk straight back in.
   */
  'removed_by_host',
  'nickname_taken',
  'invalid_message',
  'protocol_version_mismatch',
  'host_already_connected',
  /**
   * A second console arriving in the seconds after the first one's socket died.
   * Its own code rather than `host_already_connected`, because nobody is
   * connected and the two ask for different things: one says the room is taken,
   * this one says waiting will do — a lid closing and a Wi-Fi blink both land
   * here, and the room is handed over anyway once the window runs out.
   */
  'host_reconnecting',
  'host_only_action',
  /**
   * A wall without the room's token. Fatal: the wall carries the clip, whose
   * URL names the track, so it is not something the room code alone opens —
   * the screen has to be paired by the host's device first.
   */
  'wall_not_paired',
  /**
   * The console let this wall go. Fatal, so it stops reconnecting on the token
   * it still holds; the screen goes back to offering a pairing code.
   */
  'wall_dismissed',
  /** A wall pairing code that expired, was collected, or never existed. */
  'pairing_not_found',
  /**
   * A frame from the floor while the room has no console. The host's browser is
   * the speaker and the judge, so their leaving freezes every timer — but a
   * frozen round the floor can still fill in is not frozen: everyone answering
   * satisfies `everyoneIsDone`, closes the round and arms the next clip for a
   * screen that is not there to play it. The player's screen already draws
   * the pause; this is the server saying the same thing, which is the half
   * that decides.
   */
  'host_away',
  'wrong_phase',
  'stale_round',
  'already_buzzed',
  'player_locked_out',
  /**
   * A press that beat the screen it was reacting to, or landed inside the
   * hundred milliseconds after it that no human reaction fits into. Its own code
   * rather than `player_locked_out`, even though the lockout is exactly what it
   * causes: the player has to be told *too early* rather than *you already
   * missed*, or a player who jumped the gun reads it as the game being broken.
   */
  'false_start',
  /**
   * A frame from a client that took its seat after the round was under way. It
   * keeps the seat and plays from the next round; the screen is what stops it
   * acting in this one, and this is the backstop behind that — a socket is
   * whatever its owner makes it.
   */
  'joined_mid_round',
  /**
   * An answer from a seat a duel did not draw. Its own code rather than
   * `joined_mid_round`: the seat was there all along, and the screen owes it a
   * wait for the duel to end rather than an apology for arriving late.
   */
  'not_your_turn',
  /**
   * A matchstick move the sticks cannot make: no stick where it was lifted, a
   * stick already where it was laid, or a glyph left that is no digit or sign.
   * Its own code rather than `invalid_message`, and it spends nothing — the
   * frame was well formed, and the player still has their one move to make.
   */
  'illegal_move',
  /**
   * A round was asked for in a room whose game nobody has picked yet. Its own
   * code rather than `wrong_phase`, because the phase is right — the lobby is
   * exactly where this happens — and what is missing is a decision the host can
   * make on the screen they are looking at.
   */
  'no_game_chosen',
  /**
   * A team frame the room's teams do not allow now: a draw or a switch once
   * the game is under way, a pick in a room the console deals out, a seat or a
   * team that is not there.
   */
  'teams_locked',
  /**
   * A phone asking for a seat in a room whose teams answer aloud. Non-fatal
   * like `room_full`: nothing is wrong with the screen, the table simply plays
   * without one, and the host can switch the room back in the lobby.
   */
  'room_plays_aloud',
  /**
   * A spoken guess-nine round asked of a room where fewer than two teams hold
   * a connected seat: one team guesses and a seat of another keeps the list,
   * so the round cannot open until the teams are filled.
   */
  'spoken_needs_two_teams',
  /**
   * A Petit Bac stop from a sheet with a line still blank. Its own code: the
   * seat can act on it — one more word and the stop is theirs.
   */
  'sheet_not_full',
  'no_content_available',
  'music_source_unavailable',
  'rate_limited',
  'internal_error'
] as const

export const protocolErrorCodeSchema = z.enum(protocolErrorCodes)

export type ProtocolErrorCode = z.infer<typeof protocolErrorCodeSchema>
