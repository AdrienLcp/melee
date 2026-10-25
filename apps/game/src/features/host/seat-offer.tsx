import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import type { GameKind } from '@melee/protocol/game'
import { NICKNAME_MAX_LENGTH } from '@melee/protocol/identifiers'

import { readStoredNickname } from '@/infrastructure/storage/preferences-storage'
import { Button } from '@/presentation/components/button'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './seat-offer.sass'

type SeatOfferProps = {
  /** What the room is playing, which decides what the seat costs this screen. */
  game: GameKind | null
  /** The socket is not there to carry the press. */
  isDisabled: boolean
  /** Called with the name to play under, already trimmed. */
  onTakeSeat: (nickname: string) => void
}

const storedNicknameOrNone = (): string => {
  const stored = readStoredNickname()

  return stored.status === 'success' ? (stored.data ?? '') : ''
}

/**
 * Playing is joining: the console's seat is offered in the roster, where every
 * other player appears as they give a name, rather than as a question asked
 * before the room exists. A screen that only shows the code ignores it.
 *
 * Under the name this device already answers to, with a way to change it; a
 * device that has none asks for it here.
 */
export const SeatOffer: React.FC<SeatOfferProps> = ({
  game,
  isDisabled,
  onTakeSeat
}) => {
  const translate = useTranslate()
  const [remembered] = useState(storedNicknameOrNone)
  const [draft, setDraft] = useState(remembered)
  const [isNaming, setIsNaming] = useState(remembered === '')
  const nickname = draft.trim()

  return (
    <Form
      className='seat-offer'
      onSubmit={(event) => {
        event.preventDefault()

        if (nickname !== '' && !isDisabled) {
          onTakeSeat(nickname)
        }
      }}
    >
      <div className='offer'>
        <p className='title'>{translate('host.seat.offer')}</p>
        {isNaming ? (
          <TextField
            autoComplete='nickname'
            autoFocus={remembered !== ''}
            enterKeyHint='go'
            label={translate('join.rightAway.name')}
            maxLength={NICKNAME_MAX_LENGTH}
            onChange={setDraft}
            value={draft}
          />
        ) : (
          <p className='as'>
            <span className='seated-as'>
              {translate('join.rightAway.as', { nickname })}
            </span>
            <Button
              onPress={() => setIsNaming(true)}
              size='small'
              variant='underlined'
            >
              {translate('join.rightAway.change')}
            </Button>
          </p>
        )}
        <p className='cost'>
          {translate(
            game === 'reflex' || game === 'innerclock'
              ? 'host.seat.cost.sharedScreen'
              : 'host.seat.cost.hiddenAnswer'
          )}
        </p>
      </div>
      <Button
        isDisabled={isDisabled || nickname === ''}
        type='submit'
        variant='outlined'
      >
        {translate('host.seat.action')}
      </Button>
    </Form>
  )
}
