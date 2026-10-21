import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_CHALLENGE_SETTINGS,
  DEFAULT_QUIZ_SETTINGS
} from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'
import { POINTS_FOR_A_CLAIM } from '@melee/protocol/scoring'
import type { HostServerMessage } from '@melee/protocol/server-message'
import { playerServerMessageSchema } from '@melee/protocol/server-message'
import type { TeamVerdict } from '@melee/protocol/team'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  type Peer,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/questions/question-bank', async () => {
  const { questionBankStub } = await import('./room-harness')

  return questionBankStub()
})

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const ALOUD_IN_THREE = { count: 3, kind: 'aloud' } as const

const QUIZ: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: { ...DEFAULT_QUIZ_SETTINGS, roundDurationMs: 5_000 },
  mode: DEFAULT_MODE_SETTINGS.choice,
  roundCount: 3
}

const QUIZ_ALOUD: RoomSettings = { ...QUIZ, teams: ALOUD_IN_THREE }

const CHALLENGE_ALOUD: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_CHALLENGE_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.buzzer,
  roundCount: null,
  teams: ALOUD_IN_THREE
}

const HAD_IT: TeamVerdict['verdict'] = { isCorrect: true, kind: 'single' }

let harness: RoomHarness

beforeEach(async () => {
  harness = await startRoomHarness()
})

afterEach(async () => {
  await harness.stop()
})

const scoresOf = (host: Peer<HostServerMessage>) =>
  hostView(host)?.teams.map((team) => team.score)

const sendAndLand = async (
  host: Peer<HostServerMessage>,
  message: Parameters<Peer<HostServerMessage>['send']>[0]
) => {
  const framesBefore = host.frames.length

  host.send(message)
  await waitFor(() => host.frames.length > framesBefore, 'the frame to land')
}

const openQuizRound = async () => {
  const { code, host } = await harness.openRoom(QUIZ_ALOUD)

  await waitFor(() => hostView(host)?.teams.length === 3, 'the three teams')
  host.send({ type: 'host.startRound' })
  await waitFor(() => hostView(host)?.phase === 'playing', 'the question')

  return { code, host, roundId: hostView(host)?.round?.id ?? '' }
}

describe('a table answering aloud', () => {
  it('[aloud] plays a round with no seat and pays the teams the host taps', async () => {
    const { host, roundId } = await openQuizRound()

    await sendAndLand(host, {
      roundId,
      type: 'host.awardTeams',
      verdicts: [
        { teamId: 'team-1', verdict: HAD_IT },
        { teamId: 'team-3', verdict: HAD_IT }
      ]
    })

    expect(hostView(host)?.phase).toBe('revealed')
    expect(scoresOf(host)).toEqual([POINTS_FOR_A_CLAIM, 0, POINTS_FOR_A_CLAIM])
  })

  it('[aloud] replaces the verdict when the host corrects it on the reveal', async () => {
    const { host, roundId } = await openQuizRound()

    await sendAndLand(host, {
      roundId,
      type: 'host.awardTeams',
      verdicts: [{ teamId: 'team-1', verdict: HAD_IT }]
    })
    await sendAndLand(host, {
      roundId,
      type: 'host.awardTeams',
      verdicts: [{ teamId: 'team-2', verdict: HAD_IT }]
    })

    expect(scoresOf(host)).toEqual([0, POINTS_FOR_A_CLAIM, 0])
  })

  it('[aloud] banks a round once the next one opens', async () => {
    const { host, roundId } = await openQuizRound()

    await sendAndLand(host, {
      roundId,
      type: 'host.awardTeams',
      verdicts: [{ teamId: 'team-2', verdict: HAD_IT }]
    })
    host.send({ type: 'host.nextRound' })
    await waitFor(
      () => hostView(host)?.phase === 'playing',
      'the next question'
    )

    expect(scoresOf(host)).toEqual([0, POINTS_FOR_A_CLAIM, 0])
  })

  it('[aloud] refuses a verdict in a shape the game is not judged in', async () => {
    const { host, roundId } = await openQuizRound()

    await sendAndLand(host, {
      roundId,
      type: 'host.awardTeams',
      verdicts: [
        {
          teamId: 'team-1',
          verdict: { artistCorrect: true, kind: 'halves', titleCorrect: true }
        }
      ]
    })

    expect(errorsIn(host).map((error) => error.code)).toEqual([
      'invalid_message'
    ])
    expect(hostView(host)?.phase).toBe('playing')
  })

  it('[aloud] pays a challenge podium to the teams themselves', async () => {
    const { host } = await harness.openRoom(CHALLENGE_ALOUD)

    await waitFor(() => hostView(host)?.teams.length === 3, 'the three teams')
    host.send({ challengeText: 'Hum it', type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the challenge')
    await sendAndLand(host, {
      places: [
        { place: 1, target: { kind: 'team', teamId: 'team-3' } },
        { place: 2, target: { kind: 'team', teamId: 'team-1' } }
      ],
      roundId: hostView(host)?.round?.id ?? '',
      type: 'host.awardPlaces'
    })

    expect(scoresOf(host)).toEqual([2_000, 0, 3_000])
  })

  it('[aloud] turns a phone away without closing its socket', async () => {
    const { code } = await openQuizRound()
    const phone = await harness.connect(code, playerServerMessageSchema)

    phone.send({
      nickname: 'Anna',
      protocolVersion: PROTOCOL_VERSION,
      role: 'player',
      type: 'hello'
    })
    await waitFor(() => errorsIn(phone).length > 0, 'the refusal')

    expect(errorsIn(phone)).toMatchObject([
      { code: 'room_plays_aloud', fatal: false }
    ])
  })

  it('[aloud] is refused while a phone holds a seat', async () => {
    const { code, host } = await harness.openRoom(QUIZ)

    await harness.seat({ code, nickname: 'Anna' })
    await sendAndLand(host, {
      settings: { ...QUIZ, lineUp: ['quiz'], teams: ALOUD_IN_THREE },
      type: 'host.updateSettings'
    })

    expect(errorsIn(host).map((error) => error.code)).toEqual(['teams_locked'])
  })
})
