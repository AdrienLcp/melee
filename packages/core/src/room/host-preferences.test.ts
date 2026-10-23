import { describe, expect, it } from 'vitest'

import { DEFAULT_TRACK_SETTINGS } from '@melee/protocol/board'
import { DEFAULT_BUZZER_SETTINGS } from '@melee/protocol/game'
import { DEFAULT_MODE_SETTINGS } from '@melee/protocol/room'

import {
  type HostPreferences,
  rememberedSetupFor,
  rememberSettings,
  restoredSettings
} from './host-preferences'
import { roomSettingsFor } from './room-settings'

const onTheQuiz = roomSettingsFor({ games: ['quiz'], locale: 'fr' })
const onNothing = roomSettingsFor({ games: [], locale: 'fr' })

describe('rememberSettings', () => {
  it('[host-preferences] files the room’s four game-owned fields under that game', () => {
    const remembered = rememberSettings({
      preferences: null,
      settings: {
        ...onTheQuiz,
        autoAdvanceMs: 25_000,
        mode: DEFAULT_MODE_SETTINGS.choice,
        roundCount: 20
      }
    })

    expect(remembered.games.quiz?.autoAdvanceMs).toBe(25_000)
    expect(remembered.games.quiz?.mode).toEqual(DEFAULT_MODE_SETTINGS.choice)
    expect(remembered.games.quiz?.roundCount).toBe(20)
    expect(remembered.games.quiz?.game.kind).toBe('quiz')
  })

  // The seam: what a game answers goes under that game, and what it does not is
  // the host's for every game after it.
  it('[host-preferences] keeps what no game answers outside every game', () => {
    const remembered = rememberSettings({
      preferences: null,
      settings: { ...onTheQuiz, countdownMs: 10_000 }
    })

    expect(remembered.room).toEqual({
      board: { kind: 'off' },
      countdownMs: 10_000,
      hasJudge: false,
      teams: { kind: 'off' }
    })
  })

  it('[host-preferences] leaves the other games it has learned alone', () => {
    const afterTheBuzzer = rememberSettings({
      preferences: null,
      settings: roomSettingsFor({ games: ['buzzer'], locale: 'fr' })
    })

    const afterTheQuiz = rememberSettings({
      preferences: afterTheBuzzer,
      settings: onTheQuiz
    })

    expect(afterTheQuiz.games.buzzer?.game.kind).toBe('buzzer')
    expect(afterTheQuiz.games.quiz?.game.kind).toBe('quiz')
  })

  // A room that has not been told what it is playing has nothing to file: its
  // mode and round count are the shell's placeholders, not the host's answer.
  it('[host-preferences] files nothing for a room still deciding', () => {
    const remembered = rememberSettings({
      preferences: null,
      settings: { ...onNothing, countdownMs: 5_000 }
    })

    expect(remembered.games).toEqual({})
    expect(remembered.room.countdownMs).toBe(5_000)
  })
})

describe('restoredSettings', () => {
  const preferences: HostPreferences = rememberSettings({
    preferences: null,
    settings: {
      ...onTheQuiz,
      autoAdvanceMs: 8_000,
      countdownMs: 10_000,
      mode: DEFAULT_MODE_SETTINGS.choice,
      roundCount: 20
    }
  })

  it('[host-preferences] applies what no game answers to a room still deciding', () => {
    const restored = restoredSettings({ preferences, settings: onNothing })

    expect(restored.countdownMs).toBe(10_000)
    expect(restored.game).toBeNull()
    // The hold was the quiz's, and this room has not been told what it plays.
    expect(restored.autoAdvanceMs).toBe(onNothing.autoAdvanceMs)
  })

  it('[host-preferences] applies a game’s own answers to a room already on it', () => {
    const restored = restoredSettings({ preferences, settings: onTheQuiz })

    expect(restored.autoAdvanceMs).toBe(8_000)
    expect(restored.mode).toEqual(DEFAULT_MODE_SETTINGS.choice)
    expect(restored.roundCount).toBe(20)
  })

  // The host played the quiz last time and opened this room on the buzzer: the
  // countdown is theirs, and everything the quiz answered is the quiz's.
  it('[host-preferences] applies nothing from a game the room is not playing', () => {
    const onTheBuzzer = roomSettingsFor({ games: ['buzzer'], locale: 'fr' })
    const restored = restoredSettings({ preferences, settings: onTheBuzzer })

    expect(restored.countdownMs).toBe(10_000)
    expect(restored.autoAdvanceMs).toBe(onTheBuzzer.autoAdvanceMs)
    expect(restored.mode).toEqual(onTheBuzzer.mode)
    expect(restored.roundCount).toBe(onTheBuzzer.roundCount)
  })

  // The door reads the question language off the host's interface, and nothing
  // remembered it — so the room keeps what it opened on rather than losing it to
  // an absent preference.
  it('[host-preferences] leaves a field nobody remembered as the door set it', () => {
    const inEnglish = roomSettingsFor({ games: ['quiz'], locale: 'en' })
    const restored = restoredSettings({
      preferences: { games: {}, room: preferences.room },
      settings: inEnglish
    })

    expect(restored.game).toEqual(inEnglish.game)
  })
})

describe('rememberedSetupFor', () => {
  it('[host-preferences] has nothing for a host who has never played', () => {
    expect(rememberedSetupFor({ game: 'quiz', preferences: null })).toBeNull()
  })

  it('[host-preferences] has nothing for a game this host has not played', () => {
    const preferences = rememberSettings({
      preferences: null,
      settings: onTheQuiz
    })

    expect(rememberedSetupFor({ game: 'slate', preferences })).toBeNull()
  })

  // This is read back out of the browser's own storage, so a key and the arm
  // under it can disagree. Trusting it would have the host press Quiz and get a
  // bare buzzer.
  it('[host-preferences] refuses an arm that contradicts the game it is filed under', () => {
    const preferences: HostPreferences = {
      games: {
        quiz: {
          autoAdvanceMs: null,
          game: DEFAULT_BUZZER_SETTINGS,
          mode: DEFAULT_MODE_SETTINGS.buzzer,
          roundCount: null
        }
      },
      room: {
        board: { kind: 'off' },
        countdownMs: 3_000,
        hasJudge: false,
        teams: { kind: 'off' }
      }
    }

    expect(rememberedSetupFor({ game: 'quiz', preferences })).toBeNull()
  })
})

describe('a table of several games', () => {
  const evening = roomSettingsFor({
    games: ['quiz', 'blindtest', 'buzzer'],
    locale: 'fr'
  })

  const teamsHost: HostPreferences = rememberSettings({
    preferences: null,
    settings: {
      ...onTheQuiz,
      board: DEFAULT_TRACK_SETTINGS,
      hasJudge: true,
      roundCount: 20,
      teams: { count: 3, kind: 'drawn' }
    }
  })

  it('[host-preferences] lays the host’s teams, track and judge over a table of several games', () => {
    const restored = restoredSettings({
      preferences: teamsHost,
      settings: evening
    })

    expect(restored.teams).toEqual({ count: 3, kind: 'drawn' })
    expect(restored.board).toEqual(DEFAULT_TRACK_SETTINGS)
    expect(restored.hasJudge).toBe(true)
    expect(restored.lineUp.map((entry) => entry.kind)).toEqual([
      'quiz',
      'blindtest',
      'buzzer'
    ])
    expect(restored.lineUp[0]).toEqual(restored.game)
  })

  it('[host-preferences] keeps the table’s own length over the host’s last game of one', () => {
    const restored = restoredSettings({
      preferences: teamsHost,
      settings: evening
    })

    expect(restored.roundCount).toBe(evening.roundCount)
    expect(restored.autoAdvanceMs).toBe(evening.autoAdvanceMs)
  })

  it('[host-preferences] keeps the door’s teams when the host’s would refuse a game ticked', () => {
    const aloudHost = rememberSettings({
      preferences: null,
      settings: { ...onTheQuiz, teams: { count: 2, kind: 'aloud' } }
    })

    const restored = restoredSettings({
      preferences: aloudHost,
      settings: roomSettingsFor({ games: ['quiz', 'slate'], locale: 'fr' })
    })

    expect(restored.teams).toEqual({ kind: 'off' })
  })

  it('[host-preferences] keeps the mode a host judged a game on through a table with no judge', () => {
    const buzzerQuizHost = rememberSettings({
      preferences: null,
      settings: { ...onTheQuiz, mode: DEFAULT_MODE_SETTINGS.buzzer }
    })

    const afterTheEvening = rememberSettings({
      preferences: buzzerQuizHost,
      settings: restoredSettings({
        preferences: buzzerQuizHost,
        settings: evening
      })
    })

    expect(afterTheEvening.games.quiz?.mode).toEqual(
      DEFAULT_MODE_SETTINGS.buzzer
    )
  })

  it('[host-preferences] plays the table’s quiz on four candidates for a host who last judged one aloud', () => {
    const buzzerQuizHost = rememberSettings({
      preferences: null,
      settings: { ...onTheQuiz, mode: DEFAULT_MODE_SETTINGS.buzzer }
    })

    const restored = restoredSettings({
      preferences: buzzerQuizHost,
      settings: evening
    })

    expect(restored.game?.kind).toBe('quiz')
    expect(restored.mode).toEqual(DEFAULT_MODE_SETTINGS.choice)
  })

  it('[host-preferences] files the teams, the track and the judge of a table of several games', () => {
    const remembered = rememberSettings({
      preferences: null,
      settings: {
        ...evening,
        board: DEFAULT_TRACK_SETTINGS,
        hasJudge: true,
        teams: { count: 2, kind: 'chosen' }
      }
    })

    expect(remembered.room.teams).toEqual({ count: 2, kind: 'chosen' })
    expect(remembered.room.board).toEqual(DEFAULT_TRACK_SETTINGS)
    expect(remembered.room.hasJudge).toBe(true)
    expect(remembered.room).not.toHaveProperty('lineUp')
    expect(remembered.room).not.toHaveProperty('lineUpAt')
  })

  it('[host-preferences] files neither the length nor the hold of a table of several games', () => {
    const remembered = rememberSettings({
      preferences: teamsHost,
      settings: evening
    })

    expect(remembered.games.quiz?.roundCount).toBe(20)
  })
})
