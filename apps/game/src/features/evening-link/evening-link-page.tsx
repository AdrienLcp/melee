import type React from 'react'

import {
  gamesOfPlayedLineUp,
  isSameLineUp
} from '@melee/core/room/recent-tables'
import { isSameName, type SavedEvening } from '@melee/core/room/saved-evening'

import { useCreateRoom } from '@/features/home/use-create-room'
import { useLineUpFace, useRoundsText } from '@/features/home/use-line-up-face'
import { useSavedEvenings } from '@/features/host/use-saved-evenings'
import { homePathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { DeckNote } from '@/presentation/components/deck-note'
import { ArrowIcon, GameIcon, StarIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { RefusalNote } from '@/presentation/components/refusal-note'
import { ToggleButton } from '@/presentation/components/toggle-button'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { useCarriedEvening } from './use-carried-evening'

import './evening-link-page.sass'

/** The one line-up this page can open, so its press alone shows the spinner. */
const SHARED_LINE_UP_KEY = 'shared'

/**
 * Where a line-up shared as a link lands — written by a host on another
 * machine, or by an assistant through `/mcp`. It lays the line-up out as the
 * lid it becomes on the home page, opens a table on it, and keeps it among the
 * host's own. It opens nothing by itself: the table is opened by the press,
 * through the same door as every lid.
 */
export const EveningLinkPage: React.FC = () => {
  const carried = useCarriedEvening()

  return (
    <Main className='evening-link-page'>
      {carried.status === 'read' && <SharedLineUp evening={carried.evening} />}
      {carried.status === 'unreadable' && <UnreadableLink />}
    </Main>
  )
}

const SharedLineUp: React.FC<{ evening: SavedEvening }> = ({ evening }) => {
  const translate = useTranslate()
  const face = useLineUpFace()
  const roundsText = useRoundsText()
  const saved = useSavedEvenings()
  const { lineUpOpening, openLineUp, refusal } = useCreateRoom()
  const isSaved = saved.evenings.some(
    (kept) =>
      isSameName(kept.name, evening.name) &&
      isSameLineUp({ left: kept, right: evening })
  )

  return (
    <>
      <DocumentTitle>
        {translate('eveningLink.documentTitle', { name: evening.name })}
      </DocumentTitle>

      <article className='shared-lid'>
        <span aria-hidden='true' className='band'>
          {segmentsOf(evening).map(({ game, key }) => (
            <span
              className='segment'
              key={key}
              style={{
                '--spine': `var(--spine-${game})`,
                '--spine-ink': `var(--on-spine-${game})`
              }}
            >
              <GameIcon game={game} />
            </span>
          ))}
        </span>
        <div className='body'>
          <h1 className='name'>{evening.name}</h1>
          <p className='games'>
            {face.gamesText(gamesOfPlayedLineUp(evening))}
          </p>
          {broughtDecksOf(evening).length > 0 && (
            <p className='decks'>
              {broughtDecksOf(evening).map(({ deck, key }) => (
                <DeckNote game={deck.game} key={key} left={deck.items.length} />
              ))}
            </p>
          )}
        </div>
        <p className='foot'>{roundsText(evening.roundCount)}</p>
      </article>

      <div className='presses'>
        <Button
          icon={<ArrowIcon />}
          isPending={lineUpOpening === SHARED_LINE_UP_KEY}
          onPress={() => {
            void openLineUp({ evening, key: SHARED_LINE_UP_KEY })
          }}
          size='large'
          variant='filled'
        >
          {translate('eveningLink.open')}
        </Button>
        <ToggleButton
          aria-label={translate('home.saveLineUp', { name: evening.name })}
          className='save'
          isSelected={isSaved}
          onChange={(isOn) => {
            if (isOn) {
              saved.save(evening)
            } else {
              saved.forget(evening.name)
            }
          }}
        >
          <StarIcon />
          <span aria-hidden='true' className='labels'>
            <span className='control-label off'>
              {translate('eveningLink.save')}
            </span>
            <span className='control-label on'>
              {translate('eveningLink.saved')}
            </span>
          </span>
        </ToggleButton>
      </div>

      <p aria-hidden={!isSaved} className='saved-where' data-shown={isSaved}>
        {translate('eveningLink.savedWhere')}
      </p>

      <RefusalNote message={refusal === null ? null : translate(refusal)} />
    </>
  )
}

/** A segment of the band per entry, keyed by its place: the band never reorders. */
const segmentsOf = (evening: SavedEvening) =>
  evening.lineUp.map((entry, index) => ({
    game: typeof entry === 'string' ? entry : entry.kind,
    key: index
  }))

/** Each entry's deck, keyed by its entry's place: the lid never reorders. */
const broughtDecksOf = (evening: SavedEvening) =>
  evening.decks.flatMap((deck, index) =>
    deck === null ? [] : [{ deck, key: index }]
  )

const UnreadableLink: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()

  return (
    <div className='unreadable'>
      <DocumentTitle>
        {translate('eveningLink.unreadable.documentTitle')}
      </DocumentTitle>
      <h1>{translate('eveningLink.unreadable.title')}</h1>
      <p>{translate('eveningLink.unreadable.description')}</p>
      <Link href={homePathFor(locale)} variant='outlined'>
        {translate('navigation.back')}
      </Link>
    </div>
  )
}
