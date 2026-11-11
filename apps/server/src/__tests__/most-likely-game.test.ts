import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_MOST_LIKELY_SETTINGS } from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'
import type {
  HostServerMessage,
  PlayerServerMessage
} from '@melee/protocol/server-message'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

const LINE = {
  en: 'Who is most likely to sing?',
  fr: 'Qui a le plus de chances de chanter ?'
}

vi.mock(
  '@/infrastructure/questions/most-likely-bank',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/infrastructure/questions/most-likely-bank')
    >()),
    drawMostLikelyLine: () => ({ id: 'sing', labels: LINE })
  })
)

const MOST_LIKELY: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_MOST_LIKELY_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.vote,
  roundCount: 3
}

const mostLikelyRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'mostlikely' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'mostlikely' ? content : null
}

let harness: RoomHarness

beforeEach(async () => {
  harness = await startRoomHarness()
})

afterEach(async () => {
  await harness.stop()
})

const idOf = (seat: Peer<PlayerServerMessage>): string => {
  const id = playerView(seat)?.youId

  if (id == null) {
    throw new Error('The seat has no id')
  }

  return id
}

const roundInPlay = async () => {
  const { code, host } = await harness.openRoom(MOST_LIKELY)
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const ann = await harness.seat({ code, nickname: 'Ann' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => playerView(ann)?.phase === 'playing',
    'the ballot box to open'
  )

  const vote = (
    voter: Peer<PlayerServerMessage>,
    seat: Peer<PlayerServerMessage> | string
  ) =>
    voter.send({
      answer: {
        kind: 'seat',
        playerId: typeof seat === 'string' ? seat : idOf(seat)
      },
      roundId: playerView(voter)?.round?.id ?? '',
      type: 'player.answer'
    })

  return { ann, code, host, max, vote, zoe }
}

/** Every content a peer was sent while the box was still open. */
const contentsBeforeTheReveal = (
  peer: Peer<PlayerServerMessage> | Peer<HostServerMessage>
) =>
  peer.frames.flatMap(({ message }) =>
    (message.type === 'room.updated' || message.type === 'welcome') &&
    message.view.phase !== 'revealed' &&
    message.view.round?.content.kind === 'mostlikely'
      ? [message.view.round.content]
      : []
  )

describe('a most-likely round through the seam', () => {
  it('[mostlikely] shows the line to every seat in every language, and no count before the reveal', async () => {
    const { host, zoe } = await roundInPlay()

    expect(mostLikelyRound(playerView(zoe))).toEqual({
      kind: 'mostlikely',
      labels: LINE,
      tally: null,
      yourBallot: null
    })
    expect(hostView(host)?.currentContent).toEqual({ kind: 'mostlikely' })
  })

  it('[mostlikely] refuses a ballot for a seat the round did not open on, a second ballot and a latecomer’s', async () => {
    const { code, max, vote, zoe } = await roundInPlay()
    const late = await harness.seat({ code, nickname: 'Lou' })

    vote(zoe, late)
    await waitFor(() => errorsIn(zoe).length === 1, 'the stray ballot refused')
    vote(zoe, 'nobody-at-all')
    await waitFor(() => errorsIn(zoe).length === 2, 'the bogus ballot refused')
    vote(zoe, max)
    await waitFor(
      () => mostLikelyRound(playerView(zoe))?.yourBallot === idOf(max),
      'the ballot to land'
    )
    vote(zoe, zoe)
    await waitFor(() => errorsIn(zoe).length === 3, 'the second ballot refused')
    vote(late, max)
    await waitFor(() => errorsIn(late).length === 1, 'the late ballot refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'invalid_message',
      'invalid_message',
      'already_buzzed'
    ])
    expect(errorsIn(late).map(({ code }) => code)).toEqual(['joined_mid_round'])
  })

  it('[mostlikely] sends no ballot but the reader’s own on any frame before the reveal', async () => {
    const { ann, host, max, vote, zoe } = await roundInPlay()

    vote(zoe, max)
    vote(max, ann)
    vote(ann, ann)
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    for (const [seat, ballot] of [
      [zoe, idOf(max)],
      [max, idOf(ann)],
      [ann, idOf(ann)]
    ] as const) {
      for (const content of contentsBeforeTheReveal(seat)) {
        expect(content.tally).toBeNull()
        expect([null, ballot]).toContain(content.yourBallot)
      }
    }

    for (const content of contentsBeforeTheReveal(host)) {
      expect(content.tally).toBeNull()
      expect(content.yourBallot).toBeNull()
    }
  })

  it('[mostlikely] pays every ballot for the room’s choice, nothing for being chosen, and reveals counts but never who voted for whom', async () => {
    const { ann, host, max, vote, zoe } = await roundInPlay()

    vote(zoe, max)
    vote(max, max)
    vote(ann, zoe)
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(awardOf(zoe)).toMatchObject({
      points: MOST_A_ROUND_PAYS,
      speedBonus: 0
    })
    expect(awardOf(max)).toMatchObject({
      points: MOST_A_ROUND_PAYS,
      speedBonus: 0
    })
    expect(awardOf(ann)).toMatchObject({ points: 0, speedBonus: 0 })
    expect(mostLikelyRound(playerView(ann))?.tally).toEqual([
      { playerId: idOf(max), votes: 2 },
      { playerId: idOf(zoe), votes: 1 }
    ])
    expect(mostLikelyRound(playerView(ann))?.yourBallot).toBe(idOf(zoe))
    expect(view?.round?.revealedAnswers.map(({ said }) => said)).toEqual([
      '',
      '',
      ''
    ])
  })

  it('[mostlikely] pays nobody when every ballot went somewhere different', async () => {
    const { ann, host, max, vote, zoe } = await roundInPlay()

    vote(zoe, max)
    vote(max, ann)
    vote(ann, zoe)
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(hostView(host)?.round?.awards.map(({ points }) => points)).toEqual([
      0, 0, 0
    ])
  })
})

describe('a most-likely deck of the evening’s own lines', () => {
  const FIRST = 'Who is most likely to forget their own birthday?'
  const SECOND = 'Who is most likely to adopt a third cat?'
  const DECKED: RoomSettings = {
    ...MOST_LIKELY,
    autoAdvanceMs: 2_000,
    lineUp: [DEFAULT_MOST_LIKELY_SETTINGS],
    lineUpAt: 0
  }

  const voteEveryone = (seats: Peer<PlayerServerMessage>[]) => {
    for (const voter of seats) {
      voter.send({
        answer: { kind: 'seat', playerId: idOf(seats[0] ?? voter) },
        roundId: playerView(voter)?.round?.id ?? '',
        type: 'player.answer'
      })
    }
  }

  const lineOn = (seat: Peer<PlayerServerMessage>) =>
    mostLikelyRound(playerView(seat))?.labels

  it('[mostlikely] deals the deck’s lines first, in order, on a round nobody pressed too, then the bank’s', async () => {
    const { code, host } = await harness.openRoom(DECKED)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const seats = [
      zoe,
      await harness.seat({ code, nickname: 'Max' }),
      await harness.seat({ code, nickname: 'Ann' })
    ]

    host.send({
      decks: [{ game: 'mostlikely', items: [FIRST, SECOND] }],
      type: 'host.setDecks'
    })
    await waitFor(
      () => hostView(host)?.deckSummaries[0]?.size === 2,
      'the deck to load'
    )

    const transcriptBefore = zoe.frames.map(({ raw }) => raw).join('')

    expect(transcriptBefore).not.toContain(FIRST)

    host.send({ type: 'host.startRound' })
    await waitFor(() => playerView(zoe)?.phase === 'playing', 'the first line')
    expect(lineOn(zoe)).toEqual({ en: FIRST, fr: FIRST })
    expect(zoe.frames.map(({ raw }) => raw).join('')).not.toContain(SECOND)

    voteEveryone(seats)
    await waitFor(
      () => lineOn(zoe)?.en === SECOND && playerView(zoe)?.phase === 'playing',
      'the held reveal to open the next line by itself',
      6_000
    )
    expect(hostView(host)?.deckSummaries).toEqual([{ played: 2, size: 2 }])

    voteEveryone(seats)
    await waitFor(
      () => lineOn(zoe)?.en === LINE.en && playerView(zoe)?.phase === 'playing',
      'the bank to take over',
      6_000
    )
  }, 20_000)
})
