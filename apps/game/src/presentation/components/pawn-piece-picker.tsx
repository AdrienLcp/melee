import type React from 'react'
import { useState } from 'react'
import {
  FieldError,
  Label,
  RadioButton,
  RadioField,
  RadioGroup,
  Text
} from 'react-aria-components'

import {
  PAWN_COLOUR_COUNT,
  PAWN_HEADS,
  type PawnHead,
  type PawnPiece
} from '@melee/protocol/team'

import {
  isPawnPieceFree,
  isSamePawnPiece,
  TEAM_PAWN_HEAD
} from '@melee/core/board/pawn-piece'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { pawnColourKey } from '@/presentation/i18n/translation'
import { usePawnPieceName } from '@/presentation/i18n/use-pawn-piece-name'

import { Pawn } from './pawn'
import { VisuallyHidden } from './visually-hidden'

import './pawn-piece-picker.sass'

const PAWN_COLOURS = Array.from(
  { length: PAWN_COLOUR_COUNT },
  (_, index) => index + 1
)

const HEADS_OFFERED = {
  seat: PAWN_HEADS,
  team: [TEAM_PAWN_HEAD]
} as const satisfies Record<'seat' | 'team', readonly PawnHead[]>

const radioValueOf = (piece: PawnPiece): string =>
  `${piece.colour}:${piece.head}`

/** Another pawn on the table: the piece it stands as, and whom it stands for. */
export type PawnHolder = {
  /**
   * Read out beside the struck piece — a nickname, a team's own name — and
   * `null` for a team named after its colour, which would say it twice.
   */
  name: string | null
  piece: PawnPiece
}

export type PawnPiecePickerProps = {
  /** Printed under the pieces: what picking changes, or why nothing can be picked now. */
  description?: string
  /** The server's last refusal, in words; the description folds away for it. */
  errorMessage?: string
  /** Every other pawn on the table, whose pieces are struck through. */
  holders: readonly PawnHolder[]
  /** Nothing can be picked: a round is in play. Say why in `description`. */
  isDisabled?: boolean
  /** Keeps the name for a screen reader alone, under a heading that already prints it. */
  isLabelHidden?: boolean
  /** Names the pieces. */
  label: string
  /** Sent with the piece picked; the server has the last word on it. */
  onRecolour: (piece: PawnPiece) => void
  /**
   * Whose pawn is picked: a seat's, among its thirty-six pieces in three groups
   * of heads, or a team's, among the twelve colours in the round head it always
   * wears — named then by the colour alone.
   */
  pawnOf: 'seat' | 'team'
  /** The piece the pawn stands as now, held in an ink keyline. */
  piece: PawnPiece
}

/**
 * The pieces to stand a pawn as, six to a row and grouped by head — round,
 * square, then pointed. A piece somebody else holds stays on the sheet, struck
 * and out of reach, so the sheet shows the whole box rather than a set that
 * shrinks as the table picks; a screen reader still hears who holds each.
 */
export const PawnPiecePicker: React.FC<PawnPiecePickerProps> = ({
  description,
  errorMessage,
  holders,
  isDisabled,
  isLabelHidden,
  label,
  onRecolour,
  pawnOf,
  piece
}) => {
  const translate = useTranslate()
  const heads = HEADS_OFFERED[pawnOf]
  const pieceName = usePawnPieceName()
  const [leavingError, setLeavingError] = useState(errorMessage)
  const heldByOthers = holders.map((holder) => holder.piece)
  const candidates = heads.flatMap((head) =>
    PAWN_COLOURS.map((colour): PawnPiece => ({ colour, head }))
  )

  const describe = (candidate: PawnPiece): string => {
    const name =
      pawnOf === 'seat'
        ? pieceName(candidate)
        : translate(pawnColourKey(candidate.colour))
    const holderNames = holders.flatMap((holder) =>
      holder.name !== null &&
      isSamePawnPiece({ other: holder.piece, piece: candidate })
        ? [holder.name]
        : []
    )

    if (isPawnPieceFree({ heldByOthers, piece: candidate })) {
      return name
    }

    return holderNames.length === 0
      ? translate('pawn.taken', { pawn: name })
      : translate('pawn.takenBy', {
          holder: holderNames.join(', '),
          pawn: name
        })
  }

  const isInvalid = errorMessage !== undefined

  if (isInvalid && errorMessage !== leavingError) {
    setLeavingError(errorMessage)
  }

  return (
    <RadioGroup
      className='pawn-piece-picker'
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      onChange={(value) => {
        const picked = candidates.find(
          (candidate) => radioValueOf(candidate) === value
        )

        if (picked !== undefined) {
          onRecolour(picked)
        }
      }}
      orientation='horizontal'
      value={radioValueOf(piece)}
    >
      {isLabelHidden === true ? (
        <VisuallyHidden>
          <Label>{label}</Label>
        </VisuallyHidden>
      ) : (
        <Label>{label}</Label>
      )}
      {heads.map((head) => (
        <div className='pieces' key={head}>
          {candidates
            .filter((candidate) => candidate.head === head)
            .map((candidate) => {
              const isTaken = !isPawnPieceFree({
                heldByOthers,
                piece: candidate
              })

              return (
                <RadioField
                  className='piece-field'
                  isDisabled={isTaken}
                  key={candidate.colour}
                  value={radioValueOf(candidate)}
                >
                  <RadioButton
                    className='piece'
                    data-taken={isTaken || undefined}
                  >
                    <Pawn colour={candidate.colour} head={candidate.head} />
                    <VisuallyHidden elementType='span'>
                      {describe(candidate)}
                    </VisuallyHidden>
                  </RadioButton>
                </RadioField>
              )
            })}
        </div>
      ))}
      {description !== undefined && (
        <Text
          className='react-aria-Text fold'
          data-open={!isInvalid || undefined}
          inert={isInvalid}
          slot='description'
        >
          <span>{description}</span>
        </Text>
      )}
      <div
        className='fold'
        data-open={isInvalid || undefined}
        inert={!isInvalid}
      >
        <div>
          {isInvalid ? (
            <FieldError>
              <span role='alert'>{errorMessage}</span>
            </FieldError>
          ) : (
            <span className='react-aria-FieldError'>{leavingError}</span>
          )}
        </div>
      </div>
    </RadioGroup>
  )
}
