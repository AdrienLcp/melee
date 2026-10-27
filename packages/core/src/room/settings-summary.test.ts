import { describe, expect, it } from 'vitest'

import { shelvedGames } from '@melee/protocol/game'

import { roomSettingsFor } from './room-settings'
import { settingsSummary } from './settings-summary'

describe('settingsSummary', () => {
  const blindtest = roomSettingsFor({ games: ['blindtest'], locale: 'fr' })

  it('[settings-summary] reads left to right, from the game down to how long the evening runs', () => {
    expect(settingsSummary({ draftSource: null, settings: blindtest })).toEqual(
      [
        { game: 'blindtest', kind: 'game' },
        { kind: 'source', source: 'all' },
        { kind: 'answerMode', mode: 'choice' },
        { count: 10, kind: 'roundCount' }
      ]
    )
  })

  // The picker commits on the launch, so the committed source is the *previous*
  // round's for as long as the fold is open.
  it('[settings-summary] shows the source being drafted over the one the room is running', () => {
    expect(
      settingsSummary({
        draftSource: { kind: 'search', query: 'yacht rock' },
        settings: blindtest
      })
    ).toContainEqual({ kind: 'source', source: 'search' })
  })

  it('[settings-summary] says nothing about a source in a game that serves none', () => {
    const parts = settingsSummary({
      draftSource: { kind: 'search', query: 'yacht rock' },
      settings: roomSettingsFor({ games: ['buzzer'], locale: 'fr' })
    })

    expect(parts.some((part) => part.kind === 'source')).toBe(false)
  })

  // A sheet's length is the whole of its setup, and the fold is closed.
  it('[settings-summary] names how many things a slate asks for', () => {
    expect(
      settingsSummary({
        draftSource: null,
        settings: roomSettingsFor({ games: ['slate'], locale: 'fr' })
      })
    ).toEqual([
      { game: 'slate', kind: 'game' },
      { count: 10, kind: 'itemCount' },
      { count: 1, kind: 'roundCount' }
    ])
  })

  it('[settings-summary] names how many answers a black square deals only when it is not nine', () => {
    const blackSquare = roomSettingsFor({
      games: ['blacksquare'],
      locale: 'fr'
    })
    const countsOf = (settings: typeof blackSquare) =>
      settingsSummary({ draftSource: null, settings }).filter(
        (part) => part.kind === 'answerCount'
      )

    expect(countsOf(blackSquare)).toEqual([])
    expect(
      countsOf({
        ...blackSquare,
        game:
          blackSquare.game?.kind === 'blacksquare'
            ? { ...blackSquare.game, answerCount: 5 }
            : blackSquare.game
      })
    ).toEqual([{ count: 5, kind: 'answerCount' }])
  })

  it('[settings-summary] names the map only when it asks for French cities', () => {
    const atlas = roomSettingsFor({ games: ['atlas'], locale: 'fr' })
    const placesOf = (settings: typeof atlas) =>
      settingsSummary({ draftSource: null, settings }).filter(
        (part) => part.kind === 'places'
      )

    expect(placesOf(atlas)).toEqual([])
    expect(
      placesOf({
        ...atlas,
        game: {
          direction: 'place',
          kind: 'atlas',
          places: ['countries', 'frenchCities'],
          roundDurationMs: 30_000
        }
      })
    ).toEqual([{ kind: 'places', places: ['countries', 'frenchCities'] }])
  })

  it('[settings-summary] says nothing about an answer mode the host was never offered', () => {
    const parts = settingsSummary({
      draftSource: null,
      settings: roomSettingsFor({ games: ['buzzer'], locale: 'fr' })
    })

    expect(parts.some((part) => part.kind === 'answerMode')).toBe(false)
  })

  // The two sets coincide today, so nothing here can exercise the other side of
  // the `isShelvedGame` filter. Dropping it is a compile error rather than a
  // red test — `SettingsSummaryPart` carries a `ShelvedGame`, and `game.kind`
  // is the whole vocabulary.
  it('[settings-summary] names every game the shelf can be opened on', () => {
    for (const game of shelvedGames) {
      expect(
        settingsSummary({
          draftSource: null,
          settings: roomSettingsFor({ games: [game], locale: 'fr' })
        })
      ).toContainEqual({ game, kind: 'game' })
    }
  })

  // The room is opened before the table decides, so the fold has to be honest
  // about a decision nobody has made rather than name a default.
  it('[settings-summary] says nothing about a game the room has not been given', () => {
    expect(
      settingsSummary({
        draftSource: null,
        settings: roomSettingsFor({ games: [], locale: 'fr' })
      })
    ).toEqual([{ count: 10, kind: 'roundCount' }])
  })

  it('[settings-summary] carries a game with no last round as a count of none', () => {
    expect(
      settingsSummary({
        draftSource: null,
        settings: roomSettingsFor({ games: ['buzzer'], locale: 'fr' })
      })
    ).toContainEqual({ count: null, kind: 'roundCount' })
  })
})
