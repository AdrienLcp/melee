import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { NICKNAME_MAX_LENGTH } from '@melee/protocol/identifiers'

import { hostPathFor } from '@/infrastructure/router/navigation'
import { readStoredNickname } from '@/infrastructure/storage/preferences-storage'
import { Button } from '@/presentation/components/button'
import { ArrowIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { Switch } from '@/presentation/components/switch'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { CreateRoom } from './use-create-room'
import { useLastHostedRoom } from './use-last-hosted-room'

import './home-tray.sass'

type HomeTrayProps = {
  createRoom: CreateRoom
}

const storedNicknameOrNone = (): string => {
  const stored = readStoredNickname()

  return stored.status === 'success' ? (stored.data ?? '') : ''
}

/**
 * The one press on the front door: a table that chooses its game in the lobby
 * while the others join. Beside it the host says whether they play too, under
 * the name the table will call them — a seat the server takes back if the
 * table then picks a game the host must judge.
 *
 * Beside the press, the way back to the last table this device opened, while
 * it is still open — the host's other door, so it sits with the first one. A
 * player needs none: typing the code again finds the seat it already holds.
 */
export const HomeTray: React.FC<HomeTrayProps> = ({ createRoom }) => {
  const translate = useTranslate()
  const { isOpeningAny, open, openingFor, refusal } = createRoom
  const [remembered] = useState(storedNicknameOrNone)
  const [draft, setDraft] = useState(remembered)
  const [isNaming, setIsNaming] = useState(remembered === '')
  const [isSeated, setIsSeated] = useState(false)
  const lastHosted = useLastHostedRoom()

  const nickname = draft.trim()
  const isOpeningLobby = openingFor?.length === 0

  return (
    <Form
      className='home-tray'
      onSubmit={(event) => {
        event.preventDefault()

        if (isSeated && nickname === '') {
          return
        }

        void open({ games: [], seatAs: isSeated ? nickname : null })
      }}
    >
      <div className='seat'>
        <Switch
          isDisabled={isOpeningAny}
          isSelected={isSeated}
          label={translate('home.seat.label')}
          onChange={setIsSeated}
        />
        {isSeated && isNaming && (
          <TextField
            autoComplete='nickname'
            autoFocus={remembered !== ''}
            enterKeyHint='go'
            isDisabled={isOpeningAny}
            label={translate('join.rightAway.name')}
            maxLength={NICKNAME_MAX_LENGTH}
            onChange={setDraft}
            value={draft}
          />
        )}
        {isSeated && !isNaming && (
          <p className='as'>
            <span className='seated-as'>
              {translate('join.rightAway.as', { nickname })}
            </span>
            <Button
              isDisabled={isOpeningAny}
              onPress={() => setIsNaming(true)}
              size='small'
              variant='underlined'
            >
              {translate('join.rightAway.change')}
            </Button>
          </p>
        )}
      </div>

      {lastHosted !== null && (
        <Link
          className='resume'
          href={hostPathFor(lastHosted)}
          isDisabled={isOpeningAny}
          size='small'
          variant='underlined'
        >
          <span className='label'>
            {translate('home.resume')}{' '}
            <span className='code'>{lastHosted}</span>
          </span>
          <ArrowIcon />
        </Link>
      )}

      <div className='press'>
        <Button
          isDisabled={
            (isSeated && nickname === '') || (isOpeningAny && !isOpeningLobby)
          }
          isPending={isOpeningLobby}
          size='large'
          type='submit'
        >
          {translate('join.host.action')}
        </Button>
        {refusal !== null && (
          <p className='error' role='alert'>
            {translate(refusal)}
          </p>
        )}
      </div>
    </Form>
  )
}
