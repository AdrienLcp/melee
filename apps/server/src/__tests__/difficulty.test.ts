import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_ESTIMATE_SETTINGS,
  DEFAULT_HIGHER_LOWER_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  type GameSettings
} from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'

import { isFamousQuantity } from '@/infrastructure/questions/famous-quantities'
import {
  bankedPrices,
  bankedQuantities,
  tierOfQuantity
} from '@/infrastructure/questions/quantity-bank'
import { bankedQuestions } from '@/infrastructure/questions/question-bank'

import { startRoomHarness } from './node-room-harness'
import {
  hostQuestion,
  hostView,
  type RoomHarness,
  waitFor
} from './room-harness'

/** Enough rooms that a level read off the room rather than the frame would show. */
const ROOMS_A_GAME = 4

/**
 * Built while vitest collects the file: parsing the bank takes over a second,
 * and paid inside the test it ran past the test's timeout under a full run.
 */
const HEARD_OF_IDS = new Set(
  bankedQuestions()
    .filter((question) => question.isWellKnown)
    .map((question) => question.id)
)

let harness: RoomHarness

beforeEach(async () => {
  harness = await startRoomHarness()
})

afterEach(async () => {
  await harness.stop()
})

const roomAt = ({
  game,
  mode
}: {
  game: GameSettings
  mode: RoomSettings['mode']
}): RoomSettings => ({
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game,
  mode
})

const firstRoundOf = async (settings: RoomSettings) => {
  const { code, host } = await harness.openRoom(settings)

  await harness.seat({ code, nickname: 'Zoe' })
  host.send({ type: 'host.startRound' })
  await waitFor(
    () => hostView(host)?.phase === 'playing',
    'the first round to go up'
  )

  return host
}

describe('a room set to easy by frame', () => {
  it('[difficulty] deals the quiz only questions a room has heard of', async () => {
    for (let room = 0; room < ROOMS_A_GAME; room++) {
      const host = await firstRoundOf(
        roomAt({
          game: { ...DEFAULT_QUIZ_SETTINGS, difficulty: 'easy' },
          mode: DEFAULT_MODE_SETTINGS.choice
        })
      )

      expect(HEARD_OF_IDS.has(hostQuestion(host)?.id ?? '')).toBe(true)
    }
  }, 15_000)

  it('[difficulty] asks the estimate only for famous quantities', async () => {
    for (let room = 0; room < ROOMS_A_GAME; room++) {
      const host = await firstRoundOf(
        roomAt({
          game: { ...DEFAULT_ESTIMATE_SETTINGS, difficulty: 'easy' },
          mode: DEFAULT_MODE_SETTINGS.number
        })
      )
      const content = hostView(host)?.round?.content

      const question =
        content?.kind === 'estimate' && content.question.kind === 'bank'
          ? content.question
          : null
      const row = [...bankedQuantities(), ...bankedPrices()].find(
        ({ family, names }) =>
          family === question?.family && names.fr === question.names.fr
      )

      expect(
        row === undefined ? null : tierOfQuantity({ homeCountry: null, row })
      ).toBe('easy')
    }
  })

  it('[difficulty] pairs only famous quantities in higher or lower', async () => {
    for (let room = 0; room < ROOMS_A_GAME; room++) {
      const host = await firstRoundOf(
        roomAt({
          game: { ...DEFAULT_HIGHER_LOWER_SETTINGS, difficulty: 'easy' },
          mode: DEFAULT_MODE_SETTINGS.pairs
        })
      )
      const content = hostView(host)?.round?.content
      const pairs = content?.kind === 'higherlower' ? content.pairs : []

      expect(pairs.length).toBeGreaterThan(0)
      expect(
        pairs.every(({ ask, left, right }) => {
          if (ask.kind !== 'bank' || ask.family === 'price.item') {
            return false
          }

          const { family } = ask

          return [left, right].every((names) =>
            isFamousQuantity({
              country: 'FRA',
              entity: '',
              family,
              names: { fr: names.fr }
            })
          )
        })
      ).toBe(true)
    }
  })
})
