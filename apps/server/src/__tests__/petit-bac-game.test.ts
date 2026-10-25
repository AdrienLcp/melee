import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_PETIT_BAC_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent
} from '@melee/protocol/room'
import { POINT } from '@melee/protocol/scoring'
import {
  type HostServerMessage,
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

/** Five seconds in play; a fraction of one here, so a stop's grace costs no suite its time. */
vi.mock('@melee/protocol/petit-bac', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@melee/protocol/petit-bac')>()),
  PETIT_BAC_STOP_GRACE_MS: 300
}))

vi.mock('@melee/core/petitbac/letter-draw', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@melee/core/petitbac/letter-draw')
  >()),
  drawLetter: () => 'B'
}))

const PETIT_BAC: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: {
    ...DEFAULT_PETIT_BAC_SETTINGS,
    categories: [
      { kind: 'own', label: 'A country' },
      { kind: 'own', label: 'An animal' },
      { kind: 'own', label: 'A first name' }
    ]
  },
  mode: DEFAULT_MODE_SETTINGS.typed,
  roundCount: 3
}

const JUDGED: RoomSettings = { ...PETIT_BAC, hasJudge: true }

const petitBacRound = (
  view: { round: { content: RoundContent } | null } | null
): Extract<RoundContent, { kind: 'petitbac' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'petitbac' ? content : null
}

const transcriptOf = (peer: { frames: { raw: string }[] }): string =>
  peer.frames.map(({ raw }) => raw).join('')

const wallView = (wall: Peer<WallServerMessage>) => {
  for (const { message } of wall.frames.toReversed()) {
    if (message.type === 'room.updated' || message.type === 'welcome') {
      return message.view
    }
  }

  return null
}

/** How many lines each seat has filled, as the console is told. */
const filledCounts = (host: Peer<HostServerMessage>): number[] => {
  const content = hostView(host)?.currentContent

  return content?.kind === 'petitbac'
    ? content.progress.map(({ filled }) => filled)
    : []
}

let harness: RoomHarness

beforeEach(async () => {
  harness = await startRoomHarness()
})

afterEach(async () => {
  await harness.stop()
})

const pairedWall = async ({
  code,
  hostToken
}: {
  code: string
  hostToken: HostToken
}): Promise<Peer<WallServerMessage>> => {
  const wall = await harness.connect(code, wallServerMessageSchema)

  wall.send({
    hostToken,
    protocolVersion: PROTOCOL_VERSION,
    role: 'wall',
    type: 'hello'
  })
  await waitFor(() => wallView(wall) !== null, 'the wall to be welcomed')

  return wall
}

type Seat = Peer<PlayerServerMessage>

const roundInPlay = async ({
  settings = PETIT_BAC
}: {
  settings?: RoomSettings
} = {}) => {
  const { code, host, hostToken } = await harness.openRoom(settings)
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const lea = await harness.seat({ code, nickname: 'Lea' })

  host.send({ type: 'host.startRound' })
  await waitFor(() => playerView(zoe)?.phase === 'playing', 'the letter')

  const roundId = playerView(zoe)?.round?.id ?? ''

  /** Writes a whole sheet, then waits for the server to hold every line of it. */
  const write = async (seat: Seat, lines: readonly string[]) => {
    for (const [categoryIndex, answer] of lines.entries()) {
      seat.send({ answer, categoryIndex, roundId, type: 'petitbac.write' })
    }

    await waitFor(
      () =>
        petitBacRound(playerView(seat))?.yourSheet?.join('|') ===
        lines.join('|'),
      'the sheet to be kept'
    )
  }

  const stop = (seat: Seat) => seat.send({ roundId, type: 'petitbac.stop' })

  const sheetsClosed = () =>
    waitFor(
      () => petitBacRound(playerView(zoe))?.sheetsClosed === true,
      'the sheets to close'
    )

  const vote = ({
    categoryIndex = 0,
    refuses = true,
    rowKey,
    seat
  }: {
    categoryIndex?: number
    refuses?: boolean
    rowKey: string
    seat: Seat
  }) =>
    seat.send({
      categoryIndex,
      refuses,
      roundId,
      rowKey,
      type: 'petitbac.vote'
    })

  const doneVoting = (categoryIndex: number) => {
    for (const seat of [zoe, max, lea]) {
      seat.send({ categoryIndex, roundId, type: 'petitbac.doneVoting' })
    }
  }

  const idOf = (seat: Seat) => playerView(seat)?.youId ?? ''

  return {
    code,
    doneVoting,
    host,
    idOf,
    lea,
    max,
    roundId,
    sheetsClosed,
    stop,
    vote,
    wall,
    write,
    zoe
  }
}

/** Three sheets every category of which has something to vote on, `Bastien` alone unique to the end. */
const SHEETS = {
  lea: ['Brésil', 'Baleine', 'Xavier'],
  max: ['belgique', 'Bison', 'Bruno'],
  zoe: ['Belgique', 'Baleine', 'Bastien']
}

describe('a Petit Bac round through the seam', () => {
  it('[petitbac] tells nobody another seat’s word while the sheets are open, and the console and the wall only counts', async () => {
    const { host, lea, max, wall, write, zoe } = await roundInPlay()

    await write(zoe, ['Bhoutan', 'Blaireau', 'Bérénice'])
    await write(max, ['Botswana', 'Bonobo', ''])
    await waitFor(
      () => filledCounts(host).join() === '3,2,0',
      'the console to count the lines'
    )

    for (const peer of [host, wall, lea]) {
      for (const word of ['Bhoutan', 'Blaireau', 'Bérénice', 'Botswana']) {
        expect(transcriptOf(peer)).not.toContain(word)
      }
    }

    expect(transcriptOf(max)).not.toContain('Bhoutan')
    expect(transcriptOf(zoe)).not.toContain('Botswana')

    expect(wallView(wall)?.currentContent).toEqual(
      hostView(host)?.currentContent
    )
  })

  it('[petitbac] refuses a stop from a sheet with a blank, and closes every sheet a grace after a full one', async () => {
    const { lea, max, sheetsClosed, stop, write, zoe } = await roundInPlay()

    await write(max, ['Bolivie', '', ''])
    stop(max)
    await waitFor(
      () => errorsIn(max).some(({ code }) => code === 'sheet_not_full'),
      'the blank sheet to be refused'
    )

    await write(zoe, SHEETS.zoe)
    stop(zoe)
    await waitFor(
      () => petitBacRound(playerView(lea))?.stoppedBy !== null,
      'the stop to reach every seat'
    )

    expect(petitBacRound(playerView(lea))?.sheetsClosed).toBe(false)

    await write(lea, ['Brésil', '', ''])
    await sheetsClosed()

    lea.send({
      answer: 'Bison',
      categoryIndex: 1,
      roundId: playerView(lea)?.round?.id ?? '',
      type: 'petitbac.write'
    })
    await waitFor(
      () => errorsIn(lea).some(({ code }) => code === 'wrong_phase'),
      'a line after the stop to be refused'
    )

    expect(petitBacRound(playerView(lea))?.yourSheet).toEqual([
      'Brésil',
      '',
      ''
    ])
    expect(petitBacRound(playerView(zoe))?.categoryStates).toEqual([
      'voting',
      'open',
      'open'
    ])
  })

  it('[petitbac] groups a category’s answers into rows, and lets a seat refuse none of its own', async () => {
    const { idOf, lea, max, sheetsClosed, stop, vote, write, zoe } =
      await roundInPlay()

    await write(zoe, SHEETS.zoe)
    await write(max, SHEETS.max)
    await write(lea, SHEETS.lea)
    stop(zoe)
    await sheetsClosed()

    expect(
      petitBacRound(playerView(lea))?.rows?.map(({ authors, text }) => ({
        authors,
        text
      }))
    ).toEqual([
      { authors: [idOf(zoe), idOf(max)], text: 'Belgique' },
      { authors: [idOf(lea)], text: 'Brésil' }
    ])

    vote({ rowKey: 'belgique', seat: zoe })
    await waitFor(
      () => errorsIn(zoe).some(({ code }) => code === 'invalid_message'),
      'a vote on one’s own row to be refused'
    )
  })

  it('[petitbac] drops a row on a strict majority of its voters, and keeps it on a tie', async () => {
    const { lea, max, sheetsClosed, stop, vote, write, zoe } =
      await roundInPlay()

    await write(zoe, SHEETS.zoe)
    await write(max, SHEETS.max)
    await write(lea, SHEETS.lea)
    stop(zoe)
    await sheetsClosed()

    const rowNamed = (text: string) =>
      petitBacRound(playerView(zoe))?.rows?.find((row) => row.text === text)

    // Belgique's one voter is Lea, so her refusal alone is a majority.
    vote({ rowKey: 'belgique', seat: lea })
    // Brésil's voters are Zoe and Max: one of two is a tie.
    vote({ rowKey: 'bresil', seat: zoe })
    await waitFor(
      () =>
        rowNamed('Belgique')?.refused === true &&
        rowNamed('Brésil')?.refusals === 1,
      'both votes to land'
    )

    expect(rowNamed('Brésil')?.refused).toBe(false)

    vote({ rowKey: 'bresil', seat: max })
    await waitFor(
      () => rowNamed('Brésil')?.refused === true,
      'the second refusal to drop it'
    )

    vote({ refuses: false, rowKey: 'bresil', seat: max })
    await waitFor(
      () => rowNamed('Brésil')?.refused === false,
      'a refusal taken back to restore it'
    )
  })

  it('[petitbac] pays a unique answer double a shared one, and an off-the-letter line nothing', async () => {
    const { doneVoting, host, idOf, lea, max, sheetsClosed, stop, write, zoe } =
      await roundInPlay()

    await write(zoe, SHEETS.zoe)
    await write(max, SHEETS.max)
    await write(lea, SHEETS.lea)
    stop(zoe)
    await sheetsClosed()

    for (const categoryIndex of [0, 1, 2]) {
      doneVoting(categoryIndex)
      await waitFor(
        () =>
          petitBacRound(playerView(zoe))?.categoryStates[categoryIndex] ===
          'settled',
        `category ${categoryIndex} to settle`
      )
    }

    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const pointsOf = (seat: Seat) =>
      hostView(host)?.round?.awards.find(
        ({ playerId }) => playerId === idOf(seat)
      )?.points

    // Zoe: Belgique shared, Baleine shared, Bastien unique.
    expect(pointsOf(zoe)).toBe(4 * POINT)
    // Max: belgique shared, Bison unique, Bruno unique.
    expect(pointsOf(max)).toBe(5 * POINT)
    // Lea: Brésil unique, Baleine shared, Xavier off the letter.
    expect(pointsOf(lea)).toBe(3 * POINT)

    const firstNames = petitBacRound(playerView(lea))?.lines[2]

    expect(
      firstNames?.find(({ playerId }) => playerId === idOf(lea))?.outcome
    ).toBe('offLetter')
  })

  it('[petitbac] leaves the refusing to the judge in a judged room', async () => {
    const { host, lea, roundId, sheetsClosed, stop, vote, write, zoe } =
      await roundInPlay({ settings: JUDGED })

    await write(zoe, SHEETS.zoe)
    await write(lea, SHEETS.lea)
    stop(zoe)
    await sheetsClosed()

    vote({ rowKey: 'belgique', seat: lea })
    await waitFor(
      () => errorsIn(lea).some(({ code }) => code === 'wrong_phase'),
      'a seat’s vote to be refused'
    )

    host.send({
      categoryIndex: 0,
      refuses: true,
      roundId,
      rowKey: 'belgique',
      type: 'host.refuseRow'
    })
    await waitFor(
      () =>
        petitBacRound(playerView(zoe))?.rows?.find(
          (row) => row.key === 'belgique'
        )?.refused === true,
      'the judge’s refusal to drop the row'
    )

    host.send({ categoryIndex: 0, roundId, type: 'host.nextCategory' })
    await waitFor(
      () => petitBacRound(playerView(zoe))?.categoryStates[1] === 'voting',
      'the console to move the room on'
    )
  })

  it('[petitbac] refuses a reveal while the sheets are being written', async () => {
    const { host, roundId } = await roundInPlay()

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(
      () => errorsIn(host).some(({ code }) => code === 'wrong_phase'),
      'the reveal to be refused'
    )

    expect(hostView(host)?.phase).toBe('playing')
  })

  it('[petitbac] gives a seat arriving mid-round no sheet to write', async () => {
    const { code, roundId } = await roundInPlay()
    const late = await harness.seat({ code, nickname: 'Late' })

    late.send({
      answer: 'Bénin',
      categoryIndex: 0,
      roundId,
      type: 'petitbac.write'
    })
    await waitFor(
      () => errorsIn(late).some(({ code }) => code === 'joined_mid_round'),
      'the latecomer to be refused'
    )

    expect(petitBacRound(playerView(late))?.yourSheet).toBeNull()
  })
})
