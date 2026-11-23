import type React from 'react'
import { useId } from 'react'

import type { GameSettings } from '@melee/protocol/game'
import type { PlayedGame } from '@melee/protocol/played-game'
import type { PublicPlayer } from '@melee/protocol/room'

import { bestPerGame } from '@melee/core/scoring/best-per-game'

import { shownPoints } from '@/helpers/shown-points'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { playedRoundName } from '@/presentation/i18n/line-up-entry-names'
import { gameNameKey } from '@/presentation/i18n/translation'

import { GameIcon } from './icons'
import { Pawn } from './pawn'
import { SectionHeading } from './section-heading'

import './best-per-game.sass'

type BestPerGameProps = {
  /** The room's line-up, which names each entry the way its reveals were headed. */
  lineUp: readonly GameSettings[]
  playedGames: readonly PlayedGame[]
  players: readonly PublicPlayer[]
}

/**
 * Who played each game of the evening best: one tile per line-up entry played,
 * the game's glyph on its spine, the best seat's pawn and name, and what that
 * seat earned a round on it. Nothing to say in an evening of one entry, which
 * the podium already crowns.
 */
export const BestPerGame: React.FC<BestPerGameProps> = ({
  lineUp,
  playedGames,
  players
}) => {
  const translate = useTranslate()
  const titleId = useId()

  if (playedGames.length < 2) {
    return null
  }

  const bests = bestPerGame({
    games: playedGames,
    seatIds: players.map((player) => player.id)
  })

  return (
    <section aria-labelledby={titleId} className='best-per-game'>
      <SectionHeading id={titleId}>
        {translate('round.bestPerGame.title')}
      </SectionHeading>
      <ol>
        {bests.map(({ average, bestIds, game }, at) => {
          const name =
            playedRoundName({
              lineUp,
              round: { content: { kind: game.kind }, lineUpAt: game.lineUpAt },
              translate
            }) ?? translate(gameNameKey(game.kind))
          const best = bestIds.flatMap((id) => {
            const seat = players.findIndex((player) => player.id === id)

            return seat === -1 ? [] : [{ id, seat }]
          })

          return (
            <li
              key={`${game.kind}-${game.lineUpAt ?? at}`}
              style={{
                '--spine': `var(--spine-${game.kind})`,
                '--spine-ink': `var(--on-spine-${game.kind})`,
                '--tile-at': at
              }}
            >
              <span className='game'>
                <span className='spine-mark'>
                  <GameIcon game={game.kind} />
                </span>
                <span className='game-name'>{name}</span>
              </span>
              {best.length === 0 ? (
                <span className='best nobody'>
                  {translate('host.final.nobody')}
                </span>
              ) : (
                <>
                  <span className='pawns'>
                    {best.map(({ id, seat }) => (
                      <Pawn key={id} seat={seat} />
                    ))}
                  </span>
                  <span className='best'>
                    {best
                      .map(({ seat }) => players[seat]?.nickname ?? '')
                      .join(' · ')}
                  </span>
                  <span className='average'>
                    {translate('round.bestPerGame.average', {
                      points: shownPoints(average)
                    })}
                  </span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
