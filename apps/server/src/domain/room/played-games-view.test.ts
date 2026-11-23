import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS } from '@melee/protocol/game'
import type { Award } from '@melee/protocol/scoring'

import { generateHostToken } from '@melee/core/room/host-token'

import {
  finishGame,
  openRound,
  restartGame
} from '@/domain/round/round-service'

import { newRoom } from './new-room'
import type { Room } from './room'
import { joinAsPlayer } from './room-service'
import { toWallView } from './room-view'

const NOW = 1_000_000

const award = (playerId: string, points: number): Award => ({
  isPerfect: false,
  isUnsent: false,
  playerId,
  points,
  speedBonus: 0,
  verdict: { isCorrect: true, kind: 'single' }
})

const roomOfTwoGames = (): Room => {
  const room = newRoom({
    code: 'ABCD',
    games: ['buzzer', 'reflex'],
    hostToken: generateHostToken(),
    locale: 'fr',
    now: NOW
  })

  for (const name of ['Ada', 'Bo']) {
    joinAsPlayer({
      askedPiece: null,
      newPlayerId: name,
      nickname: name,
      now: NOW,
      room,
      sessionId: `session-${name}`
    })
  }

  return room
}

/** Opens a round on `entry` and has it pay `awards`, as the host would grant them. */
const playRound = ({
  awards,
  entry,
  room
}: {
  awards: Award[]
  entry: 'buzzer' | 'reflex'
  room: Room
}): void => {
  room.settings.game = DEFAULT_GAME_SETTINGS[entry]
  openRound({
    content: { kind: 'buzzer' },
    id: `round-${room.openedEntries.length + 1}`,
    now: NOW,
    room
  })
  room.round?.awards.push(...awards)
}

const playedGamesOn = (room: Room) =>
  toWallView({
    isHostConnected: true,
    now: NOW,
    room,
    wall: { isSpeaker: false, number: 1 },
    wallCount: 1
  }).playedGames

describe('the played games on the view', () => {
  it('[played-games] adds up every round of each entry by the final board', () => {
    const room = roomOfTwoGames()

    room.settings.lineUp = [
      DEFAULT_GAME_SETTINGS.buzzer,
      DEFAULT_GAME_SETTINGS.reflex
    ]
    playRound({ awards: [award('Ada', 40_000)], entry: 'buzzer', room })
    playRound({ awards: [award('Bo', 70_000)], entry: 'reflex', room })
    playRound({
      awards: [award('Ada', 10_000), award('Bo', 30_000)],
      entry: 'buzzer',
      room
    })
    finishGame(room, NOW)

    expect(playedGamesOn(room)).toEqual([
      {
        kind: 'buzzer',
        lineUpAt: 0,
        roundCount: 2,
        totals: [
          { playerId: 'Ada', points: 50_000 },
          { playerId: 'Bo', points: 30_000 }
        ]
      },
      {
        kind: 'reflex',
        lineUpAt: 1,
        roundCount: 1,
        totals: [{ playerId: 'Bo', points: 70_000 }]
      }
    ])
  })

  it('[played-games] empties with the scores when the game is played again', () => {
    const room = roomOfTwoGames()

    playRound({ awards: [award('Ada', 40_000)], entry: 'buzzer', room })
    finishGame(room, NOW)
    restartGame(room, NOW)
    expect(playedGamesOn(room)).toEqual([])

    playRound({ awards: [], entry: 'buzzer', room })
    expect(playedGamesOn(room)[0]?.totals).toEqual([])
  })
})
