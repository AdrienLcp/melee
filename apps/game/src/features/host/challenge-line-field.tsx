import type React from 'react'

import { CHALLENGE_TEXT_MAX_LENGTH } from '@melee/protocol/challenge'

import { Button } from '@/presentation/components/button'
import { DiceIcon } from '@/presentation/components/icons'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './challenge-line-field.sass'

type ChallengeLineFieldProps = {
  /**
   * The line the server dealt ahead, in this screen's language: what the round
   * opens on while the field is empty. `null` once the bank is spent.
   */
  dealtLine: string | null
  isDisabled: boolean
  onChange: (text: string) => void
  /** Asks for another dealt line in place of `dealtLine`. */
  onRedeal: () => void
  /** What the host typed, sent with the press that opens the round and winning over the dealt line. */
  value: string
}

/** What the table is about to be asked to do: dealt, redealt or typed beside the press that opens the round. */
export const ChallengeLineField: React.FC<ChallengeLineFieldProps> = ({
  dealtLine,
  isDisabled,
  onChange,
  onRedeal,
  value
}) => {
  const translate = useTranslate()

  return (
    <div className='challenge-line-field'>
      <TextField
        autoComplete='off'
        isDisabled={isDisabled}
        isMultiline
        label={translate('challenge.line.label')}
        maxLength={CHALLENGE_TEXT_MAX_LENGTH}
        name='challengeText'
        onChange={onChange}
        placeholder={dealtLine ?? translate('challenge.line.placeholder')}
        value={value}
      />
      <Button
        aria-label={translate('challenge.line.redeal')}
        className='redeal'
        isDisabled={isDisabled || dealtLine === null}
        onPress={onRedeal}
        variant='outlined'
      >
        <DiceIcon />
      </Button>
      <p className='description'>
        {translate(
          dealtLine === null
            ? 'challenge.line.aloud'
            : 'challenge.line.description'
        )}
      </p>
    </div>
  )
}
