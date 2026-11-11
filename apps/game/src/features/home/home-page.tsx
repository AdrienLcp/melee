import { JoinWithCode } from '@/features/join/join-with-code'
import { Main } from '@/presentation/components/main'
import { RefusalNote } from '@/presentation/components/refusal-note'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { PAGE_HEADS } from '@/presentation/head/document-head'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { GameShelf } from './game-shelf'
import { HostDoor } from './host-door'
import { OwnLineUps } from './own-line-ups'
import { ReadyMadeRow } from './ready-made-row'
import { ResumeTable } from './resume-table'
import { useCreateRoom } from './use-create-room'
import { useShelfTicks } from './use-shelf-ticks'

import './home-page.sass'

/**
 * The product's front door, and the one screen that belongs to no game. The
 * masthead is the wordmark, the way back to the last table, and the player's
 * door — the code box for whoever was told four characters. Under it, rows of
 * line-ups a press opens a table on — the host's own, then the ones the app
 * ships — and the shelf, where a spine ticks a game for the host's door at its
 * foot. The screens a room may add are in the menu.
 *
 * The host's door is under the shelf rather than across the masthead: a press
 * at the top acting on ticks a screen and a half below read as a press of its
 * own, beside the lids' presses that each open what they show.
 */
export const HomePage: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const createRoom = useCreateRoom()
  const ticks = useShelfTicks()

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
          <ResumeTable isDisabled={createRoom.isOpeningAny} />
        </div>
        <div className='join-box'>
          <JoinWithCode isDisabled={createRoom.isOpeningAny} />
        </div>
      </header>

      <div aria-busy={createRoom.isOpeningAny} className='line-up-rows'>
        <OwnLineUps createRoom={createRoom} />
        <ReadyMadeRow createRoom={createRoom} />
        <RefusalNote
          message={
            createRoom.refusal !== null &&
            (createRoom.refusedDoor === 'lineUp' ||
              createRoom.refusedDoor === 'readyMade')
              ? translate(createRoom.refusal)
              : null
          }
        />
      </div>

      <GameShelf
        door={<HostDoor createRoom={createRoom} ticked={ticks.ticked} />}
        isDisabled={createRoom.isOpeningAny}
        ticks={ticks}
      />

      <VisuallyHidden>
        <p role='status'>
          {createRoom.isOpeningAny ? translate('home.opening') : ''}
        </p>
      </VisuallyHidden>
    </Main>
  )
}
