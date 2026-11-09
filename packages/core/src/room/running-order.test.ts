import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS } from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type LineUpDeal,
  type RoomSettings
} from '@melee/protocol/room'

import { offersAnswerMode } from './game-modes'
import {
  comingRounds,
  dealtOrder,
  orderWithEntryNext,
  rewoundToFirstRow,
  scheduledEntryAt
} from './running-order'

const lineUp = [
  DEFAULT_GAME_SETTINGS.quiz,
  DEFAULT_GAME_SETTINGS.challenge,
  DEFAULT_GAME_SETTINGS.blindtest,
  DEFAULT_GAME_SETTINGS.slate
]

const ROLLS = [0, 0.34, 0.5, 0.67, 0.99]

const drawnAt = ({
  deals = [],
  lastAt = null,
  order,
  played = lineUp.map(() => 0),
  repeatsOrder = false,
  roll = 0,
  roundAt
}: {
  deals?: readonly LineUpDeal[]
  lastAt?: number | null
  order: RoomSettings['runningOrder']
  played?: readonly number[]
  repeatsOrder?: boolean
  roll?: number
  roundAt: number
}) =>
  scheduledEntryAt({
    deals,
    lastAt,
    lineUp,
    order,
    played,
    random: () => roll,
    repeatsOrder,
    roundAt,
    roundsLeft: null
  })

describe('scheduledEntryAt', () => {
  it('[running-order] plays the entry the host put on the round', () => {
    expect(drawnAt({ order: [3, 1, 0], roundAt: 0 })).toBe(3)
    expect(drawnAt({ order: [3, 1, 0], roundAt: 1 })).toBe(1)
  })

  it('[running-order] closes up on the next row when the round’s row is a hole', () => {
    expect(drawnAt({ order: [0, null, 3, 1], roundAt: 1 })).toBe(3)
  })

  it('[running-order] draws a round with no row left among the entries serving their own content', () => {
    for (const roll of ROLLS) {
      expect([0, 2]).toContain(drawnAt({ order: [null], roll, roundAt: 0 }))
    }
  })

  it('[chance-pool] draws past the rows among the entries the host put in the draw', () => {
    for (const roll of ROLLS) {
      expect(
        drawnAt({
          deals: ['row', 'row', 'chance'],
          order: [null],
          roll,
          roundAt: 0
        })
      ).toBe(2)
    }
  })

  it('[chance-pool] never draws an entry kept to its row, though it serves its own content', () => {
    for (const roll of ROLLS) {
      expect(drawnAt({ deals: ['row'], order: [null], roll, roundAt: 0 })).toBe(
        2
      )
    }
  })

  it('[chance-pool] draws from every entry when the draw holds none', () => {
    const everyRow: LineUpDeal[] = ['row', 'row', 'row', 'row']

    expect(
      ROLLS.map((roll) =>
        drawnAt({ deals: everyRow, order: [null], roll, roundAt: 0 })
      )
    ).not.toContain(null)
  })

  it('[chance-pool] passes over a row whose entry is in the draw alone', () => {
    expect(
      drawnAt({ deals: ['both', 'row', 'chance'], order: [2, 1], roundAt: 0 })
    ).toBe(1)
  })

  it('[running-order] draws every round past the order’s end', () => {
    for (const roll of ROLLS) {
      expect([0, 2]).toContain(
        drawnAt({
          lastAt: 3,
          order: [1, 3],
          played: [0, 1, 0, 1],
          roll,
          roundAt: 2
        })
      )
    }
  })

  it('[running-order] leaves a row whose entry is played out to chance', () => {
    expect(
      drawnAt({ order: [1, 1], played: [0, 1, 0, 0], roundAt: 1 })
    ).not.toBe(1)
  })

  it('[running-order] leaves a row whose entry is gone to chance', () => {
    expect(drawnAt({ order: [7], roundAt: 0 })).not.toBeNull()
  })

  it('[running-order] draws past the rows the game played longest ago', () => {
    const fourGames = [
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.blindtest,
      DEFAULT_GAME_SETTINGS.atlas,
      DEFAULT_GAME_SETTINGS.reflex
    ]

    for (const roll of ROLLS) {
      expect(
        scheduledEntryAt({
          deals: ['both', 'both', 'both', 'chance'],
          lastAt: 3,
          lineUp: fourGames,
          order: [0, 1, 2, 3],
          played: [1, 1, 1, 1],
          random: () => roll,
          repeatsOrder: false,
          roundAt: 4,
          roundsLeft: null
        })
      ).toBe(0)
    }
  })

  it('[chance-pool] spaces the draw past the rows among the entries in the draw alone', () => {
    const fourGames = [
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.blindtest,
      DEFAULT_GAME_SETTINGS.atlas,
      DEFAULT_GAME_SETTINGS.reflex
    ]

    for (const roll of ROLLS) {
      expect(
        scheduledEntryAt({
          deals: ['row', 'chance', 'both', 'chance'],
          lastAt: 3,
          lineUp: fourGames,
          order: [0, 1, 2, 3],
          played: [1, 1, 1, 1],
          random: () => roll,
          repeatsOrder: false,
          roundAt: 4,
          roundsLeft: null
        })
      ).toBe(1)
    }
  })
})

describe('rewoundToFirstRow', () => {
  const playedThrough: RoomSettings = {
    ...DEFAULT_ROOM_SETTINGS,
    game: DEFAULT_GAME_SETTINGS.slate,
    lineUp,
    lineUpAt: 3,
    mode: DEFAULT_MODE_SETTINGS.buzzer,
    runningOrder: [2, 0, 1, 3]
  }

  it('[running-order] plays a replay on the order it had, from its first row', () => {
    const rewound = rewoundToFirstRow(playedThrough)

    expect(rewound.lineUpAt).toBe(2)
    expect(rewound.game).toEqual(DEFAULT_GAME_SETTINGS.blindtest)
    expect(
      dealtOrder({
        deals: rewound.lineUpDeals,
        drawnAt: rewound.lineUpAt,
        lineUp,
        order: rewound.runningOrder,
        played: lineUp.map(() => 0),
        random: () => 0,
        upcoming: 0
      })
    ).toEqual([2, 0, 1, 3])
  })

  it('[running-order] plays a replay once round each entry, however long the evening ran', () => {
    const rewound = rewoundToFirstRow({
      ...playedThrough,
      runningOrder: [2, 0, 1, 3, 0, 2, 0]
    })

    expect(
      dealtOrder({
        deals: rewound.lineUpDeals,
        drawnAt: rewound.lineUpAt,
        lineUp,
        order: rewound.runningOrder,
        played: lineUp.map(() => 0),
        random: () => 0,
        upcoming: 0
      })
    ).toEqual([2, 0, 1, 3])
  })

  it('[running-order] opens a replay on a mode its first game offers', () => {
    const rewound = rewoundToFirstRow({
      ...playedThrough,
      mode: DEFAULT_MODE_SETTINGS.order,
      runningOrder: [0, 2, 1, 3]
    })

    expect(rewound.game).toEqual(DEFAULT_GAME_SETTINGS.quiz)
    expect(
      offersAnswerMode({
        game: DEFAULT_GAME_SETTINGS.quiz,
        mode: rewound.mode.kind
      })
    ).toBe(true)
  })

  it('[running-order] leaves an evening with no order to be dealt afresh', () => {
    const rewound = rewoundToFirstRow({ ...playedThrough, runningOrder: [] })

    expect(rewound.lineUpAt).toBe(3)
    expect(rewound.runningOrder).toEqual([])
  })
})

describe('scheduledEntryAt, playing the order again', () => {
  const playedOnce = [1, 1, 1, 1]

  it('[repeat-order] starts the order again from its top past its end', () => {
    expect(
      drawnAt({
        lastAt: 3,
        order: [2, 0, 1, 3],
        played: playedOnce,
        repeatsOrder: true,
        roundAt: 4
      })
    ).toBe(2)
  })

  it('[repeat-order] passes over an entry the host brought, once played', () => {
    expect(
      drawnAt({
        lastAt: 3,
        order: [3, 1, 2, 0],
        played: playedOnce,
        repeatsOrder: true,
        roundAt: 4
      })
    ).toBe(2)
  })

  it('[repeat-order] goes on after a game picked by hand rather than starting over', () => {
    expect(
      drawnAt({
        lastAt: 0,
        order: [0, 1, 2, 3],
        played: playedOnce,
        repeatsOrder: true,
        roundAt: 4
      })
    ).toBe(2)
  })

  it('[repeat-order] draws past the end once an entry is kept to the draw', () => {
    expect(
      drawnAt({
        deals: ['both', 'row', 'chance', 'row'],
        lastAt: 3,
        order: [0, 1, 3],
        played: [1, 1, 0, 1],
        repeatsOrder: true,
        roundAt: 3
      })
    ).toBe(2)
  })

  it('[repeat-order] goes round the order the server dealt, round after round', () => {
    const games = [
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.blindtest,
      DEFAULT_GAME_SETTINGS.reflex
    ]
    const random = () => 0
    const played = games.map(() => 0)
    let order = dealtOrder({
      deals: [],
      drawnAt: null,
      lineUp: games,
      order: [],
      played,
      random,
      upcoming: 0
    })
    const plan = order.filter((row) => row !== null)
    const sequence: number[] = []
    let at = plan[0] ?? null

    for (
      let roundAt = 0;
      roundAt < 3 * games.length && at !== null;
      roundAt += 1
    ) {
      sequence.push(at)
      played[at] = (played[at] ?? 0) + 1
      at = scheduledEntryAt({
        deals: [],
        lastAt: at,
        lineUp: games,
        order,
        played,
        random,
        repeatsOrder: true,
        roundAt: roundAt + 1,
        roundsLeft: null
      })
      order = dealtOrder({
        deals: [],
        drawnAt: at,
        lineUp: games,
        order,
        played,
        random,
        upcoming: roundAt + 1
      })
    }

    expect(plan).toHaveLength(games.length)
    expect(sequence).toEqual([...plan, ...plan, ...plan])
  })
})

describe('dealtOrder', () => {
  const dealt = ({
    deals = [],
    drawnAt = null,
    order = [],
    played = lineUp.map(() => 0),
    roll,
    upcoming = 0
  }: {
    deals?: readonly LineUpDeal[]
    drawnAt?: number | null
    order?: RoomSettings['runningOrder']
    played?: readonly number[]
    roll: number
    upcoming?: number
  }) =>
    dealtOrder({
      deals,
      drawnAt,
      lineUp,
      order,
      played,
      random: () => roll,
      upcoming
    })

  it('[running-order] deals one row per entry, the next one first', () => {
    for (const roll of ROLLS) {
      const order = dealt({ drawnAt: 2, roll })

      expect(order[0]).toBe(2)
      expect(order.toSorted()).toEqual([0, 1, 2, 3])
    }
  })

  it('[running-order] keeps the host’s rows in order, closes the holes and adds the entries owed', () => {
    for (const roll of ROLLS) {
      const order = dealt({ drawnAt: 2, order: [2, null, 1, null], roll })

      expect(order.slice(0, 2)).toEqual([2, 1])
      expect(order.slice(2).toSorted()).toEqual([0, 3])
    }
  })

  it('[running-order] drops a second row for one entry', () => {
    expect(dealt({ drawnAt: 0, order: [0, 2, 0, 2, 1], roll: 0 })).toEqual([
      0, 2, 1, 3
    ])
  })

  it('[running-order] drops the row of an entry the host brought once it is played', () => {
    for (const roll of ROLLS) {
      const order = dealt({
        order: [1, 1, 0],
        played: [0, 1, 0, 0],
        roll,
        upcoming: 1
      })

      expect(order.slice(0, 2)).toEqual([1, 0])
      expect(order.slice(2).toSorted()).toEqual([2, 3])
    }
  })

  it('[running-order] gives no new row to an entry already played', () => {
    expect(
      dealt({ order: [0], played: [1, 0, 0, 0], roll: 0, upcoming: 1 })
        .slice(1)
        .toSorted()
    ).toEqual([1, 2, 3])
    expect(
      dealt({ order: [0, 1, 2, 3], played: [1, 1, 1, 1], roll: 0, upcoming: 4 })
    ).toEqual([0, 1, 2, 3])
  })

  it('[chance-pool] gives no row to an entry in the draw alone', () => {
    for (const roll of ROLLS) {
      expect(
        dealt({ deals: ['both', 'row', 'chance'], drawnAt: 0, roll }).toSorted()
      ).toEqual([0, 1, 3])
    }
  })

  it('[chance-pool] keeps the round about to open on an entry drawn from the draw alone', () => {
    for (const roll of ROLLS) {
      const order = dealt({
        deals: ['both', 'row', 'chance'],
        drawnAt: 2,
        order: [2, 1, 0, 3],
        roll
      })

      expect(order).toEqual([2, 1, 0, 3])
    }
  })

  it('[running-order] holds nothing for a single entry', () => {
    expect(
      dealtOrder({
        deals: [],
        drawnAt: 0,
        lineUp: [DEFAULT_GAME_SETTINGS.quiz],
        order: [0, 0],
        played: [0],
        random: () => 0,
        upcoming: 0
      })
    ).toEqual([])
  })
})

describe('comingRounds', () => {
  it('[running-order] starts on the next round’s entry whatever its row says', () => {
    expect(
      comingRounds({
        drawnAt: 3,
        order: [null, 0, 1, 2],
        roundCount: 4,
        upcoming: 1
      }).map((round) => round.at)
    ).toEqual([3, 1, 2])
  })

  it('[running-order] marks the rows past the count', () => {
    expect(
      comingRounds({ drawnAt: 0, order: [0, 1, 3], roundCount: 2, upcoming: 0 })
    ).toEqual([
      { at: 0, isPastTheEnd: false, roundAt: 0 },
      { at: 1, isPastTheEnd: false, roundAt: 1 },
      { at: 3, isPastTheEnd: true, roundAt: 2 }
    ])
  })
})

describe('orderWithEntryNext', () => {
  it('[running-order] swaps the entry put first with the one that was there', () => {
    expect(
      orderWithEntryNext({ at: 2, order: [0, 1, 2, null], upcoming: 1 })
    ).toEqual([0, 2, 1, null])
  })

  it('[running-order] gives the displaced entry the first chance round when the other had no row', () => {
    expect(
      orderWithEntryNext({ at: 3, order: [0, 1, 2, null], upcoming: 1 })
    ).toEqual([0, 3, 2, 1])
  })
})
