import type React from 'react'
import {
  FieldError,
  Label,
  RadioButton,
  RadioField,
  RadioGroup,
  Text
} from 'react-aria-components'

import { PAWN_COLOUR_COUNT } from '@melee/protocol/team'

import { isPawnColourFree } from '@melee/core/board/pawn-colour'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { pawnColourKey } from '@/presentation/i18n/translation'

import { Pawn } from './pawn'
import { VisuallyHidden } from './visually-hidden'

import './pawn-colour-picker.sass'

const PAWN_COLOURS = Array.from(
  { length: PAWN_COLOUR_COUNT },
  (_, index) => index + 1
)

/** Another pawn on the table: the colour it stands in, and whom it stands for. */
export type PawnHolder = {
  colour: number
  /**
   * Read out beside the struck colour — a nickname, a team's own name — and
   * `null` for a team named after its colour, which would say it twice.
   */
  name: string | null
}

export type PawnColourPickerProps = {
  /** The colour the pawn stands in now, held in an ink keyline. */
  colour: number
  /** Printed under the twelve: what picking changes, or why nothing can be picked now. */
  description?: string
  /** The server's last refusal, in words; it replaces the description. */
  errorMessage?: string
  /** Every other pawn on the table, whose colours are struck through. */
  holders: readonly PawnHolder[]
  /** Nothing can be picked: a round is in play. Say why in `description`. */
  isDisabled?: boolean
  /** Keeps the name for a screen reader alone, under a heading that already prints it. */
  isLabelHidden?: boolean
  /** Names the twelve. */
  label: string
  /** Sent with the colour picked; the server has the last word on it. */
  onRecolour: (colour: number) => void
  /**
   * A seat may stand in a colour another holds once all twelve are held, as
   * the server allows past twelve seats; a team never shares one.
   */
  sharesWhenFull: boolean
}

/**
 * The twelve pawns, six to a row, to stand a pawn in. A colour somebody else
 * holds stays on the sheet, struck and out of reach, so the sheet shows the
 * whole box rather than a set that shrinks as the table picks. Once a seat
 * finds all twelve held none is struck, since any may be shared: the initial
 * on the pawn tells two seats apart, and a screen reader still hears who holds
 * each.
 */
export const PawnColourPicker: React.FC<PawnColourPickerProps> = ({
  colour,
  description,
  errorMessage,
  holders,
  isDisabled,
  isLabelHidden,
  label,
  onRecolour,
  sharesWhenFull
}) => {
  const translate = useTranslate()
  const heldByOthers = holders.map((holder) => holder.colour)

  const describe = (candidate: number): string => {
    const colourName = translate(pawnColourKey(candidate))
    const names = holders.flatMap((holder) =>
      holder.colour === candidate && holder.name !== null ? [holder.name] : []
    )

    if (!heldByOthers.includes(candidate)) {
      return colourName
    }

    return names.length === 0
      ? translate('pawn.taken', { colour: colourName })
      : translate('pawn.takenBy', {
          colour: colourName,
          holder: names.join(', ')
        })
  }

  return (
    <RadioGroup
      className='pawn-colour-picker'
      isDisabled={isDisabled}
      isInvalid={errorMessage !== undefined}
      onChange={(value) => {
        onRecolour(Number(value))
      }}
      orientation='horizontal'
      value={`${colour}`}
    >
      {isLabelHidden === true ? (
        <VisuallyHidden>
          <Label>{label}</Label>
        </VisuallyHidden>
      ) : (
        <Label>{label}</Label>
      )}
      <div className='colours'>
        {PAWN_COLOURS.map((candidate) => {
          const isTaken = sharesWhenFull
            ? !isPawnColourFree({ colour: candidate, heldByOthers })
            : heldByOthers.includes(candidate)

          return (
            <RadioField
              className='colour-field'
              isDisabled={isTaken}
              key={candidate}
              value={`${candidate}`}
            >
              <RadioButton className='colour' data-taken={isTaken || undefined}>
                <Pawn colour={candidate} />
                <VisuallyHidden elementType='span'>
                  {describe(candidate)}
                </VisuallyHidden>
              </RadioButton>
            </RadioField>
          )
        })}
      </div>
      {description !== undefined && errorMessage === undefined && (
        <Text slot='description'>{description}</Text>
      )}
      <FieldError>
        {errorMessage === undefined ? undefined : (
          <span role='alert'>{errorMessage}</span>
        )}
      </FieldError>
    </RadioGroup>
  )
}
