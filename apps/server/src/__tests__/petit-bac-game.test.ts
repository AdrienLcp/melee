import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_PETIT_BAC_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent
} from '@melee/protocol/room'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'
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
  sleep,
  waitFor
} from './room-harness'

/** Five seconds in play; a fraction of one here, so a stop's grace costs no suite its time. */
vi.mock('@melee/protocol/petit-bac', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@melee/protocol/petit-bac')>()),
  PETIT_BAC_IN_FLIGHT_GRACE_MS: 500,
  PETIT_BAC_STOP_GRACE_MS: 300
}))

vi.mock('@melee/core/petitbac/letter-draw', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@melee/core/petitbac/letter-draw')
  >()),
  drawLetter: () => 'B'
}))

const PETIT_BAC_CATEGORIES = [
  { kind: 'own' as const, label: 'A country' },
  { kind: 'own' as const, label: 'An animal' },
  { kind: 'own' as const, label: 'A first name' }
]

const PETIT_BAC: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: {
    ...DEFAULT_PETIT_BAC_SETTINGS,
    categories: PETIT_BAC_CATEGORIES
  },
  mode: DEFAULT_MODE_SETTINGS.typed,
  roundCount: 3
}

const UNIQUE = 1
const SHARED = 1 / 2

/** A sheet's share of the round: each category a word nobody else wrote fills whole, a shared one by half. */
const sheetPays = (filled: number) =>
  Math.round((MOST_A_ROUND_PAYS * filled) / PETIT_BAC_CATEGORIES.length)

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

    expect(hostView(host)?.currentContent).toMatchObject(
      wallView(wall)?.currentContent ?? {}
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

  it('[petitbac] keeps a line that lands once the sheets have closed on screen, inside the grace for it', async () => {
    const { lea, roundId, sheetsClosed, stop, write, zoe } = await roundInPlay()

    await write(zoe, SHEETS.zoe)
    stop(zoe)
    await waitFor(
      () => petitBacRound(playerView(lea))?.stoppedBy !== null,
      'the stop to reach every seat'
    )

    const view = playerView(lea)
    const closesOnScreenInMs =
      (petitBacRound(view)?.stopClosesAtElapsedMs ?? 0) -
      (view?.roundElapsedMs ?? 0)

    await sleep(closesOnScreenInMs + 100)
    lea.send({
      answer: 'Brésil',
      categoryIndex: 0,
      roundId,
      type: 'petitbac.write'
    })
    await sheetsClosed()

    expect(errorsIn(lea)).toEqual([])
    expect(
      petitBacRound(playerView(lea))?.rows?.map(({ text }) => text)
    ).toContain('Brésil')
  })

  it('[petitbac] keeps a written line changed to another word without sending any screen a frame', async () => {
    const { host, lea, max, roundId, sheetsClosed, stop, wall, write, zoe } =
      await roundInPlay()
    const peers = [host, wall, zoe, max, lea]
    const updatesOf = (peer: { frames: { message: { type: string } }[] }) =>
      peer.frames.filter(({ message }) => message.type === 'room.updated')
        .length

    await write(zoe, SHEETS.zoe)
    await write(max, ['Bolivie', '', ''])

    const before = peers.map(updatesOf)

    max.send({
      answer: 'Botswana',
      categoryIndex: 0,
      roundId,
      type: 'petitbac.write'
    })
    max.send({
      answer: 'Bison',
      categoryIndex: 1,
      roundId,
      type: 'petitbac.write'
    })
    await waitFor(
      () => filledCounts(host).join() === '3,2,0',
      'the line filled after it to be counted'
    )

    expect(peers.map(updatesOf)).toEqual(before.map((count) => count + 1))

    stop(zoe)
    await sheetsClosed()

    expect(
      petitBacRound(playerView(max))?.rows?.map(({ text }) => text)
    ).toContain('Botswana')
  })

  it('[petitbac] refuses a stop from a sheet off the letter or of bare initials', async () => {
    const { lea, stop, write, zoe } = await roundInPlay()

    await write(zoe, ['Belgique', 'Chat', 'Bastien'])
    stop(zoe)
    await write(lea, ['B', 'b.', 'B'])
    stop(lea)
    await waitFor(
      () =>
        [zoe, lea].every((seat) =>
          errorsIn(seat).some(({ code }) => code === 'sheet_not_full')
        ),
      'both junk sheets to be refused'
    )

    expect(petitBacRound(playerView(zoe))?.stoppedBy).toBeNull()
  })

  it('[petitbac] reopens every sheet on a cancelled stop, and bars its caller from stopping again', async () => {
    const {
      doneVoting,
      host,
      idOf,
      max,
      roundId,
      sheetsClosed,
      stop,
      write,
      zoe
    } = await roundInPlay()

    await write(zoe, SHEETS.zoe)
    stop(zoe)
    await sheetsClosed()

    host.send({ roundId, type: 'host.cancelStop' })
    await waitFor(
      () => petitBacRound(playerView(max))?.sheetsClosed === false,
      'the sheets to reopen'
    )

    expect(petitBacRound(playerView(max))).toMatchObject({
      barredStopperIds: [idOf(zoe)],
      categoryStates: ['open', 'open', 'open'],
      stopClosesAtElapsedMs: null,
      stoppedBy: null
    })

    stop(zoe)
    await waitFor(
      () => errorsIn(zoe).some(({ code }) => code === 'wrong_phase'),
      'a second stop from the same seat to be refused'
    )

    await write(max, SHEETS.max)
    stop(max)
    await sheetsClosed()
    doneVoting(0)
    await waitFor(
      () => petitBacRound(playerView(zoe))?.categoryStates[0] === 'settled',
      'the first category to settle'
    )

    expect(hostView(host)?.currentContent).toMatchObject({
      canCancelStop: false
    })

    host.send({ roundId, type: 'host.cancelStop' })
    await waitFor(
      () => errorsIn(host).some(({ code }) => code === 'wrong_phase'),
      'a cancel after the vote moved on to be refused'
    )
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
    expect(pointsOf(zoe)).toBe(sheetPays(SHARED + SHARED + UNIQUE))
    // Max: belgique shared, Bison unique, Bruno unique.
    expect(pointsOf(max)).toBe(sheetPays(SHARED + UNIQUE + UNIQUE))
    // Lea: Brésil unique, Baleine shared, Xavier off the letter.
    expect(pointsOf(lea)).toBe(sheetPays(UNIQUE + SHARED))

    const firstNames = petitBacRound(playerView(lea))?.lines[2]

    expect(
      firstNames?.find(({ playerId }) => playerId === idOf(lea))?.outcome
    ).toBe('offLetter')
  })

  it('[petitbac] lets the console strike a word nobody refused, on the vote and on the reveal, and put it back', async () => {
    const {
      doneVoting,
      host,
      idOf,
      lea,
      max,
      roundId,
      sheetsClosed,
      stop,
      write,
      zoe
    } = await roundInPlay()

    await write(zoe, SHEETS.zoe)
    await write(max, SHEETS.max)
    await write(lea, SHEETS.lea)
    stop(zoe)
    await sheetsClosed()

    const strike = ({
      categoryIndex,
      isStruck = true,
      rowKey
    }: {
      categoryIndex: number
      isStruck?: boolean
      rowKey: string
    }) =>
      host.send({
        categoryIndex,
        isStruck,
        roundId,
        rowKey,
        type: 'host.strikeRow'
      })

    strike({ categoryIndex: 0, rowKey: 'belgique' })
    await waitFor(
      () =>
        petitBacRound(playerView(lea))?.rows?.find(
          ({ key }) => key === 'belgique'
        )?.refused === true,
      'the struck row to fall without a vote'
    )

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
    const scoreOf = (seat: Seat) =>
      hostView(host)?.players.find(({ id }) => id === idOf(seat))?.score

    // Zoe: Belgique struck, Baleine shared, Bastien unique.
    expect(pointsOf(zoe)).toBe(sheetPays(SHARED + UNIQUE))

    strike({ categoryIndex: 2, rowKey: 'bastien' })
    await waitFor(
      () => pointsOf(zoe) === sheetPays(SHARED),
      'the reveal to pay again'
    )

    expect(scoreOf(zoe)).toBe(sheetPays(SHARED))
    expect(
      petitBacRound(playerView(zoe))?.lines[2]?.find(
        ({ playerId }) => playerId === idOf(zoe)
      )
    ).toMatchObject({ isStruck: true, outcome: 'refused' })

    strike({ categoryIndex: 2, isStruck: false, rowKey: 'bastien' })
    await waitFor(
      () => pointsOf(zoe) === sheetPays(SHARED + UNIQUE),
      'the word put back to pay again'
    )

    expect(scoreOf(zoe)).toBe(sheetPays(SHARED + UNIQUE))

    strike({ categoryIndex: 2, rowKey: 'nobody-wrote-this' })
    await waitFor(
      () => errorsIn(host).some(({ code }) => code === 'invalid_message'),
      'a word nobody wrote to be refused'
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
