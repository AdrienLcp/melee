import type React from 'react'

import type { RevealedBlackSquare } from '@melee/protocol/black-square'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

import { LONE_FIND_MULTIPLIER } from '@melee/core/blacksquare/sheet-pay'

import { blackSquareCellStyle } from '@/helpers/black-square-cell-place'
import { shownPoints } from '@/helpers/shown-points'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { BlackSquarePips, pointsOfTier } from './black-square-pips'
import { Pawn } from './pawn'
import { VisuallyHidden } from './visually-hidden'

import './black-square-reveal.sass'

type BlackSquareRevealProps = {
  players: readonly PublicPlayer[]
  revealed: RevealedBlackSquare
  /** The seat reading it, whose own cells take the *yours* keyline; `null` on the room's screen. */
  youId: PlayerId | null
}

/**
 * The grid turned over: a paper card per answer, one tier a row — the name, its pips
 * and what it pays, the pawns of whoever found it, a socket for one nobody did,
 * an ink tag on one a seat alone found when the round paid that double — and
 * the black word beside them as a tall ink card, with why it is wrong
 * and who lost the round on it.
 */
export const BlackSquareReveal: React.FC<BlackSquareRevealProps> = ({
  players,
  revealed,
  youId
}) => {
  const { locale, translate } = useI18n()
  const seatOf = (playerId: PlayerId): number =>
    players.findIndex((player) => player.id === playerId)
  const nameOf = (playerId: PlayerId): string =>
    players.find((player) => player.id === playerId)?.nickname ?? '—'
  const fell = revealed.blackWord.hitBy

  return (
    <div className='black-square-reveal'>
      <div className='board'>
        <ol aria-label={translate('blacksquare.grid')} className='answers'>
          {revealed.answers.map((answer, cell) => {
            const isYours = youId !== null && answer.foundBy.includes(youId)
            const isDoubled =
              revealed.doublesLoneFinds && answer.foundBy.length === 1

            return (
              <li
                data-doubled={isDoubled || undefined}
                data-nobody={answer.foundBy.length === 0 || undefined}
                data-yours={isYours || undefined}
                key={answer.labels.en}
                style={blackSquareCellStyle({
                  cell,
                  cellCount: revealed.answers.length
                })}
              >
                <span className='name'>{answer.labels[locale]}</span>
                <span className='foot'>
                  <span className='finders'>
                    {answer.foundBy.length === 0 ? (
                      <span className='missed-by-all'>
                        {translate('blacksquare.nobody')}
                      </span>
                    ) : (
                      answer.foundBy.map((playerId) => (
                        <Pawn key={playerId} seat={seatOf(playerId)} />
                      ))
                    )}
                    <VisuallyHidden>
                      {answer.foundBy.map(nameOf).join(', ')}
                      {isYours && ` — ${translate('blacksquare.yours')}`}
                      {isDoubled &&
                        ` — ${translate('blacksquare.lone.said')}, ${translate(
                          'blacksquare.tier',
                          {
                            points: shownPoints(
                              pointsOfTier(answer.tier) * LONE_FIND_MULTIPLIER
                            )
                          }
                        )}`}
                    </VisuallyHidden>
                  </span>
                  <span className='worth'>
                    {/* In the pips' place, so a lone find takes no width a long name needs. */}
                    {isDoubled ? (
                      <span aria-hidden='true' className='doubled'>
                        {translate('blacksquare.lone.doubled')}
                      </span>
                    ) : (
                      <BlackSquarePips tier={answer.tier} />
                    )}
                    <span aria-hidden='true'>
                      {translate('round.scored', {
                        points: shownPoints(
                          pointsOfTier(answer.tier) *
                            (isDoubled ? LONE_FIND_MULTIPLIER : 1)
                        )
                      })}
                    </span>
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
        <aside className='black-word-piece'>
          <span className='stamp'>
            {translate('blacksquare.blackWord.stamp')}
          </span>
          <span className='word'>{revealed.blackWord.labels[locale]}</span>
          <span className='why'>{revealed.blackWord.why[locale]}</span>
          {fell.length === 0 ? (
            <span className='fell'>
              {translate('blacksquare.blackWord.nobodyFell')}
            </span>
          ) : (
            fell.map((playerId) => (
              <span className='fell' key={playerId}>
                <Pawn seat={seatOf(playerId)} />
                {translate('blacksquare.blackWord.fell', {
                  nickname: nameOf(playerId)
                })}
              </span>
            ))
          )}
        </aside>
      </div>
    </div>
  )
}
