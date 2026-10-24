import type React from 'react'
import { type FormEvent, useState } from 'react'
import { Form } from 'react-aria-components'

import {
  WALL_PAIRING_CODE_LENGTH,
  wallPairingCodeSchema
} from '@melee/protocol/http'
import type { RoomCode } from '@melee/protocol/identifiers'

import { pairWall } from '@/infrastructure/api/melee-api'
import { readHostToken } from '@/infrastructure/storage/session-storage'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { TextField } from './text-field'

import './wall-pairing-form.sass'

/**
 * The code another screen shows at `/wall`, typed on the device that runs the
 * table, which vouches for it with the room's token. The code alone pairs
 * nothing, so it may sit where the whole room reads it.
 */
export const WallPairingForm: React.FC<{
  /** How to reach a code, under the field; the menu's own line by default. */
  description?: string
  roomCode: RoomCode
}> = ({ description, roomCode }) => {
  const translate = useTranslate()
  const [code, setCode] = useState('')
  const [outcome, setOutcome] = useState<'failed' | 'idle' | 'paired'>('idle')

  const pair = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    const pairingCode = wallPairingCodeSchema.safeParse(
      code.replace(/[\s-]/g, '').toUpperCase()
    )
    const hostToken = readHostToken(roomCode)

    if (!pairingCode.success || hostToken === null) {
      setOutcome('failed')

      return
    }

    const paired = await pairWall({
      hostToken,
      pairingCode: pairingCode.data,
      roomCode
    })

    setOutcome(paired.status === 'success' ? 'paired' : 'failed')

    if (paired.status === 'success') {
      setCode('')
    }
  }

  return (
    <Form
      className='wall-pairing-form'
      onSubmit={(event) => {
        void pair(event)
      }}
    >
      <TextField
        autoCapitalize='characters'
        autoComplete='off'
        description={
          outcome === 'paired'
            ? translate('wall.menu.paired')
            : (description ?? translate('wall.menu.description'))
        }
        errorMessage={translate('wall.menu.failed')}
        isInvalid={outcome === 'failed'}
        label={translate('wall.menu.label')}
        maxLength={WALL_PAIRING_CODE_LENGTH + 2}
        name='wallCode'
        onChange={(next) => {
          setCode(next)
          setOutcome('idle')
        }}
        placeholder={'•'.repeat(WALL_PAIRING_CODE_LENGTH)}
        value={code}
      />
      <Button size='small' type='submit' variant='outlined'>
        {translate('wall.menu.pair')}
      </Button>
    </Form>
  )
}
