import { useMediaQuery } from '@adrienlcp/browser/react'
import type React from 'react'
import { lazy, Suspense, useState } from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import { Button } from '@/presentation/components/button'
import { Disclosure } from '@/presentation/components/disclosure'
import {
  ControlsIcon,
  PlayersIcon,
  ScreenIcon
} from '@/presentation/components/icons'
import { Main } from '@/presentation/components/main'
import { RoomDocumentTitle } from '@/presentation/head/room-document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { PODIUM_SCREEN_QUERY } from '@/presentation/styles/wide-screen'

import { PodiumRoster, useRosterSummary } from './podium-roster'
import { GameTab, RoomTab, type SetupTabsProps, TableTab } from './setup-tabs'

import './host-podium.sass'

// Its own chunk, fetched on the first press that opens it: bundled, react-aria's
// modal landed in a chunk every front door loads.
const LoadedSheet = lazy(async () => ({
  default: (await import('@/presentation/components/sheet')).Sheet
}))

type HostPodiumProps = {
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
  round,
  setup,
  view
}) => {
  const translate = useTranslate()
  const isWide = useMediaQuery(PODIUM_SCREEN_QUERY)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const rosterSummary = useRosterSummary(view)

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
      <RoomDocumentTitle game={view.settings.game?.kind ?? null} />
      <div className='podium-bar'>
        <span className='podium-code'>{view.code}</span>
        <span className='podium-wall'>
          <ScreenIcon />
          <span className='podium-wall-name'>
            {translate('host.roomScene.wall.name')}
          </span>
          <span className='podium-wall-on'>
            {translate('host.roomScene.wall.on')}
          </span>
        </span>
        {!isWide && (
          <Button
            aria-label={translate('host.podium.settings')}
            className='podium-settings-press'
            onPress={() => {
              setIsSettingsOpen(true)
            }}
            size='small'
            variant='outlined'
          >
            <ControlsIcon />
          </Button>
        )}
      </div>
      {isWide ? (
        <section
          aria-label={translate('host.podium.roster')}
          className='podium-players'
        >
          <div className='podium-players-head'>
            <h2>{translate('host.podium.roster')}</h2>
            {view.players.length > 0 && (
              <span>
                {translate('player.roomSize', { count: view.players.length })}
              </span>
            )}
          </div>
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
          <GameTab {...setup} />
        </section>
      </div>
      {isWide ? (
        <aside
          aria-label={translate('host.podium.settings')}
          className='podium-settings'
        >
          {settings}
        </aside>
      ) : (
        isSettingsOpen && (
          <Suspense fallback={null}>
            <LoadedSheet
              closeLabel={translate('host.podium.close')}
              heading={translate('host.podium.settings')}
              isOpen={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
            >
              <div className='podium-sheet'>{settings}</div>
            </LoadedSheet>
          </Suspense>
        )
      )}
    </Main>
  )
}
