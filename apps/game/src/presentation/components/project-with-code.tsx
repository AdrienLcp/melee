import type React from 'react'
import { type FormEvent, useState } from 'react'
import { Form } from 'react-aria-components'
import { useNavigate } from 'react-router'

import { ROOM_CODE_LENGTH } from '@melee/protocol/identifiers'

import { parseRoomCodeInput } from '@melee/core/room/room-code'

import { invitePathFor } from '@/infrastructure/router/navigation'
import {
  type FieldError,
  fieldErrorMessage
} from '@/presentation/i18n/field-error'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { Disclosure } from './disclosure'
import { QrCodeIcon } from './icons'
import { TextField } from './text-field'

/**
 * The way to the poster that starts from a code rather than from a room
 * somebody is already in: the laptop wired to the projector at an event is
 * rarely the laptop hosting.
 *
 * **Typing a code here grants nothing** — no seat, no console, no token, no
 * frame sent. That is the whole difference between this field and the join
 * field: that one seats you, this one shows what the table is already showing.
 * It asks the server nothing either; whether the code opens a room is the
 * poster's own question, answered on the screen that would be projecting it.
 *
 * Folded in the menu, because it is a rare job: the summary says what it does,
 * which a bare title never did.
 */
export const ProjectWithCode: React.FC<{
  /** Called once the poster is on its way, so the menu can close behind it. */
  onDone: () => void
}> = ({ onDone }) => {
  const navigate = useNavigate()
  const translate = useTranslate()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<FieldError | null>(null)

  const project = async (event: FormEvent): Promise<void> => {
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

    onDone()
    await navigate(invitePathFor(parsed.code))
  }

  return (
    <Disclosure
      className='project-with-code'
      icon={<QrCodeIcon />}
      label={translate('menu.thisDevice.qrCode.label')}
      summary={translate('menu.thisDevice.qrCode.description')}
    >
      <Form
        onSubmit={(event) => {
          void project(event)
        }}
      >
        <TextField
          autoCapitalize='characters'
          autoComplete='off'
          errorMessage={fieldErrorMessage({ error: codeError, translate })}
          isInvalid={codeError !== null}
          label={translate('join.roomCode.label')}
          maxLength={ROOM_CODE_LENGTH + 2}
          name='roomCode'
          onChange={(next) => {
            setCode(next)
            setCodeError(null)
          }}
          placeholder={'•'.repeat(ROOM_CODE_LENGTH)}
          value={code}
        />
        <Button size='small' type='submit' variant='outlined'>
          {translate('menu.thisDevice.qrCode.action')}
        </Button>
      </Form>
    </Disclosure>
  )
}
