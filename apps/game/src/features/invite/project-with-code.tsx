import type React from 'react'
import { type FormEvent, useState } from 'react'
import { Form } from 'react-aria-components'
import { useNavigate } from 'react-router'

import { ROOM_CODE_LENGTH } from '@melee/protocol/identifiers'

import { parseRoomCodeInput } from '@melee/core/room/room-code'

import { invitePathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { QrCodeIcon } from '@/presentation/components/icons'
import { TextField } from '@/presentation/components/text-field'
import {
  type FieldError,
  fieldErrorMessage
} from '@/presentation/i18n/field-error'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

/**
 * The third door to the poster, and the only one that starts from a code rather
 * than from a room somebody is already in: the laptop wired to the projector at
 * an event is rarely the laptop hosting.
 *
 * **Typing a code here grants nothing** — no seat, no console, no token, no
 * frame sent. That is the whole difference between this field and the console
 * door that was proposed for the same page and refused, which would have handed
 * over the room to whoever read the code off the wall. So it does not collapse into the join field
 * either: that one seats you, this one shows what the table is already showing.
 *
 * It asks the server nothing. Whether the code opens a room is the poster's own
 * question, answered on the screen that would be projecting it — a front door
 * that waited on a request to fold out a rarely-used panel would be spending
 * everybody's first second on somebody else's evening.
 *
 * Under the shelf rather than beside the two doors, because it is a rare
 * job — and spelled out rather than folded, because a folded title is all a
 * visitor reads of it, and the title alone never said what the field does.
 */
export const ProjectWithCode: React.FC<{
  /** Set while the page is already opening a room, which is where it is about to go. */
  isDisabled: boolean
}> = ({ isDisabled }) => {
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

    await navigate(invitePathFor(parsed.code))
  }

  return (
    <section className='project-with-code'>
      <h3>
        <QrCodeIcon />
        {translate('invite.door.label')}
      </h3>
      <p className='description'>{translate('invite.door.description')}</p>
      <Form
        onSubmit={(event) => {
          void project(event)
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
          placeholder={'•'.repeat(ROOM_CODE_LENGTH)}
          value={code}
        />
        <Button isDisabled={isDisabled} type='submit' variant='outlined'>
          {translate('invite.door.action')}
        </Button>
      </Form>
    </section>
  )
}
