import type React from 'react'
import { useState } from 'react'

import type { StickMove, StickPlace } from '@melee/protocol/matchsticks'
import type { RoundView } from '@melee/protocol/room'

import { matchsticksContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { MatchstickBoard } from '@/presentation/components/matchstick-board'
import { MatchstickRow } from '@/presentation/components/matchstick-row'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import type { PlayerAnswer } from './answer-forms'

import './matchsticks-move.sass'

type MatchsticksMoveProps = {
  /**
   * Lays the sticks on the caller's own card, which is the round's: the page
   * that prints the puzzle is the one that knows where its clock goes.
   */
  card: (sticks: React.ReactNode) => React.ReactNode
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  round: RoundView
}

/**
 * One stick picked up and laid on any empty place, as often as the player
 * likes until they send it: a move is one shot a seat, like a pick. Nothing is
 * refused — sticks that read as nothing simply answer nothing, and saying so
 * before the send would be a hint.
 *
 * Mounted under `key={round.id}`, so the move is about this round alone.
 */
export const MatchsticksMove: React.FC<MatchsticksMoveProps> = ({
  card,
  onAnswer,
  round
}) => {
  const translate = useTranslate()
  const content = matchsticksContent(round)
  const [lifted, setLifted] = useState<StickPlace | null>(null)
  const [placed, setPlaced] = useState<StickMove | null>(null)
  const [isSent, setIsSent] = useState(false)
  // Remounts the board with focus on its first stick once a move is put back,
  // since the press that put it back is disabled under the reader.
  const [putBackCount, setPutBackCount] = useState(0)

  if (content === null) {
    return null
  }

  const glyphs = content.puzzle.glyphs
  // The server's copy is what survives a reload.
  const sent = content.yourMove ?? (isSent ? placed : null)

  const hintKey: PlainTranslationKey =
    sent !== null
      ? 'matchsticks.move.sent'
      : lifted !== null
        ? 'matchsticks.move.layDown'
        : placed !== null
          ? 'matchsticks.move.placed'
          : 'matchsticks.move.pickUp'

  return (
    <>
      {card(
        sent !== null ? (
          <MatchstickRow glyphs={glyphs} isStill move={sent} />
        ) : (
          <MatchstickBoard
            aria-label={translate('matchsticks.move.label')}
            autoFocus={putBackCount > 0}
            glyphs={glyphs}
            key={putBackCount}
            lifted={lifted}
            onLift={setLifted}
            onPlace={(move) => {
              setPlaced(move)
              setLifted(null)
            }}
            placed={placed}
          />
        )
      )}
      <section
        className='answer-form matchsticks-move'
        data-sent={sent !== null || undefined}
      >
        <p className='hint' role='status'>
          {translate(hintKey)}
        </p>
        {sent === null && (
          <div className='presses'>
            <Button
              isDisabled={placed === null}
              onPress={() => {
                setPlaced(null)
                setLifted(null)
                setPutBackCount((count) => count + 1)
              }}
              size='large'
              variant='outlined'
            >
              {translate('matchsticks.move.undo')}
            </Button>
            <Button
              autoFocus={placed !== null}
              isDisabled={placed === null}
              key={placed === null ? 'nothing-to-send' : 'ready'}
              onPress={() => {
                if (
                  placed !== null &&
                  onAnswer({ kind: 'move', move: placed })
                ) {
                  setIsSent(true)
                }
              }}
              size='large'
            >
              {translate('matchsticks.move.send')}
            </Button>
          </div>
        )}
      </section>
    </>
  )
}
