import { useMediaQuery } from '@adrienlcp/browser/react'
import type React from 'react'
import { useId } from 'react'
import { DialogTrigger } from 'react-aria-components'

import type { HostRoomView } from '@melee/protocol/room'

import { hasAnybodyScored } from '@melee/core/scoring/scoreboard'

import { Button } from '@/presentation/components/button'
import { Disclosure } from '@/presentation/components/disclosure'
import {
  ControlsIcon,
  PlayersIcon,
  ScreenIcon
} from '@/presentation/components/icons'
import { Leaflet } from '@/presentation/components/leaflet'
import { Main } from '@/presentation/components/main'
import { SectionHeading } from '@/presentation/components/section-heading'
import { RoomDocumentTitle } from '@/presentation/head/room-document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { PODIUM_SCREEN_QUERY } from '@/presentation/styles/wide-screen'

import { PodiumRoster, useRosterSummary } from './podium-roster'
import { GameTab, RoomTab, type SetupTabsProps, TableTab } from './setup-tabs'

import './host-podium.sass'

type HostPodiumProps = {
  /** The round after this one, with the presses that open it: at a reveal only. */
  next: React.ReactNode
  /** The round on now: the console's header, its stage and the phase's presses. */
  round: React.ReactNode
  /** What the panel's tabs are drawn from, laid out flat here instead. */
  setup: SetupTabsProps
  view: HostRoomView
}

/**
 * The console while a wall shows the game: nothing on it is for the room to
 * read, so it stops drawing the room's stage and lays the host's work out
 * flat. On a laptop, three zones over the whole page — the players down one
 * side, the round on now and the running order in the middle, the table's and
 * the room's settings down the other. On a narrow screen, the running order
 * alone, the players folded to a line under the bar and the settings behind
 * a press in it.
 */
export const HostPodium: React.FC<HostPodiumProps> = ({
  next,
  round,
  setup,
  view
}) => {
  const translate = useTranslate()
  const isWide = useMediaQuery(PODIUM_SCREEN_QUERY)
  const rosterSummary = useRosterSummary(view)
  const rosterTitleId = useId()

  const roster = (
    <PodiumRoster onRemovePlayer={setup.onRemovePlayer} view={view} />
  )

  const settings = (
    <>
      <section className='podium-group'>
        <h2>{translate('host.setup.group.table')}</h2>
        <TableTab {...setup} />
      </section>
      <section className='podium-group'>
        <h2>{translate('host.setup.group.room')}</h2>
        <RoomTab {...setup} />
      </section>
    </>
  )

  return (
    <Main className='host-podium'>
      <RoomDocumentTitle settings={view.settings} />
      <div className='podium-bar'>
        <span className='podium-code'>{view.code}</span>
        <span className='podium-wall'>
          <ScreenIcon />
          <span className='podium-wall-name'>
            {translate('host.roomScene.wall.name')}
          </span>
          <span className='podium-wall-on'>
            {translate('host.roomScene.wall.on', { count: view.wallCount })}
          </span>
        </span>
        {!isWide && (
          <DialogTrigger>
            <Button
              aria-label={translate('host.podium.settings')}
              className='podium-settings-press'
              size='small'
              variant='outlined'
            >
              <ControlsIcon />
            </Button>
            <Leaflet
              aria-label={translate('host.podium.settings')}
              className='podium-settings-leaflet'
              placement='bottom end'
              wideQuery={PODIUM_SCREEN_QUERY}
            >
              {settings}
            </Leaflet>
          </DialogTrigger>
        )}
      </div>
      {isWide ? (
        <section aria-labelledby={rosterTitleId} className='podium-players'>
          <SectionHeading
            aside={
              view.players.length > 0
                ? translate('player.roomSize', { count: view.players.length })
                : null
            }
            id={rosterTitleId}
          >
            {hasAnybodyScored(view.players)
              ? translate('round.overallStandings')
              : translate('host.podium.roster')}
          </SectionHeading>
          {roster}
        </section>
      ) : (
        <Disclosure
          className='podium-players-strip'
          icon={<PlayersIcon />}
          label={translate('host.podium.roster')}
          summary={rosterSummary}
        >
          {roster}
        </Disclosure>
      )}
      <div className='podium-track'>
        {round}
        <section className='podium-order'>
          {next}
          <GameTab {...setup} />
        </section>
      </div>
      {isWide && (
        <aside
          aria-label={translate('host.podium.settings')}
          className='podium-settings'
        >
          {settings}
        </aside>
      )}
    </Main>
  )
}
