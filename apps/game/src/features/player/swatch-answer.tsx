import type React from 'react'
import { useState } from 'react'

import type { LeanAnswer } from '@melee/protocol/client-message'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'
import type { ColourHex } from '@melee/protocol/swatch'

import { fadeOffACopyOfTheForm } from '@/features/player/form-leaving-copy'
import { swatchContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import {
  ColourPicker,
  PICKER_START_COLOUR
} from '@/presentation/components/colour-picker'
import { SwatchChip } from '@/presentation/components/swatch-chip'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'
import { useLean } from './use-lean'

import './swatch-answer.sass'

type SwatchAnswerProps = {
  /** What is left of the round's clock on the last snapshot, `null` while nothing counts down. */
  closesInMs: number | null
  /** `false` where a card above already says the colour has hidden. */
  isCaptioned?: boolean
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  /** Saves where the picker stands, which the round takes if it runs out before the press. */
  onLean: ((answer: LeanAnswer | null) => boolean) | null
  round: RoundView
  /** The seat answering: a player's, a seated console's, or the wall's team. */
  youId: PlayerId | null
}

/**
 * The colour rebuilt on the picker and sent once by the press beside the chip
 * that previews it: a colour is one shot a seat, like a pick.
 *
 * Mounted under `key={round.id}`, so every round opens on the neutral grey.
 */
export const SwatchAnswer: React.FC<SwatchAnswerProps> = ({
  closesInMs,
  isCaptioned = true,
  onAnswer,
  onLean,
  round,
  youId
}) => {
  const translate = useTranslate()
  const leaning = useLean({ closesInMs, onLean })
  const [colour, setColour] = useState<ColourHex>(PICKER_START_COLOUR)
  const [sentColour, setSentColour] = useState<ColourHex | null>(null)
  // The server's record is what survives a reload, and it carries the colour
  // back with it.
  const sent = sentColour ?? swatchContent(round)?.yourColour ?? null
  const hasAnswered =
    sent !== null || round.answers.some((answer) => answer.playerId === youId)

  if (hasAnswered) {
    return (
      <section className='answer-form swatch-answer' data-sent>
        <SwatchChip
          className='yours'
          colour={sent}
          label={translate('swatch.answer.label')}
        />
        <p className='hint' role='status'>
          {translate('swatch.answer.sent')}
        </p>
      </section>
    )
  }

  return (
    <section className='answer-form swatch-answer'>
      <div className='workbench'>
        {isCaptioned && <p className='hint'>{translate('swatch.hidden')}</p>}
        <ColourPicker
          hueLabel={translate('swatch.answer.hue')}
          onChange={(next) => {
            setColour(next)
            leaning.lean({ colour: next, kind: 'colour' })
          }}
          toneLabel={translate('swatch.answer.tone')}
        />
        <div className='send'>
          <SwatchChip
            className='preview'
            colour={colour}
            label={translate('swatch.answer.label')}
          />
          <Button
            onPress={(event) => {
              leaning.cancel()

              if (onAnswer({ colour, kind: 'colour' })) {
                fadeOffACopyOfTheForm(event.target)
                setSentColour(colour)
              }
            }}
            size='large'
          >
            {translate('swatch.answer.send')}
          </Button>
        </div>
      </div>
    </section>
  )
}
