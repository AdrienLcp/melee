import type React from 'react'
import { type FormEvent, useState } from 'react'
import { Form } from 'react-aria-components'
import { useNavigate } from 'react-router'

import { ROOM_CODE_LENGTH } from '@melee/protocol/identifiers'

import { parseRoomCodeInput } from '@melee/core/room/room-code'

import { roomExists } from '@/infrastructure/api/melee-api'
import { playPathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { ArrowIcon } from '@/presentation/components/icons'
import { TextField } from '@/presentation/components/text-field'
import {
  type FieldError,
  fieldErrorMessage
} from '@/presentation/i18n/field-error'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { apiErrorKey } from '@/presentation/i18n/translation'

import './join-with-code.sass'

type JoinWithCodeProps = {
  /** Set while this page is already opening a room, which is where it is about to go. */
  isDisabled: boolean
}

/**
 * The half of joining that is not a QR code, and shell rather than blind test:
 * a code is a room, and the room knows which game it is running. Someone told
 * four characters across the room types them here whatever is being played.
 */
export const JoinWithCode: React.FC<JoinWithCodeProps> = ({ isDisabled }) => {
  const navigate = useNavigate()
  const translate = useTranslate()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<FieldError | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  const joinExisting = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    const parsed = parseRoomCodeInput(code)

    if (parsed.status === 'unsupported_characters') {
      setCodeError({
        key: 'join.roomCode.unsupportedCharacters',
        values: { characters: parsed.characters.join(', ') }
      })

      return
    }

    if (parsed.status === 'wrong_length') {
      setCodeError({
        key: 'join.roomCode.wrongLength',
        values: { length: ROOM_CODE_LENGTH }
      })

      return
    }

    setIsJoining(true)
    setCodeError(null)

    const found = await roomExists({ code: parsed.code })

    setIsJoining(false)

    if (found.status === 'failure') {
      if (found.error !== 'aborted') {
        setCodeError({ key: apiErrorKey(found.error) })
      }

      return
    }

    if (!found.data) {
      setCodeError({ key: 'join.roomCode.unknown' })

      return
    }

    await navigate(playPathFor(parsed.code))
  }

  return (
    <section className='join-with-code'>
      <h2>{translate('join.player.title')}</h2>
      <Form
        onSubmit={(event) => {
          void joinExisting(event)
        }}
      >
        <TextField
          autoCapitalize='characters'
          autoComplete='off'
          errorMessage={fieldErrorMessage({ error: codeError, translate })}
          isDisabled={isDisabled}
          isInvalid={codeError !== null}
          label={translate('join.roomCode.label')}
          maxLength={ROOM_CODE_LENGTH + 2}
          name='roomCode'
          onChange={(next) => {
            setCode(next)
            setCodeError(null)
          }}
          // Derived rather than written, so it cannot drift from the length the
          // server actually generates. Dots carry no language.
          placeholder={'•'.repeat(ROOM_CODE_LENGTH)}
          value={code}
        />
        <Button
          icon={<ArrowIcon />}
          isDisabled={isDisabled}
          isPending={isJoining}
          size='large'
          type='submit'
          variant='outlined'
        >
          {translate('join.player.action')}
        </Button>
      </Form>
    </section>
  )
}
