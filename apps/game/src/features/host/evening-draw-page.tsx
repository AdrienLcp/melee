import type React from 'react'
import { Button as AriaButton } from 'react-aria-components'

import type { HostRoomView, RoomSettings } from '@melee/protocol/room'

import { capabilitiesOf } from '@melee/core/room/game-capabilities'
import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { withoutEntry } from '@melee/core/room/line-up'
import {
  dealsOf,
  isInTheDraw,
  withEntryDealt
} from '@melee/core/room/line-up-deals'
import { isRoundInPlay } from '@melee/core/room/room-phase'

import { Button } from '@/presentation/components/button'
import {
  ChevronRightIcon,
  CrossIcon,
  DiceIcon,
  GameIcon,
  PlusIcon
} from '@/presentation/components/icons'
import { Switch } from '@/presentation/components/switch'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntrySummaries } from '@/presentation/i18n/line-up-entry-names'

import { EveningPage } from './evening-page'

import './evening-draw-page.sass'

type EveningDrawPageProps = {
  isLive: boolean
  /** Opens the shelf a game is added to the draw from. */
  onAdd: () => void
  onBack: () => void
  /** Opens the page of the line-up's entry at that index. */
  onOpen: (at: number) => void
  onSettingsChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, for the evening an entry taken out leaves. */
  preferences: HostPreferences | null
  view: HostRoomView
}

/**
 * The games the rounds past the planned ones are drawn among, on a page of
 * the game tab: every entry whose game may be drawn, a planned one switched
 * in or out of the draw, one in the draw alone taken out of the evening with
 * its ✕, and the shelf to add one to the draw without a planned round.
 */
export const EveningDrawPage: React.FC<EveningDrawPageProps> = ({
  isLive,
  onAdd,
  onBack,
  onOpen,
  onSettingsChange,
  preferences,
  view
}) => {
  const { locale, translate } = useI18n()
  const { settings } = view
  const summaries = useLineUpEntrySummaries(settings.lineUp)
  const deals = dealsOf({
    deals: settings.lineUpDeals,
    lineUp: settings.lineUp
  })
  const drawable = settings.lineUp.flatMap((entry, at) =>
    capabilitiesOf(entry.kind).servesItsOwnContent ? [{ at, entry }] : []
  )
  const isAnyDrawn = deals.some(isInTheDraw)
  const canTakeOut =
    isLive && !isRoundInPlay(view.phase) && settings.lineUp.length > 1

  return (
    <EveningPage onBack={onBack}>
      <header className='entry-lid draw-lid'>
        <DiceIcon />
        <h2>{translate('host.evening.draw.heading')}</h2>
        <p>
          {translate(
            isAnyDrawn ? 'host.evening.draw.said' : 'host.evening.draw.empty'
          )}
        </p>
      </header>

      <ul aria-label={translate('host.evening.draw.heading')} className='draw'>
        {drawable.map(({ at, entry }) => {
          const deal = deals[at]
          const name = summaries[at]?.name ?? ''
          const detail = summaries[at]?.settings

          return (
            <li
              data-out-of-the-draw={!isInTheDraw(deal) || undefined}
              key={at}
              style={{
                '--spine': `var(--spine-${entry.kind})`,
                '--spine-ink': `var(--on-spine-${entry.kind})`
              }}
            >
              <AriaButton
                className='draw-game'
                onPress={() => {
                  onOpen(at)
                }}
              >
                <span className='band' />
                <GameIcon game={entry.kind} />
                <span className='name'>{name}</span>
                <span className='detail'>
                  {deal === 'chance'
                    ? [translate('host.evening.draw.onlyDrawn'), detail]
                        .filter((part) => part != null)
                        .join(' · ')
                    : detail}
                </span>
              </AriaButton>
              {deal === 'chance' ? (
                <Button
                  aria-label={translate('host.evening.draw.takeOut', { name })}
                  className='take-out'
                  isDisabled={!canTakeOut}
                  onPress={() => {
                    onSettingsChange(
                      withoutEntry({
                        at,
                        locale,
                        rememberedFor: (game) =>
                          rememberedSetupFor({ game, preferences }),
                        settings
                      })
                    )
                  }}
                  size='small'
                  variant='underlined'
                >
                  <CrossIcon />
                </Button>
              ) : (
                <Switch
                  aria-label={translate('host.evening.draw.inDrawNamed', {
                    name
                  })}
                  className='in-draw'
                  isDisabled={!isLive}
                  isSelected={deal === 'both'}
                  label={translate('host.evening.draw.inDraw')}
                  onChange={(isDrawn) => {
                    onSettingsChange(
                      withEntryDealt({
                        at,
                        deal: isDrawn ? 'both' : 'row',
                        settings
                      })
                    )
                  }}
                />
              )}
            </li>
          )
        })}
        <li className='add'>
          <AriaButton
            className='draw-game'
            isDisabled={!isLive}
            onPress={onAdd}
          >
            <span className='band'>
              <PlusIcon />
            </span>
            <span className='name'>{translate('host.evening.draw.add')}</span>
            <span className='detail'>
              {translate('host.evening.draw.addHint')}
            </span>
            <ChevronRightIcon className='chevron' />
          </AriaButton>
        </li>
      </ul>

      <p className='hint'>{translate('host.evening.draw.brought')}</p>
    </EveningPage>
  )
}
