import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { NICKNAME_MAX_LENGTH } from '@melee/protocol/identifiers'
import type { HostRoomView } from '@melee/protocol/room'

import {
  isRoomJudgedByHost,
  seatWithheldReason
} from '@melee/core/room/game-modes'

import { readStoredNickname } from '@/infrastructure/storage/preferences-storage'
import { Button } from '@/presentation/components/button'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './host-seat.sass'

type HostSeatProps = {
  /** Gives the seat this console holds back to the room. */
  onLeaveSeat: () => void
  /** Reopens the socket with a name on it, which is what takes the seat. */
  onTakeSeat: (nickname: string) => void
  view: HostRoomView
}

/**
 * The screen in the middle of the table is the speaker and a player at once,
 * and this is everything that screen gets to say about its own seat: the form
 * where the room can grant one, the name it already holds, or the sentence
 * that says why there is none — and nothing where a room with no game yet
 * withholds it, the seat waiting on the decision the lobby is asking for.
 *
 * The rule is the room's rather than the caller's — a judged round needs a
 * judge, and a judge who is also answering is not one — so it is decided here
 * instead of at each of the two places this is drawn.
 *
 * Taking it withholds the answer from this screen's own payload until the
 * reveal, so the seat costs the host what it costs everyone else.
 */
export const HostSeat: React.FC<HostSeatProps> = ({
  onLeaveSeat,
  onTakeSeat,
  view
}) => {
  const translate = useTranslate()
  // The same name a player's join form fills itself in with. It is the device
  // saying what it likes being called, and a console is a device like any other.
  const [nickname, setNickname] = useState(() => {
    const stored = readStoredNickname()

    return stored.status === 'success' ? (stored.data ?? '') : ''
  })

  const game = view.settings.game
  const withheld = seatWithheldReason(view.settings)
  // The name the room has for this seat, not the one this screen asked for: a
  // console removed from its own roster row keeps the second and holds none.
  const takenAs =
    view.players.find((player) => player.id === view.youId)?.nickname ?? null

  if (withheld !== null) {
    // In its place: the control vanishing on its own is what makes a judged
    // room read as a broken seat rather than as a room that owes a verdict.
    return (
      <p className='host-seat held'>
        {translate(`host.seat.withheld.${withheld}`)}
      </p>
    )
  }

  if (isRoomJudgedByHost(view.settings)) {
    return null
  }

  if (takenAs !== null) {
    return (
      <section className='host-seat taken'>
        <p>{translate('host.seat.taken', { nickname: takenAs })}</p>
        <Button onPress={onLeaveSeat} size='small' variant='underlined'>
          {translate('host.seat.leave')}
        </Button>
      </section>
    )
  }

  return (
    <section className='host-seat'>
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          onTakeSeat(nickname.trim())
        }}
      >
        <TextField
          autoComplete='off'
          description={translate(
            game?.kind === 'reflex' || game?.kind === 'innerclock'
              ? 'host.seat.cost.sharedScreen'
              : 'host.seat.cost.hiddenAnswer'
          )}
          label={translate('host.seat.label')}
          maxLength={NICKNAME_MAX_LENGTH}
          onChange={setNickname}
          value={nickname}
        />
        <Button
          isDisabled={nickname.trim() === ''}
          type='submit'
          variant='outlined'
        >
          {translate('host.seat.action')}
        </Button>
      </Form>
    </section>
  )
}
