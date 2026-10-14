import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useState } from 'react'
import { Form, type FormProps } from 'react-aria-components'

import { NICKNAME_MAX_LENGTH } from '@taverla/protocol/identifiers'

import { readStoredNickname } from '@/infrastructure/storage/preferences-storage'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { TextField } from './text-field'

import './play-right-away.sass'

type PlayRightAwayProps = Omit<FormProps, 'children' | 'onSubmit'> & {
  /** The socket or the network is not there to carry the press. */
  isDisabled?: boolean
  /** The press is on its way: the room is opening, or the seat being taken. */
  isPending?: boolean
  /** Called with the name to play under, already trimmed. */
  onPlay: (nickname: string) => void
}

const storedNicknameOrNone = (): string => {
  const stored = readStoredNickname()

  return stored.status === 'success' ? (stored.data ?? '') : ''
}

/**
 * One press from here to a round on screen, under the name this device already
 * answers to — written under the button with a way to change it, so whoever
 * presses knows what the table will call them. A device that has never been
 * given one asks for it here and only here: the press waits for it, and Enter
 * in the field is the press.
 */
export const PlayRightAway: React.FC<PlayRightAwayProps> = ({
  className,
  isDisabled = false,
  isPending = false,
  onPlay,
  ...props
}) => {
  const translate = useTranslate()
  const [remembered] = useState(storedNicknameOrNone)
  const [draft, setDraft] = useState(remembered)
  const [isNaming, setIsNaming] = useState(remembered === '')
  const nickname = draft.trim()

  return (
    <Form
      {...props}
      className={classNames('play-right-away', className)}
      onSubmit={(event) => {
        event.preventDefault()

        if (nickname !== '' && !isDisabled && !isPending) {
          onPlay(nickname)
        }
      }}
    >
      {isNaming && (
        <TextField
          autoComplete='nickname'
          autoFocus={remembered !== ''}
          enterKeyHint='go'
          label={translate('join.rightAway.name')}
          maxLength={NICKNAME_MAX_LENGTH}
          onChange={setDraft}
          value={draft}
        />
      )}
      <Button
        isDisabled={isDisabled || nickname === ''}
        isPending={isPending}
        size='large'
        type='submit'
      >
        {translate('join.rightAway.action')}
      </Button>
      {!isNaming && (
        <p className='as'>
          <span className='seated-as'>
            {translate('join.rightAway.as', { nickname })}
          </span>
          <Button
            isDisabled={isPending}
            onPress={() => setIsNaming(true)}
            size='small'
            variant='underlined'
          >
            {translate('join.rightAway.change')}
          </Button>
        </p>
      )}
      <p className='aside'>{translate('join.rightAway.joinLater')}</p>
    </Form>
  )
}
