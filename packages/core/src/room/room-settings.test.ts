import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_BUZZER_SETTINGS,
  DEFAULT_GAME_SETTINGS,
  type GameKind,
  gameKinds
} from '@melee/protocol/game'
import { DEFAULT_MODE_SETTINGS, type RoomSettings } from '@melee/protocol/room'

import { offersAnswerMode } from './game-modes'
import {
  fittedToTeams,
  movedToGame,
  openedSetup,
  reshapesRound,
  roomSettingsFor
} from './room-settings'

const entries = (...games: GameKind[]) =>
  games.map((game) => DEFAULT_GAME_SETTINGS[game])

const kinds = (settings: RoomSettings): GameKind[] =>
  settings.lineUp.map((entry) => entry.kind)

describe('roomSettingsFor', () => {
  it('[room-settings] opens a room on the game it was created for', () => {
    expect(
      roomSettingsFor({ games: ['buzzer'], locale: 'fr' }).game?.kind
    ).toBe('buzzer')
  })

  // The front door creates the room and the table decides afterwards, so this
  // is the ordinary case rather than a half-built one.
  it('[room-settings] opens a room with no game on nothing to play', () => {
    expect(roomSettingsFor({ games: [], locale: 'fr' }).game).toBeNull()
  })

  // The pair travels together everywhere, and a room that opened on a mode its
  // own game refuses is one whose first "start" the server rejects.
  it('[room-settings] never opens a room on a mode its game does not offer', () => {
    for (const game of gameKinds) {
      const settings = roomSettingsFor({ games: [game], locale: 'fr' })

      expect(
        offersAnswerMode({ game: settings.game, mode: settings.mode.kind })
      ).toBe(true)
    }
  })

  // The two games that offer all three modes want different ones, and a single
  // room-wide default was serving the quiz a field where the room reads faster
  // than it types.
  it('[room-settings] opens each game on the mode it is played in', () => {
    expect(roomSettingsFor({ games: ['quiz'], locale: 'fr' }).mode).toEqual(
      DEFAULT_MODE_SETTINGS.choice
    )
    expect(
      roomSettingsFor({ games: ['blindtest'], locale: 'fr' }).mode
    ).toEqual(DEFAULT_MODE_SETTINGS.choice)
    expect(
      roomSettingsFor({ games: ['matchsticks'], locale: 'fr' }).mode
    ).toEqual(DEFAULT_MODE_SETTINGS.move)
  })

  it('[room-settings] ticks the one game a front door opens on, and none from the shelf', () => {
    const onTheQuiz = roomSettingsFor({ games: ['quiz'], locale: 'fr' })

    expect(onTheQuiz.lineUp).toEqual([onTheQuiz.game])
    expect(onTheQuiz.lineUpAt).toBe(0)
    expect(roomSettingsFor({ games: [], locale: 'fr' }).lineUp).toEqual([])
    expect(roomSettingsFor({ games: [], locale: 'fr' }).lineUpAt).toBeNull()
  })

  it('[room-settings] opens several ticked games as a line-up on the first, four rounds a game, the reveal held for the host', () => {
    const settings = roomSettingsFor({
      games: ['blindtest', 'quiz', 'buzzer'],
      locale: 'fr'
    })

    expect(settings.game?.kind).toBe('blindtest')
    expect(kinds(settings)).toEqual(['blindtest', 'quiz', 'buzzer'])
    expect(settings.lineUpAt).toBe(0)
    expect(settings.roundCount).toBe(12)
    expect(settings.autoAdvanceMs).toBeNull()
    expect(settings.teams).toEqual({ kind: 'off' })
    expect(settings.board).toEqual({ kind: 'off' })
    expect(settings.mode).toEqual(DEFAULT_MODE_SETTINGS.choice)
  })

  it('[room-settings] leaves a game with no natural end running until the host stops it', () => {
    expect(
      roomSettingsFor({ games: ['buzzer'], locale: 'fr' }).roundCount
    ).toBeNull()
    expect(
      roomSettingsFor({ games: ['blindtest'], locale: 'fr' }).roundCount
    ).toBe(10)
  })
})

describe('movedToGame', () => {
  const onTheBuzzer = roomSettingsFor({ games: ['buzzer'], locale: 'fr' })

  // The bug this exists for: a room that came from the bare buzzer used to land
  // on a blind test in buzzer mode, with no round limit — its own settings worn
  // by a game that has better ones.
  it('[room-settings] gives the new game its own mode and round count', () => {
    const moved = movedToGame({
      game: 'blindtest',
      locale: 'fr',
      remembered: null,
      settings: onTheBuzzer
    })

    expect(moved.mode).toEqual(DEFAULT_MODE_SETTINGS.choice)
    expect(moved.roundCount).toBe(10)
    expect(moved.game?.kind).toBe('blindtest')
  })

  it('[room-settings] moves a one-game line-up along with the game', () => {
    const moved = movedToGame({
      game: 'blindtest',
      locale: 'fr',
      remembered: null,
      settings: onTheBuzzer
    })

    expect(kinds(moved)).toEqual(['blindtest'])
  })

  it('[room-settings] switches inside an evening without ending it on the game’s own count', () => {
    const moved = movedToGame({
      game: 'quiz',
      locale: 'fr',
      remembered: null,
      settings: {
        ...onTheBuzzer,
        lineUp: entries('buzzer', 'quiz'),
        roundCount: 12
      }
    })

    expect(moved.game?.kind).toBe('quiz')
    expect(kinds(moved)).toEqual(['buzzer', 'quiz'])
    expect(moved.lineUpAt).toBe(1)
    expect(moved.roundCount).toBe(12)
  })

  it('[room-settings] lands an evening on the mode this host left the game on', () => {
    const moved = movedToGame({
      game: 'quiz',
      locale: 'fr',
      remembered: {
        ...openedSetup({ game: 'quiz', locale: 'fr' }),
        mode: DEFAULT_MODE_SETTINGS.buzzer
      },
      settings: { ...onTheBuzzer, lineUp: entries('buzzer', 'quiz') }
    })

    expect(moved.game?.kind).toBe('quiz')
    expect(moved.mode).toEqual(DEFAULT_MODE_SETTINGS.buzzer)
  })

  it('[room-settings] keeps the evening’s hold when the draw lands on a game with its own', () => {
    const moved = movedToGame({
      game: 'blindtest',
      locale: 'fr',
      remembered: null,
      settings: { ...onTheBuzzer, lineUp: entries('buzzer', 'blindtest') }
    })

    expect(moved.autoAdvanceMs).toBeNull()
  })

  it('[room-settings] goes to the entry an evening already ticks, on that entry’s own settings', () => {
    const onFilmScores = {
      ...DEFAULT_BLINDTEST_SETTINGS,
      source: { kind: 'film' }
    } as const
    const moved = movedToGame({
      game: 'blindtest',
      locale: 'fr',
      remembered: null,
      settings: {
        ...onTheBuzzer,
        lineUp: [DEFAULT_BUZZER_SETTINGS, onFilmScores]
      }
    })

    expect(moved.game).toEqual(onFilmScores)
    expect(moved.lineUpAt).toBe(1)
  })

  it('[room-settings] leaves the settings that are the host’s alone', () => {
    const moved = movedToGame({
      game: 'blindtest',
      locale: 'fr',
      remembered: null,
      settings: { ...onTheBuzzer, countdownMs: 10_000 }
    })

    expect(moved.countdownMs).toBe(10_000)
  })

  // Twenty-five seconds is what a quiz note takes to read aloud, and a reflex
  // race has nothing to read: the hold is the incoming game's, like the mode
  // and the round count beside it.
  it('[room-settings] does not carry the reveal hold onto the next game', () => {
    const moved = movedToGame({
      game: 'reflex',
      locale: 'fr',
      remembered: null,
      settings: { ...onTheBuzzer, autoAdvanceMs: 25_000 }
    })

    expect(moved.autoAdvanceMs).toBeNull()
  })

  it('[room-settings] narrows to the one mode a bare buzzer can serve', () => {
    const moved = movedToGame({
      game: 'buzzer',
      locale: 'fr',
      remembered: null,
      settings: roomSettingsFor({ games: ['blindtest'], locale: 'fr' })
    })

    expect(moved.mode.kind).toBe('buzzer')
  })

  // The one thing that may carry into a switch, and it comes from this host's
  // last evening on the incoming game rather than from the outgoing one.
  it('[room-settings] takes what the host last left this game set to', () => {
    const moved = movedToGame({
      game: 'blindtest',
      locale: 'fr',
      remembered: {
        autoAdvanceMs: 15_000,
        game: { ...DEFAULT_BLINDTEST_SETTINGS, difficulty: 'obscure' },
        mode: DEFAULT_MODE_SETTINGS.choice,
        roundCount: 30
      },
      settings: onTheBuzzer
    })

    expect(moved.autoAdvanceMs).toBe(15_000)
    expect(moved.mode).toEqual(DEFAULT_MODE_SETTINGS.choice)
    expect(moved.roundCount).toBe(30)
    expect(moved.game).toEqual({
      ...DEFAULT_BLINDTEST_SETTINGS,
      difficulty: 'obscure'
    })
  })
})

describe('a spoken black square and its teams', () => {
  const spokenInTeams: RoomSettings = {
    ...roomSettingsFor({ games: ['blacksquare'], locale: 'fr' }),
    mode: DEFAULT_MODE_SETTINGS.spoken,
    teams: { count: 2, kind: 'chosen' }
  }

  it('[room-settings] types the round once the teams that kept the list are gone', () => {
    const fitted = fittedToTeams({
      locale: 'fr',
      settings: { ...spokenInTeams, teams: { kind: 'off' } }
    })

    expect(fitted.mode).toEqual(DEFAULT_MODE_SETTINGS.typed)
  })

  it('[room-settings] keeps a spoken round its teams can play', () => {
    expect(
      fittedToTeams({ locale: 'fr', settings: spokenInTeams }).mode
    ).toEqual(DEFAULT_MODE_SETTINGS.spoken)
  })

  it('[room-settings] never restores a spoken round a room without teams cannot play', () => {
    const moved = movedToGame({
      game: 'blacksquare',
      locale: 'fr',
      remembered: {
        ...openedSetup({ game: 'blacksquare', locale: 'fr' }),
        mode: DEFAULT_MODE_SETTINGS.spoken
      },
      settings: roomSettingsFor({ games: ['quiz'], locale: 'fr' })
    })

    expect(moved.mode).toEqual(DEFAULT_MODE_SETTINGS.typed)
  })
})

describe('reshapesRound', () => {
  const blindtest: RoomSettings = {
    ...roomSettingsFor({ games: ['blindtest'], locale: 'fr' }),
    game: DEFAULT_BLINDTEST_SETTINGS
  }
  const buzzer: RoomSettings = {
    ...roomSettingsFor({ games: ['buzzer'], locale: 'fr' }),
    game: DEFAULT_BUZZER_SETTINGS
  }

  it('[room-settings] lets everything a round only reads later through', () => {
    expect(
      reshapesRound({
        from: blindtest,
        to: {
          ...blindtest,
          autoAdvanceMs: 8_000,
          countdownMs: 10_000,
          roundCount: null
        }
      })
    ).toBe(false)
  })

  it('[room-settings] lets a game setting the round does not stand on through', () => {
    expect(
      reshapesRound({
        from: blindtest,
        to: {
          ...blindtest,
          game: {
            ...DEFAULT_BLINDTEST_SETTINGS,
            difficulty: 'obscure',
            source: { kind: 'search', query: 'yacht rock' }
          }
        }
      })
    ).toBe(false)
  })

  // The round is stamped with the mode it opened on and scored from that copy,
  // so the room's setting is free to move on to the next round.
  it('[room-settings] lets the answer mode through to the next round', () => {
    expect(
      reshapesRound({
        from: blindtest,
        to: { ...blindtest, mode: DEFAULT_MODE_SETTINGS.typed }
      })
    ).toBe(false)
  })

  // The floor is stamped with its deadline when the buzz lands, so a window
  // moved while one is held decides the next floor, not the one being served.
  it('[room-settings] lets the answer window through under a held floor', () => {
    const onBuzzer: RoomSettings = {
      ...blindtest,
      mode: { answerWindowMs: 10_000, kind: 'buzzer' }
    }

    expect(
      reshapesRound({
        from: onBuzzer,
        to: { ...onBuzzer, mode: { answerWindowMs: null, kind: 'buzzer' } }
      })
    ).toBe(false)
  })

  it('[room-settings] stops the game the content is an arm of', () => {
    expect(reshapesRound({ from: blindtest, to: buzzer })).toBe(true)
  })

  it('[room-settings] lets the round clock through to the next round', () => {
    expect(
      reshapesRound({
        from: blindtest,
        to: {
          ...blindtest,
          game: { ...DEFAULT_BLINDTEST_SETTINGS, roundDurationMs: 10_000 }
        }
      })
    ).toBe(false)
  })

  // The bare buzzer's round has no clock at all, so both sides read `null` —
  // a comparison that would call every one of its rounds reshaped if the
  // absent duration were read as a difference.
  it('[room-settings] lets the lockout switch through on a game with no clock', () => {
    expect(
      reshapesRound({
        from: buzzer,
        to: {
          ...buzzer,
          game: { ...DEFAULT_BUZZER_SETTINGS, locksOutOnMiss: false }
        }
      })
    ).toBe(false)
  })
})
