import { describe, expect, it } from 'vitest'

import { currentDeadline, markSecond, type TimedView } from './last-seconds'

const ROUND_ID = 'round-1'

type PetitBacState = {
  sheetsClosed: boolean
  stopClosesAtElapsedMs: number | null
}

const petitBacRound = ({
  sheetsClosed,
  stopClosesAtElapsedMs
}: PetitBacState): NonNullable<TimedView['round']> => ({
  activeBuzz: null,
  content: {
    barredStopperIds: [],
    categories: ['Animal', 'Fruit', 'Pays'].map((label) => ({
      kind: 'own',
      label
    })),
    categoryStates: ['open', 'open', 'open'],
    kind: 'petitbac',
    letter: 'B',
    lines: [null, null, null],
    rows: null,
    sheetsClosed,
    stopClosesAtElapsedMs,
    stoppedBy: null,
    stopsWhenFull: true,
    votesDone: [],
    yourRefusals: [],
    yourSheet: null
  },
  durationMs: 60_000,
  id: ROUND_ID,
  startsAt: 0
})

const playing = (
  round: NonNullable<TimedView['round']>,
  roundElapsedMs: number
): TimedView => ({
  isHostConnected: true,
  isPaused: false,
  phase: 'playing',
  round,
  roundElapsedMs
})

describe('currentDeadline', () => {
  it('[clock] counts a timed round down to its duration', () => {
    const view = playing(
      {
        activeBuzz: null,
        content: { kind: 'buzzer' },
        durationMs: 20_000,
        id: ROUND_ID,
        startsAt: 0
      },
      12_000
    )

    expect(currentDeadline({ clock: null, view })).toEqual({
      id: `round:${ROUND_ID}:clock`,
      kind: 'round',
      remainingMs: 8_000
    })
  })

  it('[clock] counts a Petit Bac down to its stop rather than its clock', () => {
    const view = playing(
      petitBacRound({ sheetsClosed: false, stopClosesAtElapsedMs: 30_000 }),
      27_000
    )

    expect(currentDeadline({ clock: null, view })).toEqual({
      id: `round:${ROUND_ID}:stop:30000`,
      kind: 'round',
      remainingMs: 3_000
    })
  })

  it('[clock] stops counting once the Petit Bac sheets close, though its clock runs on through the vote', () => {
    const view = playing(
      petitBacRound({ sheetsClosed: true, stopClosesAtElapsedMs: 30_000 }),
      57_000
    )

    expect(currentDeadline({ clock: null, view })).toBeNull()
  })

  it('[clock] counts nothing down while the room is paused', () => {
    const view = {
      ...playing(
        petitBacRound({ sheetsClosed: false, stopClosesAtElapsedMs: null }),
        10_000
      ),
      isPaused: true
    }

    expect(currentDeadline({ clock: null, view })).toBeNull()
  })
})

describe('markSecond', () => {
  it('[clock] ticks a second that has only just begun', () => {
    expect(
      markSecond({
        fromSecond: 5,
        leftMs: 2_990,
        markedSecond: Number.POSITIVE_INFINITY
      })
    ).toEqual({ kind: 'tick', second: 3 })
  })

  it('[clock] lets a second already half gone go by silent, so it never crowds the next tick', () => {
    expect(
      markSecond({
        fromSecond: 5,
        leftMs: 2_600,
        markedSecond: Number.POSITIVE_INFINITY
      })
    ).toEqual({ kind: 'silent', second: 3 })
  })

  it('[clock] marks a second once, however many times it is read', () => {
    expect(
      markSecond({ fromSecond: 5, leftMs: 2_400, markedSecond: 3 })
    ).toEqual({ kind: 'same' })
  })

  it('[clock] keeps a second before the last ones silent', () => {
    expect(
      markSecond({ fromSecond: 5, leftMs: 6_000, markedSecond: 7 })
    ).toEqual({ kind: 'silent', second: 6 })
  })

  it('[clock] ends at nought', () => {
    expect(markSecond({ fromSecond: 5, leftMs: 0, markedSecond: 1 })).toEqual({
      kind: 'end'
    })
  })
})
