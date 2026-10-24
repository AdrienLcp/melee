import { JoinWithCode } from '@/features/join/join-with-code'
import { Main } from '@/presentation/components/main'
import { PAGE_HEADS } from '@/presentation/head/document-head'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { GameShelf } from './game-shelf'
import { HomeTray } from './home-tray'
import { useCreateRoom } from './use-create-room'

import './home-page.sass'

/**
 * The product's front door, and the one screen that belongs to no game. Three
 * things and nothing else: the code box for whoever was told four characters,
 * the press that opens a table — which game it plays is chosen in the lobby,
 * while the others join — and the shelf, each spine a table opened on its
 * game. The screens a room may add are in the menu.
 */
export const HomePage: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const createRoom = useCreateRoom()

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
        </div>
      </header>

      <HomeTray createRoom={createRoom} />

      <GameShelf createRoom={createRoom} />
    </Main>
  )
}
