import type React from 'react'
import { useState } from 'react'

import type { StickMove, StickPlace } from '@melee/protocol/matchsticks'
import type { RoundView } from '@melee/protocol/room'

import { applyMove } from '@melee/core/matchsticks/one-move'

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

/** A move the reader made, drawn where it landed. */
const MovedRow: React.FC<{ glyphs: string; move: StickMove }> = ({
  glyphs,
  move
}) => (
  <MatchstickRow
    glyphs={applyMove({ glyphs, move }) ?? glyphs}
    isStill
    move={move}
  />
)

/**
 * One stick picked up and laid somewhere else, as often as the player likes
 * until they send it: a move is one shot a seat, like a pick. A drop the sticks
 * cannot make is refused here, by the same rule the server judges with, before
 * anything is sent.
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
  const [isRefused, setIsRefused] = useState(false)
  const [isSent, setIsSent] = useState(false)
  // Where focus goes when the board or the send press replaces what held it.
  const [wasPutBack, setWasPutBack] = useState(false)

  if (content === null) {
    return null
  }

  const glyphs = content.puzzle.glyphs
  // The server's copy is what survives a reload.
  const sent = content.yourMove ?? (isSent ? placed : null)

  const lay = (to: StickPlace): void => {
    if (lifted === null) {
      return
    }

    const move = { from: lifted, to }

    if (applyMove({ glyphs, move }) === null) {
      setIsRefused(true)

      return
    }

    setPlaced(move)
    setLifted(null)
    setIsRefused(false)
  }

  const hintKey: PlainTranslationKey =
    sent !== null
      ? 'matchsticks.move.sent'
      : isRefused
        ? 'error.illegal_move'
        : placed !== null
          ? 'matchsticks.move.placed'
          : lifted !== null
            ? 'matchsticks.move.layDown'
            : 'matchsticks.move.pickUp'

  return (
    <>
      {card(
        sent !== null ? (
          <MovedRow glyphs={glyphs} move={sent} />
        ) : placed !== null ? (
          <MovedRow glyphs={glyphs} move={placed} />
        ) : (
          <MatchstickBoard
            aria-label={translate('matchsticks.move.label')}
            autoFocus={wasPutBack}
            glyphs={glyphs}
            lifted={lifted}
            onLay={lay}
            onLift={(place) => {
              setLifted(place)
              setIsRefused(false)
            }}
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
                setWasPutBack(true)
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
