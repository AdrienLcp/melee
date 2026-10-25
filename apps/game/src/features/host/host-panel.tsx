import { useMediaQuery } from '@adrienlcp/browser/react'
import type React from 'react'
import { useState } from 'react'
import {
  Button as ReactAriaButton,
  Tab,
  TabList,
  TabPanel,
  Tabs
} from 'react-aria-components'

import {
  type PanelSide,
  readStoredPanelFolded,
  readStoredPanelSide,
  writeStoredPanelFolded,
  writeStoredPanelSide
} from '@/infrastructure/storage/preferences-storage'
import {
  ControlsIcon,
  DiceIcon,
  PanelFoldIcon,
  PanelOpenIcon,
  PanelSideIcon,
  PlayersIcon,
  StageIcon,
  TableIcon
} from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'
import { DESK_SCREEN_QUERY } from '@/presentation/styles/wide-screen'

import './host-panel.sass'

/** The panel's own tabs, in the order they stand. */
export type PanelTab = 'game' | 'players' | 'room' | 'table'

/** What a narrow console shows: the game itself, or one of the panel's tabs in its place. */
export type NarrowScreen = PanelTab | 'stage'

type PanelTabFace = {
  heading: PlainTranslationKey
  icon: React.FC
  id: PanelTab
  label: PlainTranslationKey
}

const PANEL_TABS: readonly PanelTabFace[] = [
  {
    heading: 'host.game.label',
    icon: DiceIcon,
    id: 'game',
    label: 'host.panel.tabs.game'
  },
  {
    heading: 'host.setup.group.table',
    icon: TableIcon,
    id: 'table',
    label: 'host.panel.tabs.table'
  },
  {
    heading: 'host.setup.group.room',
    icon: ControlsIcon,
    id: 'room',
    label: 'host.panel.tabs.room'
  },
  {
    heading: 'host.panel.tabs.players',
    icon: PlayersIcon,
    id: 'players',
    label: 'host.panel.tabs.players'
  }
]

const isPanelTab = (key: React.Key): key is PanelTab =>
  PANEL_TABS.some((tab) => tab.id === key)

const storedFoldOrOpen = (): boolean => {
  const stored = readStoredPanelFolded()

  return stored.status === 'success' && stored.data
}

const storedSideOrRight = (): PanelSide => {
  const stored = readStoredPanelSide()

  return stored.status === 'success' ? stored.data : 'right'
}

type HostPanelProps = {
  /** The console's page — its header, its stage and the phase's presses under it. */
  children: React.ReactNode
  /** The tab a wide panel opens on until the host picks one. */
  defaultTab: PanelTab
  /**
   * The stage holds four tiles, which a screen lying down cannot spare a
   * column beside: off the desk, the bar steps aside until the round ends.
   */
  isStageFull: boolean
  /**
   * What a console off the desk opens on: the game, or a tab whose decision
   * the room is waiting on. `null` until the room's first view says which,
   * and the first answer is the one kept.
   */
  narrowStart: NarrowScreen | null
  /** Shown on the players' tab, so a folded rail still counts who arrived. */
  playerCount: number
  /**
   * What each tab holds, or `null` before the room's first view: the panel
   * stands empty rather than absent, so the stage beside it is laid out at
   * its final width from the first frame.
   */
  tabs: Record<PanelTab, React.ReactNode> | null
}

/**
 * The host's controls on a screen only the host sees. On a desk, a panel of
 * four tabs beside the stage, on paper, folded to a rail of the same tabs or
 * moved to the other edge at the host's word and never on its own; both are
 * remembered on this machine. Off it, a tab bar — along the foot, or down the
 * side of a screen lying down — whose first tab is the game itself, each tab
 * replacing the whole screen: a panel sliding in over a phone hides the stage
 * it is setting up.
 *
 * The phase's presses are never in here: they stay under the stage, so a
 * folded panel or another tab never hides what the room is waiting on.
 */
export const HostPanel: React.FC<HostPanelProps> = ({
  children,
  defaultTab,
  isStageFull,
  narrowStart,
  playerCount,
  tabs
}) => {
  const translate = useTranslate()
  const isDesk = useMediaQuery(DESK_SCREEN_QUERY)
  const [isFolded, setIsFolded] = useState(storedFoldOrOpen)
  const [side, setSide] = useState(storedSideOrRight)
  const [chosenTab, setChosenTab] = useState<PanelTab | null>(null)
  const [startScreen, setScreen] = useState(narrowStart)
  const screen = startScreen ?? 'stage'
  const wideTab = chosenTab ?? defaultTab
  const isRail = isDesk && isFolded

  if (startScreen === null && narrowStart !== null) {
    setScreen(narrowStart)
  }

  const fold = (next: boolean) => {
    writeStoredPanelFolded(next)
    setIsFolded(next)
  }

  const moveTo = (next: PanelSide) => {
    writeStoredPanelSide(next)
    setSide(next)
  }

  const badge = (id: PanelTab) =>
    id === 'players' && playerCount > 0 ? (
      <span className='tab-badge'>{playerCount}</span>
    ) : null

  const foldTool = (
    <ReactAriaButton
      aria-label={translate(isFolded ? 'host.panel.unfold' : 'host.panel.fold')}
      className='panel-tool'
      onPress={() => {
        fold(!isFolded)
      }}
    >
      {isFolded ? <PanelOpenIcon /> : <PanelFoldIcon />}
    </ReactAriaButton>
  )

  const sideLabel = translate(
    side === 'right' ? 'host.panel.toLeft' : 'host.panel.toRight'
  )

  const sideTool = (
    <ReactAriaButton
      aria-label={isRail ? sideLabel : undefined}
      className='panel-tool side-tool'
      onPress={() => {
        moveTo(side === 'right' ? 'left' : 'right')
      }}
    >
      <PanelSideIcon />
      {!isRail && sideLabel}
    </ReactAriaButton>
  )

  return (
    <div
      className='host-desk'
      data-folded={isRail || undefined}
      data-screen={isDesk ? undefined : screen}
      data-side={side}
      data-stage-full={isStageFull || undefined}
    >
      {children}
      <aside aria-label={translate('host.panel.label')} className='host-panel'>
        {isRail ? (
          <div className='panel-rail'>
            {foldTool}
            {PANEL_TABS.map(({ icon: Icon, id, label }) => (
              <ReactAriaButton
                className='panel-tab'
                key={id}
                onPress={() => {
                  setChosenTab(id)
                  fold(false)
                }}
              >
                <Icon />
                {translate(label)}
                {badge(id)}
              </ReactAriaButton>
            ))}
            {sideTool}
          </div>
        ) : (
          <Tabs
            onSelectionChange={(key) => {
              if (!isDesk) {
                setScreen(isPanelTab(key) ? key : 'stage')
              } else if (isPanelTab(key)) {
                setChosenTab(key)
              }
            }}
            selectedKey={isDesk ? wideTab : screen}
          >
            <div className='panel-head'>
              <TabList
                aria-label={translate('host.panel.label')}
                className='panel-tabs'
              >
                {!isDesk && (
                  <Tab className='panel-tab' id='stage'>
                    <StageIcon />
                    {translate('host.panel.tabs.stage')}
                  </Tab>
                )}
                {PANEL_TABS.map(({ icon: Icon, id, label }) => (
                  <Tab className='panel-tab' id={id} key={id}>
                    <Icon />
                    {translate(label)}
                    {badge(id)}
                  </Tab>
                ))}
              </TabList>
              {isDesk && foldTool}
            </div>
            {PANEL_TABS.map(({ heading, id }) => (
              <TabPanel className='panel-screen' id={id} key={id}>
                <h2>{translate(heading)}</h2>
                {tabs?.[id]}
              </TabPanel>
            ))}
            {isDesk && <div className='panel-foot'>{sideTool}</div>}
          </Tabs>
        )}
      </aside>
    </div>
  )
}
