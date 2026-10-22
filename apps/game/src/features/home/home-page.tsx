import { ProjectWithCode } from '@/features/invite/project-with-code'
import { JoinWithCode } from '@/features/join/join-with-code'
import { WallDoor } from '@/features/wall/wall-door'
import { Button } from '@/presentation/components/button'
import { Main } from '@/presentation/components/main'
import { PAGE_HEADS } from '@/presentation/head/document-head'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { GameSpines } from './game-spines'
import { HeldRooms } from './held-rooms'
import { useCreateRoom } from './use-create-room'

import './home-page.sass'

/**
 * The product's front door, and the one screen that belongs to no game: the
 * lid of the box beside the shelf it came off. The lid holds the two promises
 * together — the room is playing in seconds, and there is a whole evening on
 * the shelf — and the two doors under them. The room comes first: the code
 * goes up, the players arrive, and the table decides what to play while they
 * do, which is why opening one here asks nothing and the shelf is a shortcut
 * rather than the only way through.
 *
 * Side by side, the lid stays in view while the shelf scrolls past it, and
 * the screens a room may add — the TV, a second QR code — close the shelf,
 * each saying in a sentence what it does.
 */
export const HomePage: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const createRoom = useCreateRoom()
  const { isOpening, isOpeningAny, open, refusal } = createRoom

  return (
    <Main className='home-page'>
      <DocumentTitle>{PAGE_HEADS[locale].home.title}</DocumentTitle>

      <div className='door-side'>
        <section className='lid'>
          <p className='wordmark'>
            {translate('home.title')}
            <span aria-hidden='true' className='dot'>
              .
            </span>
          </p>
          <h1>{translate('home.promise')}</h1>
          <p className='pitch'>
            <strong>{translate('home.pitch.lead')}</strong>
            {` ${translate('home.pitch.rest')}`}
          </p>

          <div className='doors'>
            <div className='open'>
              <Button
                isDisabled={isOpeningAny && !isOpening(null)}
                isPending={isOpening(null)}
                onPress={() => {
                  void open(null)
                }}
                size='large'
              >
                {translate('join.host.action')}
              </Button>
              {refusal?.door === null && (
                <p className='error' role='alert'>
                  {translate(refusal.error)}
                </p>
              )}
            </div>
            <JoinWithCode isDisabled={isOpeningAny} />
          </div>
        </section>

        {/*
          Under the lid rather than in it: the section is drawn only once the
          server has said which remembered rooms still resolve, and above the
          doors its arrival moved the one a press aims at by 221px.
        */}
        <HeldRooms isDisabled={isOpeningAny} />
      </div>

      <div className='shelf-side'>
        <GameSpines createRoom={createRoom} />

        <section className='other-screens'>
          <h2>{translate('home.otherScreens')}</h2>
          <div className='screens'>
            <WallDoor isDisabled={isOpeningAny} />
            <ProjectWithCode isDisabled={isOpeningAny} />
          </div>
        </section>
      </div>
    </Main>
  )
}
