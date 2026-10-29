import type React from 'react'

import { UNIT_OF_FAMILY } from '@melee/protocol/estimate'
import type {
  HigherLowerPair,
  HigherLowerPicks,
  HigherLowerSide,
  SentHigherLowerSheet,
  ValuedHigherLowerPair
} from '@melee/protocol/higher-lower'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

import { higherSideOf } from '@melee/core/higherlower/pair-deal'

import { useI18n } from '@/presentation/i18n/i18n-provider'

import { CheckIcon, CrossIcon } from './icons'
import { Pawn } from './pawn'
import { useShortQuantityWords } from './use-quantity-words'
import { VisuallyHidden } from './visually-hidden'

import './higher-lower-pairs.sass'

const SIDES = ['left', 'right'] as const satisfies readonly HigherLowerSide[]

type HigherLowerPairsProps = {
  /** The five pairs as dealt; with their values once the round is revealed, which marks the higher side of each. */
  pairs: readonly HigherLowerPair[] | readonly ValuedHigherLowerPair[]
  /** The seats' places in the roster, which colour their pawns. */
  players: readonly PublicPlayer[]
  /** Every seat's sheet, a pawn under each side it picked; empty draws no pawns, as a seat's own screen does. */
  sheets: readonly SentHigherLowerSheet[]
  /** The reader's own seat, whose pawn is ringed; `null` on a screen that holds none. */
  youId: PlayerId | null
  /** The reader's own picks, each marked right or wrong on its side; `null` for a screen that sent none. */
  yourPicks: HigherLowerPicks | null
}

const isValued = (
  pair: HigherLowerPair | ValuedHigherLowerPair
): pair is ValuedHigherLowerPair => 'leftValue' in pair

/**
 * The five pairs one under the other, each asked in its family's words: the
 * names alone while the sheets are out, which is what the table argues over,
 * and both values with the higher side inked once they are in.
 */
export const HigherLowerPairs: React.FC<HigherLowerPairsProps> = ({
  pairs,
  players,
  sheets,
  youId,
  yourPicks
}) => {
  const { locale, translate } = useI18n()
  const quantityWords = useShortQuantityWords()

  return (
    <ol className='higher-lower-pairs'>
      {pairs.map((pair, index) => {
        const higher = isValued(pair)
          ? higherSideOf({
              left: { value: pair.leftValue },
              right: { value: pair.rightValue }
            })
          : null
        const yours = yourPicks?.[index] ?? null

        return (
          <li
            data-revealed={higher !== null || undefined}
            key={`${pair.left.en}|${pair.right.en}`}
          >
            <p className='asks'>
              {translate(`higherlower.asks.${pair.family}`)}
            </p>
            <div className='sides'>
              {SIDES.map((side) => {
                const isYours = yours === side
                const isRight = isYours && higher !== null && higher === side
                const pickers = sheets.filter(
                  (sheet) => sheet.picks[index] === side
                )

                return (
                  <div
                    className='side'
                    data-higher={higher === side || undefined}
                    data-mark={
                      !isYours || higher === null
                        ? undefined
                        : isRight
                          ? 'right'
                          : 'wrong'
                    }
                    data-yours={isYours || undefined}
                    key={side}
                  >
                    <span className='name'>{pair[side][locale]}</span>
                    {isValued(pair) && (
                      <span className='value'>
                        {quantityWords(
                          side === 'left' ? pair.leftValue : pair.rightValue,
                          UNIT_OF_FAMILY[pair.family]
                        )}
                      </span>
                    )}
                    {higher === side && (
                      <VisuallyHidden>
                        {translate('higherlower.reveal.higher')}
                      </VisuallyHidden>
                    )}
                    {isYours && (
                      <span className='pick'>
                        {higher !== null &&
                          (isRight ? <CheckIcon /> : <CrossIcon />)}
                        <VisuallyHidden>
                          {translate('higherlower.reveal.yourPick')}
                        </VisuallyHidden>
                      </span>
                    )}
                    {pickers.length > 0 && (
                      <ul aria-hidden='true' className='pickers'>
                        {pickers.map((sheet) => (
                          <li
                            data-yours={sheet.playerId === youId || undefined}
                            key={sheet.playerId}
                          >
                            <Pawn
                              seat={players.findIndex(
                                (player) => player.id === sheet.playerId
                              )}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
