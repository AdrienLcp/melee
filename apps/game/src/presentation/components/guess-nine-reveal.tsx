import type React from 'react'

import type { RevealedGuessNine } from '@melee/protocol/guess-nine'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

import { useI18n } from '@/presentation/i18n/i18n-provider'

import { GuessNinePips, pointsOfTier } from './guess-nine-pips'
import { Pawn } from './pawn'
import { VisuallyHidden } from './visually-hidden'

import './guess-nine-reveal.sass'

type GuessNineRevealProps = {
  players: readonly PublicPlayer[]
  revealed: RevealedGuessNine
  /** The seat reading it, whose own cells take the *yours* keyline; `null` on the room's screen. */
  youId: PlayerId | null
}

/**
 * The grid turned over: nine paper cards in cell order — the name, its pips
 * and what it pays, the pawns of whoever found it, a socket for one nobody did
 * — and the black word beside them as a tall ink card, with why it is wrong
 * and who lost the round on it.
 */
export const GuessNineReveal: React.FC<GuessNineRevealProps> = ({
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
    <div className='guess-nine-reveal'>
      <div className='board'>
        <ol aria-label={translate('guessnine.grid')} className='answers'>
          {revealed.answers.map((answer) => {
            const isYours = youId !== null && answer.foundBy.includes(youId)

            return (
              <li
                data-nobody={answer.foundBy.length === 0 || undefined}
                data-yours={isYours || undefined}
                key={answer.labels.en}
              >
                <span className='name'>{answer.labels[locale]}</span>
                <span className='foot'>
                  <span className='finders'>
                    {answer.foundBy.length === 0 ? (
                      <span className='missed-by-all'>
                        {translate('guessnine.nobody')}
                      </span>
                    ) : (
                      answer.foundBy.map((playerId) => (
                        <Pawn key={playerId} seat={seatOf(playerId)} />
                      ))
                    )}
                    <VisuallyHidden>
                      {answer.foundBy.map(nameOf).join(', ')}
                      {isYours && ` — ${translate('guessnine.yours')}`}
                    </VisuallyHidden>
                  </span>
                  <span className='worth'>
                    <GuessNinePips tier={answer.tier} />
                    <span aria-hidden='true'>
                      {translate('round.scored', {
                        points: pointsOfTier(answer.tier)
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
            {translate('guessnine.blackWord.stamp')}
          </span>
          <span className='word'>{revealed.blackWord.labels[locale]}</span>
          <span className='why'>{revealed.blackWord.why[locale]}</span>
          {fell.length === 0 ? (
            <span className='fell'>
              {translate('guessnine.blackWord.nobodyFell')}
            </span>
          ) : (
            fell.map((playerId) => (
              <span className='fell' key={playerId}>
                <Pawn seat={seatOf(playerId)} />
                {translate('guessnine.blackWord.fell', {
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
