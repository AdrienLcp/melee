import type React from 'react'

import { CHALLENGE_TEXT_MAX_LENGTH } from '@melee/protocol/challenge'

import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

type ChallengeLineFieldProps = {
  isDisabled: boolean
  onChange: (text: string) => void
  /** What the next challenge round will ask the table, sent with the press that opens it. */
  value: string
}

/** What the table is about to be asked to do, typed beside the press that opens the round. */
export const ChallengeLineField: React.FC<ChallengeLineFieldProps> = ({
  isDisabled,
  onChange,
  value
}) => {
  const translate = useTranslate()

  return (
    <TextField
      autoComplete='off'
      className='challenge-line-field'
      description={translate('challenge.line.description')}
      isDisabled={isDisabled}
      label={translate('challenge.line.label')}
      maxLength={CHALLENGE_TEXT_MAX_LENGTH}
      name='challengeText'
      onChange={onChange}
      placeholder={translate('challenge.line.placeholder')}
      value={value}
    />
  )
}
