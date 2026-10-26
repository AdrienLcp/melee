import { JoinWithCode } from '@/features/join/join-with-code'
import { Main } from '@/presentation/components/main'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { PAGE_HEADS } from '@/presentation/head/document-head'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { GameShelf } from './game-shelf'
import { HostDoor } from './host-door'
import { useCreateRoom } from './use-create-room'

import './home-page.sass'

/**
 * The product's front door, and the one screen that belongs to no game. Two
 * doors across the masthead — the host's, a table that chooses its game in
 * the lobby while the others join, and the player's, the code box for whoever
 * was told four characters — and under them the shelf, each spine a table
 * opened on its game. The screens a room may add are in the menu.
 */
export const HomePage: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const createRoom = useCreateRoom()

  return (
    <Main className='home-page'>
      <DocumentTitle>{PAGE_HEADS[locale].home.title}</DocumentTitle>

      <header className='masthead'>
        <div className='title-block'>
          <h1 className='wordmark'>
            {translate('home.title')}
            <span aria-hidden='true' className='dot'>
              .
            </span>
          </h1>
          <p className='promise'>{translate('home.promise')}</p>
        </div>
        <div className='join-box'>
          <JoinWithCode isDisabled={createRoom.isOpeningAny} />
        </div>
        <HostDoor createRoom={createRoom} />
      </header>

      <GameShelf createRoom={createRoom} />

      <VisuallyHidden>
        <p role='status'>
          {createRoom.isOpeningAny ? translate('home.opening') : ''}
        </p>
      </VisuallyHidden>
    </Main>
  )
}
