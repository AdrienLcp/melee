import type React from 'react'

import { CHALLENGE_TEXT_MAX_LENGTH } from '@melee/protocol/challenge'

import type {
  ChallengeChoice,
  ChallengeHandLine
} from '@melee/core/challenge/challenge-hand'

import { Button } from '@/presentation/components/button'
import { ChoiceList } from '@/presentation/components/choice-list'
import {
  AnnounceIcon,
  DiceIcon,
  PenIcon
} from '@/presentation/components/icons'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { ChallengeLine } from './challenge-line'

import './challenge-line-picker.sass'

type ChallengeLinePickerProps = {
  isDisabled: boolean
  line: ChallengeLine
}

const TYPED = 'typed'
const ALOUD = 'aloud'

const choiceValueOf = (choice: ChallengeChoice): string =>
  choice.kind === 'line' ? String(choice.at) : choice.kind

const choiceOf = (value: string): ChallengeChoice => {
  switch (value) {
    case TYPED:
      return { kind: 'typed' }
    case ALOUD:
      return { kind: 'aloud' }
    default:
      return { at: Number(value), kind: 'line' }
  }
}

/**
 * The line the next challenge round opens on, picked from a hand — the host's
 * own lines first, then the bank's — or written, or said aloud.
 */
export const ChallengeLinePicker: React.FC<ChallengeLinePickerProps> = ({
  isDisabled,
  line
}) => {
  const translate = useTranslate()

  const handOption = (card: ChallengeHandLine, at: number) => ({
    aside: (
      <Button
        aria-label={translate('challenge.line.redeal')}
        className='redeal'
        isDisabled={isDisabled}
        onPress={() => {
          line.onRedeal(at)
        }}
        size='small'
        variant='outlined'
      >
        <DiceIcon />
      </Button>
    ),
    label: (
      <>
        {card.text}
        {card.kind === 'own' && (
          <span className='own-mark'>
            <PenIcon />
            {translate('challenge.hand.own')}
          </span>
        )}
      </>
    ),
    textValue: card.text,
    value: String(at)
  })

  return (
    <div className='challenge-line-picker'>
      <ChoiceList
        isDisabled={isDisabled}
        label={translate('challenge.line.label')}
        onChange={(value) => {
          line.onChoose(choiceOf(value))
        }}
        options={[
          ...line.hand.map(handOption),
          {
            aside: (
              <TextField
                autoComplete='off'
                className='typed-line'
                isDisabled={isDisabled}
                isMultiline
                label={translate('challenge.hand.write')}
                maxLength={CHALLENGE_TEXT_MAX_LENGTH}
                name='challengeText'
                onChange={line.onChange}
                onFocus={() => {
                  line.onChoose({ kind: 'typed' })
                }}
                placeholder={translate('challenge.hand.writePlaceholder')}
                value={line.text}
              />
            ),
            textValue: translate('challenge.hand.write'),
            value: TYPED
          },
          {
            isRecessed: true,
            label: (
              <span className='aloud'>
                <AnnounceIcon />
                {translate('challenge.hand.aloud')}
              </span>
            ),
            textValue: translate('challenge.hand.aloud'),
            value: ALOUD
          }
        ]}
        value={choiceValueOf(line.choice)}
      />
      {line.hand.length === 0 && (
        <p className='spent'>{translate('challenge.hand.spent')}</p>
      )}
    </div>
  )
}
