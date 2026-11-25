import type React from 'react'
import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'

import { NICKNAME_MAX_LENGTH } from '@melee/protocol/identifiers'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { protocolErrorKey } from '@/presentation/i18n/translation'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { Button } from './button'
import { TextField } from './text-field'

import './seat-name-form.sass'

type SeatNameFormProps = {
  /** Called once the room has taken the name sent, never on a refusal. */
  onRenamed?: () => void
}

/**
 * The field that renames this screen's seat, and its press. Empty rather than
 * filled with the name the row it opens from already carries: a prefilled
 * field printed it twice, and editing two characters of your own name is not
 * what changing it means. `null` where no seat is held.
 */
export const SeatNameForm: React.FC<SeatNameFormProps> = ({ onRenamed }) => {
  const { refusedNickname, rename, seatNickname } = useRoomActions()
  const translate = useTranslate()
  const [draft, setDraft] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const isTaken = sent !== null && sent === seatNickname

  useEffect(() => {
    if (isTaken) {
      onRenamed?.()
    }
  }, [isTaken, onRenamed])

  if (rename === null || seatNickname === null) {
    return null
  }

  const value = draft ?? ''
  const next = value.trim()
  // The refusal belongs to the name it was given for, so any other draft
  // submits again — a controlled `isInvalid` outliving its reason leaves the
  // field's native validity false and the press a silent no-op.
  const isRefused = next === refusedNickname

  return (
    <Form
      className='seat-name-form'
      onSubmit={(event) => {
        event.preventDefault()
        setSent(next)
        rename(next)
      }}
    >
      <TextField
        autoComplete='nickname'
        enterKeyHint='done'
        errorMessage={
          isRefused ? translate(protocolErrorKey('nickname_taken')) : undefined
        }
        isInvalid={isRefused}
        label={translate('menu.nickname.field')}
        maxLength={NICKNAME_MAX_LENGTH}
        name='nickname'
        onChange={setDraft}
        value={value}
      />
      {/*
        `small`, and beside the field rather than under its width: a 52px
        block is the shape of an exit, and changing a label is not a peer of
        leaving the room.
      */}
      <Button
        isDisabled={next.length === 0 || next === seatNickname}
        size='small'
        type='submit'
        variant='outlined'
      >
        {translate('menu.nickname.action')}
      </Button>
    </Form>
  )
}
