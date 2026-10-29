import type React from 'react'
import { useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'
import type { ColourHex } from '@melee/protocol/swatch'

import { swatchContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import {
  ColourPicker,
  PICKER_START_COLOUR
} from '@/presentation/components/colour-picker'
import { SwatchChip } from '@/presentation/components/swatch-chip'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './swatch-answer.sass'

type SwatchAnswerProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
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
  onAnswer,
  round,
  youId
}) => {
  const translate = useTranslate()
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
      <p className='hint'>{translate('swatch.hidden')}</p>
      <ColourPicker
        hueLabel={translate('swatch.answer.hue')}
        onChange={setColour}
        toneLabel={translate('swatch.answer.tone')}
      />
      <div className='send'>
        <SwatchChip
          className='preview'
          colour={colour}
          label={translate('swatch.answer.label')}
        />
        <Button
          onPress={() => {
            if (onAnswer({ colour, kind: 'colour' })) {
              setSentColour(colour)
            }
          }}
          size='large'
        >
          {translate('swatch.answer.send')}
        </Button>
      </div>
    </section>
  )
}
