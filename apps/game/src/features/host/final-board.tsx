import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { winnersOf } from '@melee/core/scoring/scoreboard'
import {
  isEveryTeamItsOwnSeat,
  teamWinnersOf
} from '@melee/core/team/team-board'

import { answerFitting } from '@/helpers/answer-fitting'
import { shownPoints } from '@/helpers/shown-points'
import { Pawn } from '@/presentation/components/pawn'
import { SeatPodium } from '@/presentation/components/seat-podium'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import { ScoreTrack } from './score-track'
import { Standings, standingsRowsOf } from './standings'

import './final-board.sass'

type FinalBoardProps = {
  players: readonly PublicPlayer[]
  /** When the room plays in teams, the game ends on a team rather than a seat. */
  teams: readonly Team[]
  /** The seat this console took; `null` on the wall and on an unseated console. */
  youId: PlayerId | null
}

/**
 * A game ends on a name, not on a table: the winner's pawn stood up oversize
 * and named, with the standings beside it for each player to find themselves.
 * A team evening adds the best three seats under its winning team.
 *
 * Ties are named rather than broken: competition ranking already shares first
 * place, and inventing a winner out of alphabetical order would be a lie the
 * room can check.
 */
export const FinalBoard: React.FC<FinalBoardProps> = ({
  players,
  teams,
  youId
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const winners =
    teams.length > 0
      ? teamWinnersOf(teams).map((team) => ({
          id: team.id,
          name: teamName(team),
          pawn: <Pawn colour={team.colour} key={team.id} />,
          score: team.score
        }))
      : winnersOf(players).map((winner) => ({
          id: winner.id,
          name: winner.nickname,
          pawn: <Pawn key={winner.id} seat={players.indexOf(winner)} />,
          score: winner.score
        }))
  const topScore = winners[0]?.score ?? 0
  const named = winners.map((winner) => winner.name).join(' · ')

  return (
    <section
      className='final-board'
      style={{
        '--standings-rows': standingsRowsOf({ players, teams })
      }}
    >
      <div className='podium' style={{ '--winner-count': winners.length }}>
        {winners.length === 0 ? (
          <h1 className='nobody'>{translate('host.final.nobody')}</h1>
        ) : (
          <>
            <div className='pawns'>{winners.map((winner) => winner.pawn)}</div>
            <h1 className='winners' style={answerFitting(named)}>
              {named}
            </h1>
            <p className='with'>
              {translate(
                winners.length > 1
                  ? 'host.final.tied'
                  : teams.length > 0
                    ? 'team.final.wins'
                    : 'host.final.wins',
                { points: shownPoints(topScore) }
              )}
            </p>
          </>
        )}
      </div>

      {teams.length > 0 && !isEveryTeamItsOwnSeat({ players, teams }) && (
        <SeatPodium players={players} youId={youId} />
      )}
      <Standings players={players} teams={teams} youId={youId} />
      <ScoreTrack players={players} teams={teams} youId={youId} />
    </section>
  )
}
