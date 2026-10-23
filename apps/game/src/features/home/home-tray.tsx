import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import type { ShelvedGame } from '@melee/protocol/game'
import { NICKNAME_MAX_LENGTH } from '@melee/protocol/identifiers'

import { canPlayRightAway } from '@melee/core/room/play-right-away'

import { hostPathFor } from '@/infrastructure/router/navigation'
import { readStoredNickname } from '@/infrastructure/storage/preferences-storage'
import { Button } from '@/presentation/components/button'
import { ArrowIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { Switch } from '@/presentation/components/switch'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gamePlayKey } from '@/presentation/i18n/translation'

import type { CreateRoom } from './use-create-room'
import { useLastHostedRoom } from './use-last-hosted-room'

import './home-tray.sass'

type HomeTrayProps = {
  createRoom: CreateRoom
  /** The games ticked on the shelf, in the shelf's order. */
  ticked: readonly ShelvedGame[]
}

const storedNicknameOrNone = (): string => {
  const stored = readStoredNickname()

  return stored.status === 'success' ? (stored.data ?? '') : ''
}

/**
 * The one press on the front door, held at the bottom of the screen so it is
 * in reach whatever part of the shelf is in view. What it says follows the
 * ticks — nothing ticked opens a table that chooses in the lobby, one plays
 * that game, several open a line-up — and beside it the host says whether they
 * play too, under the name the table will call them.
 *
 * A game the host must judge leaves them no seat: when every ticked game is
 * one, the switch is off and says why.
 *
 * Beside the press, the way back to the last table this device opened, while
 * it is still open — the host's other door, so it sits with the first one. A
 * player needs none: typing the code again finds the seat it already holds.
 */
export const HomeTray: React.FC<HomeTrayProps> = ({ createRoom, ticked }) => {
  const translate = useTranslate()
  const { isOpeningAny, open, refusal } = createRoom
  const [remembered] = useState(storedNicknameOrNone)
  const [draft, setDraft] = useState(remembered)
  const [isNaming, setIsNaming] = useState(remembered === '')
  const [wantsSeat, setWantsSeat] = useState(false)
  const lastHosted = useLastHostedRoom()

  const judged = ticked.filter((game) => !canPlayRightAway(game))
  const isJudgedOnly = ticked.length > 0 && judged.length === ticked.length
  const isSeated = wantsSeat && !isJudgedOnly
  const nickname = draft.trim()
  const judgedNames = judged.map((game) => translate(gameNameKey(game)))

  const seatNote = (): string | undefined => {
    if (isJudgedOnly) {
      return translate('home.seat.judgedOnly', { games: judgedNames })
    }

    return isSeated && judged.length > 0
      ? translate('home.seat.judgesSome', { games: judgedNames })
      : undefined
  }

  return (
    <Form
      className='home-tray'
      onSubmit={(event) => {
        event.preventDefault()

        if (isSeated && nickname === '') {
          return
        }

        void open({ games: ticked, seatAs: isSeated ? nickname : null })
      }}
    >
      <div className='seat'>
        <Switch
          description={seatNote()}
          isDisabled={isJudgedOnly || isOpeningAny}
          isSelected={isSeated}
          label={translate('home.seat.label')}
          onChange={setWantsSeat}
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
          isDisabled={isSeated && nickname === ''}
          isPending={isOpeningAny}
          size='large'
          type='submit'
        >
          <PressLabel ticked={ticked} />
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

const PressLabel: React.FC<{ ticked: readonly ShelvedGame[] }> = ({
  ticked
}) => {
  const translate = useTranslate()
  const [only] = ticked

  if (only === undefined) {
    return translate('join.host.action')
  }

  if (ticked.length === 1) {
    return translate(gamePlayKey(only))
  }

  return (
    <>
      {translate('home.open.several')}
      <span className='count'>
        {translate('home.open.count', { count: ticked.length })}
      </span>
    </>
  )
}
