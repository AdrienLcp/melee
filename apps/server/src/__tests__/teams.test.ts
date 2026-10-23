import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PlayerServerMessage } from '@melee/protocol/server-message'
import type { TeamsSettings } from '@melee/protocol/team'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  FAST_GAME,
  halves,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const inTeams = (teams: TeamsSettings) => ({ ...FAST_GAME, teams })

const DRAWN_IN_TWO = inTeams({ count: 2, kind: 'drawn' })
const DRAWN_IN_THREE = inTeams({ count: 3, kind: 'drawn' })
const CHOSEN_IN_TWO = inTeams({ count: 2, kind: 'chosen' })

const viewOf = (player: Peer<PlayerServerMessage> | undefined) =>
  player === undefined ? null : playerView(player)

const idOf = (player: Peer<PlayerServerMessage> | undefined): string =>
  viewOf(player)?.youId ?? ''

describe('a room played in teams', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const seatMany = async (code: string, nicknames: readonly string[]) => {
    const seats: Peer<PlayerServerMessage>[] = []

    for (const nickname of nicknames) {
      seats.push(await harness.seat({ code, nickname }))
    }

    return seats
  }

  it('[teams] opens as many empty teams as the setting counts', async () => {
    const { host } = await harness.openRoom(DRAWN_IN_THREE)

    await waitFor(() => hostView(host)?.teams.length === 3, 'three teams')

    expect(hostView(host)?.teams.map((team) => team.colour)).toEqual([1, 2, 3])
    expect(
      hostView(host)?.teams.every((team) => team.seatIds.length === 0)
    ).toBe(true)
  })

  it('[teams] deals six seats into three teams every screen can read', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_THREE)
    const seats = await seatMany(code, ['A', 'B', 'C', 'D', 'E', 'F'])
    const [a, b, c, d, e, f] = seats.map(idOf)

    host.send({
      assignment: [
        [a ?? '', d ?? ''],
        [b ?? '', e ?? ''],
        [c ?? '', f ?? '']
      ],
      type: 'host.drawTeams'
    })
    await waitFor(
      () => viewOf(seats[0])?.teams[0]?.seatIds.length === 2,
      'the deal to reach a phone'
    )

    expect(viewOf(seats[5])?.teams.map((team) => team.seatIds)).toEqual([
      [a, d],
      [b, e],
      [c, f]
    ])
  })

  it('[teams] re-deals the seats when the lobby changes the count after a draw', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_THREE)
    const seats = await seatMany(code, ['A', 'B', 'C', 'D', 'E', 'F'])
    const [a, b, c, d, e, f] = seats.map(idOf)

    host.send({
      assignment: [
        [a ?? '', d ?? ''],
        [b ?? '', e ?? ''],
        [c ?? '', f ?? '']
      ],
      type: 'host.drawTeams'
    })
    await waitFor(
      () => hostView(host)?.teams[2]?.seatIds.length === 2,
      'the deal in three'
    )

    host.send({ settings: DRAWN_IN_TWO, type: 'host.updateSettings' })
    host.send({
      assignment: [
        [a ?? '', b ?? '', c ?? ''],
        [d ?? '', e ?? '', f ?? '']
      ],
      type: 'host.drawTeams'
    })
    await waitFor(
      () => viewOf(seats[0])?.teams[0]?.seatIds.length === 3,
      'the deal in two to reach a phone'
    )

    expect(errorsIn(host)).toEqual([])
    expect(viewOf(seats[0])?.teams.map((team) => team.seatIds)).toEqual([
      [a, b, c],
      [d, e, f]
    ])
  })

  it('[teams] refuses a deal two seats apart, and keeps the teams as they were', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_TWO)
    const [a, b, c, d] = (await seatMany(code, ['A', 'B', 'C', 'D'])).map(idOf)

    host.send({
      assignment: [[a ?? '', b ?? '', c ?? ''], [d ?? '']],
      type: 'host.drawTeams'
    })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host)[0]?.code).toBe('teams_locked')
    expect(hostView(host)?.teams.flatMap((team) => team.seatIds)).toEqual([])
  })

  it('[teams] refuses a deal once the game is under way', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_TWO)
    const [a, b] = (await seatMany(code, ['A', 'B'])).map(idOf)

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    host.send({ assignment: [[b ?? ''], [a ?? '']], type: 'host.drawTeams' })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host)[0]?.code).toBe('teams_locked')
  })

  it('[teams] refuses a new team count once the game is under way', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_TWO)

    await seatMany(code, ['A', 'B'])
    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    host.send({ settings: DRAWN_IN_THREE, type: 'host.updateSettings' })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host)[0]?.code).toBe('teams_locked')
    expect(hostView(host)?.teams.length).toBe(2)
  })

  // Connected, not seated: a team whose phone went dark is a team one short,
  // whatever its roster says.
  it('[teams] seats a late arrival in the team with the fewest connected seats', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_TWO)
    const seats = await seatMany(code, ['A', 'B', 'C', 'D'])
    const [a, b, c, d] = seats.map(idOf)

    host.send({
      assignment: [
        [a ?? '', b ?? ''],
        [c ?? '', d ?? '']
      ],
      type: 'host.drawTeams'
    })
    await waitFor(
      () => hostView(host)?.teams[1]?.seatIds.length === 2,
      'the deal'
    )

    seats[2]?.close()
    await waitFor(
      () =>
        hostView(host)?.players.find((player) => player.id === c)
          ?.isConnected === false,
      'C to go dark'
    )

    const late = idOf(await harness.seat({ code, nickname: 'Late' }))

    await waitFor(
      () => hostView(host)?.teams[1]?.seatIds.includes(late) === true,
      'the late seat to join the short team'
    )
  })

  it('[teams] lets a seat pick under chosen, and places the one that never did at the start', async () => {
    const { code, host } = await harness.openRoom(CHOSEN_IN_TWO)
    const [anna, ben, carl] = await seatMany(code, ['Anna', 'Ben', 'Carl'])

    anna?.send({ teamId: 'team-1', type: 'player.chooseTeam' })
    ben?.send({ teamId: 'team-1', type: 'player.chooseTeam' })
    await waitFor(
      () => hostView(host)?.teams[0]?.seatIds.length === 2,
      'two picks'
    )

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    expect(hostView(host)?.teams[1]?.seatIds).toEqual([idOf(carl)])
  })

  it('[teams] refuses a pick in a room whose console deals', async () => {
    const { code } = await harness.openRoom(DRAWN_IN_TWO)
    const anna = await harness.seat({ code, nickname: 'Anna' })

    anna.send({ teamId: 'team-1', type: 'player.chooseTeam' })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')

    expect(errorsIn(anna)[0]?.code).toBe('teams_locked')
  })

  it('[teams] pays a team the sum of what the round paid its seats', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_TWO)
    const seats = await seatMany(code, ['Anna', 'Ben', 'Carl'])
    const [anna, ben, carl] = seats.map(idOf)

    host.send({
      assignment: [[anna ?? '', ben ?? ''], [carl ?? '']],
      type: 'host.drawTeams'
    })
    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    const roundId = hostView(host)?.round?.id ?? ''

    seats[0]?.send({ roundId, type: 'player.buzz' })
    await waitFor(() => hostView(host)?.phase === 'buzzed', 'the buzz')
    host.send({
      playerId: anna ?? '',
      roundId,
      type: 'host.judge',
      verdict: halves(true, true)
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const paid =
      hostView(host)?.players.find((player) => player.id === anna)?.score ?? 0

    expect(paid).toBeGreaterThan(0)
    expect(hostView(host)?.teams.map((team) => team.score)).toEqual([paid, 0])

    host.send({ type: 'host.endGame' })
    await waitFor(() => hostView(host)?.phase === 'finished', 'the board')

    expect(hostView(host)?.teams.map((team) => team.score)).toEqual([paid, 0])
  })

  it('[teams] moves a seat, renames a team and adjusts its score mid-game', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_TWO)
    const [anna, ben] = (await seatMany(code, ['Anna', 'Ben'])).map(idOf)

    host.send({
      assignment: [[anna ?? ''], [ben ?? '']],
      type: 'host.drawTeams'
    })
    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    host.send({ playerId: ben ?? '', teamId: 'team-1', type: 'host.moveSeat' })
    host.send({
      name: 'Fondue Club',
      teamId: 'team-2',
      type: 'host.renameTeam'
    })
    host.send({
      points: 2_000,
      target: { kind: 'team', teamId: 'team-2' },
      type: 'host.adjustScore'
    })
    host.send({
      points: -5_000,
      target: { kind: 'team', teamId: 'team-1' },
      type: 'host.adjustScore'
    })
    await waitFor(
      () => hostView(host)?.teams[1]?.score === 2_000,
      'the adjustment'
    )

    expect(hostView(host)?.teams).toMatchObject([
      { score: 0, seatIds: [anna, ben] },
      { name: 'Fondue Club', seatIds: [] }
    ])
    expect(errorsIn(host)).toEqual([])
  })

  it('[teams] starts the scores again with the same teams on play again', async () => {
    const { code, host } = await harness.openRoom(DRAWN_IN_TWO)
    const [anna, ben] = (await seatMany(code, ['Anna', 'Ben'])).map(idOf)

    host.send({
      assignment: [[anna ?? ''], [ben ?? '']],
      type: 'host.drawTeams'
    })
    host.send({
      points: 3_000,
      target: { kind: 'team', teamId: 'team-1' },
      type: 'host.adjustScore'
    })
    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')
    host.send({ type: 'host.endGame' })
    await waitFor(() => hostView(host)?.phase === 'finished', 'the board')

    expect(hostView(host)?.teams[0]?.score).toBe(3_000)

    host.send({ type: 'host.playAgain' })
    await waitFor(() => hostView(host)?.phase === 'lobby', 'the lobby')

    expect(hostView(host)?.teams).toMatchObject([
      { score: 0, seatIds: [anna] },
      { score: 0, seatIds: [ben] }
    ])
  })
})
