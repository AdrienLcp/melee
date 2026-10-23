import { useState } from 'react'

import type { ShelvedGame } from '@melee/protocol/game'

import { JoinWithCode } from '@/features/join/join-with-code'
import { Main } from '@/presentation/components/main'
import { PAGE_HEADS } from '@/presentation/head/document-head'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { GameTicks } from './game-ticks'
import { HeldRooms } from './held-rooms'
import { HomeTray } from './home-tray'
import { useCreateRoom } from './use-create-room'

import './home-page.sass'

/**
 * The product's front door, and the one screen that belongs to no game. Three
 * things and nothing else: the code box for whoever was told four characters,
 * the shelf to tick what the table plays, and the press that opens it — held
 * at the bottom of the screen so it is in reach wherever the shelf is scrolled.
 * The rules of each game are on its own page, and the screens a room may add
 * are in the menu.
 */
export const HomePage: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const createRoom = useCreateRoom()
  const [ticked, setTicked] = useState<readonly ShelvedGame[]>([])

  return (
    <Main className='home-page'>
      <DocumentTitle>{PAGE_HEADS[locale].home.title}</DocumentTitle>

      <header className='masthead'>
        <h1 className='wordmark'>
          {translate('home.title')}
          <span aria-hidden='true' className='dot'>
            .
          </span>
        </h1>
        <div className='join-box'>
          <JoinWithCode isDisabled={createRoom.isOpeningAny} />
          <HeldRooms isDisabled={createRoom.isOpeningAny} />
        </div>
      </header>

      <GameTicks onChange={setTicked} ticked={ticked} />

      <HomeTray createRoom={createRoom} ticked={ticked} />
    </Main>
  )
}
