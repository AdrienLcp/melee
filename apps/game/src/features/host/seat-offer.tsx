import type React from 'react'
import { useRef, useState } from 'react'
import { Form } from 'react-aria-components'

import type { GameKind } from '@melee/protocol/game'
import { NICKNAME_MAX_LENGTH } from '@melee/protocol/identifiers'

import { readStoredNickname } from '@/infrastructure/storage/preferences-storage'
import { Button } from '@/presentation/components/button'
import { TextField } from '@/presentation/components/text-field'
import { typedName } from '@/presentation/components/typed-name'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'

import { useCrossFadeOnReshape } from './use-cross-fade-on-reshape'

import './seat-offer.sass'

type SeatOfferProps = {
  /** What the room is playing, which decides what the seat costs this screen. */
  game: GameKind | null
  /** The socket is not there to carry the press. */
  isDisabled: boolean
  /**
   * Whether a seat is there to take. Closed, the offer folds away rather than
   * leaving the tree, so it leaves the way it arrived and comes back the same.
   */
  isOpen: boolean
  /** Called with the name to play under, already trimmed. */
  onTakeSeat: (nickname: string) => void
}

const storedNicknameOrNone = (): string => {
  const stored = readStoredNickname()

  return stored.status === 'success' ? (stored.data ?? '') : ''
}

/**
 * The console's seat beside players already at the table, offered under the
 * launch where an empty table's *play right away* stands, so taking a place
 * is always looked for in one spot and never moves the seats above it.
 *
 * Under the name this device already answers to, with a way to change it; a
 * device that has none asks for it here.
 */
export const SeatOffer: React.FC<SeatOfferProps> = ({
  game,
  isDisabled,
  isOpen,
  onTakeSeat
}) => {
  const translate = useTranslate()
  const [remembered] = useState(storedNicknameOrNone)
  const [draft, setDraft] = useState(remembered)
  const [isNaming, setIsNaming] = useState(remembered === '')
  const nickname = draft.trim()
  const row = useRef<HTMLDivElement>(null)

  useCrossFadeOnReshape({ box: row, shape: isNaming ? 'naming' : 'named' })

  const takeSeat = (
    <Button
      isDisabled={isDisabled || nickname === ''}
      size={isNaming ? 'medium' : 'small'}
      type='submit'
      variant='outlined'
    >
      {translate('host.seat.action')}
    </Button>
  )

  return (
    <div
      className='seat-offer-fold'
      data-closed={!isOpen || undefined}
      inert={!isOpen}
    >
      <Form
        className='seat-offer'
        onSubmit={(event) => {
          event.preventDefault()

          if (nickname !== '' && !isDisabled) {
            onTakeSeat(nickname)
          }
        }}
      >
        <div className='seat-row' data-naming={isNaming || undefined} ref={row}>
          {isNaming ? (
            <>
              <TextField
                autoComplete='nickname'
                autoFocus={remembered !== ''}
                enterKeyHint='go'
                label={translate('join.rightAway.name')}
                maxLength={NICKNAME_MAX_LENGTH}
                onChange={setDraft}
                value={draft}
              />
              {takeSeat}
            </>
          ) : (
            <>
              {takeSeat}
              <p className='as'>
                <span className='seated-as'>
                  <RichText
                    parts={translate.rich('join.rightAway.as', {
                      name: typedName,
                      nickname
                    })}
                  />
                </span>
                <Button
                  onPress={() => setIsNaming(true)}
                  size='small'
                  variant='underlined'
                >
                  {translate('join.rightAway.change')}
                </Button>
              </p>
            </>
          )}
        </div>
        <p className='cost'>
          {translate(
            game === 'reflex' || game === 'innerclock'
              ? 'host.seat.cost.sharedScreen'
              : 'host.seat.cost.hiddenAnswer'
          )}
        </p>
      </Form>
    </div>
  )
}
