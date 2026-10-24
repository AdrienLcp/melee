import type React from 'react'

import type { ShelvedGame } from '@melee/protocol/game'

import type { CreateRoom } from '@/features/home/use-create-room'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './game-doors.sass'

type GameDoorsProps = {
  createRoom: CreateRoom
  game: ShelvedGame
}

/**
 * The one way into a game from its own page: a table opened on it. The name
 * the table calls the host is asked in the room, by the console's seat form
 * and the menu, so nothing here asks for one.
 */
export const GameDoors: React.FC<GameDoorsProps> = ({ createRoom, game }) => {
  const translate = useTranslate()
  const { isOpening, open, refusal } = createRoom

  return (
    <div className='game-doors'>
      <Button
        isPending={isOpening}
        onPress={() => {
          void open({ games: [game] })
        }}
        size='large'
      >
        {translate('join.host.action')}
      </Button>

      {refusal !== null && (
        <p className='error' role='alert'>
          {translate(refusal)}
        </p>
      )}
    </div>
  )
}
