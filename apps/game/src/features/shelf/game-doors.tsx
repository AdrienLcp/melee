import type React from 'react'

import type { ShelvedGame } from '@melee/protocol/game'

import { canPlayRightAway } from '@melee/core/room/play-right-away'

import type { CreateRoom } from '@/features/home/use-create-room'
import { Button } from '@/presentation/components/button'
import { PlayRightAway } from '@/presentation/components/play-right-away'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './game-doors.sass'

type GameDoorsProps = {
  /** The page's one room opener, so a press here greys out every other door. */
  createRoom: CreateRoom
  game: ShelvedGame
}

/**
 * The two ways into one game, of equal weight: a table opened for the group
 * to gather round, or a table where whoever pressed is already playing and
 * the others join along the way. Drawn on the game's own front door and on its
 * lid opened from the shelf, which are the same decision.
 *
 * A game its host judges has no second door at all, not even a greyed one:
 * one line says why, and the first door keeps the whole width.
 */
export const GameDoors: React.FC<GameDoorsProps> = ({ createRoom, game }) => {
  const translate = useTranslate()
  const { isOpening, isOpeningAny, isStartingRightAway, open, refusal } =
    createRoom

  return (
    <div className='game-doors'>
      <div className='door'>
        <Button
          isDisabled={isOpeningAny && !isOpening}
          isPending={isOpening}
          onPress={() => {
            void open({ games: [game] })
          }}
          size='large'
        >
          {translate('join.host.action')}
        </Button>
        <p className='aside'>{translate('join.host.description')}</p>
      </div>

      {canPlayRightAway(game) ? (
        <>
          <p aria-hidden='true' className='or'>
            {translate('join.divider')}
          </p>
          <PlayRightAway
            className='door right-away'
            isDisabled={isOpeningAny && !isStartingRightAway}
            isPending={isStartingRightAway}
            onPlay={(nickname) => {
              void open({ games: [game], seatAs: nickname })
            }}
          />
        </>
      ) : (
        <p className='door judged'>{translate('join.rightAway.judged')}</p>
      )}

      {refusal !== null && (
        <p className='error' role='alert'>
          {translate(refusal)}
        </p>
      )}
    </div>
  )
}
