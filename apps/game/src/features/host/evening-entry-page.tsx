import type React from 'react'
import { useRef } from 'react'

import type { HostRoomView, RoomSettings } from '@melee/protocol/room'

import { capabilitiesOf } from '@melee/core/room/game-capabilities'
import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { withEntrySource } from '@melee/core/room/line-up'
import { isPlayedOut } from '@melee/core/room/next-game'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import { movedToEntry } from '@melee/core/room/room-settings'

import { DeckNote } from '@/presentation/components/deck-note'
import { GameIcon } from '@/presentation/components/icons'
import { LeavesInPlace } from '@/presentation/components/leaves-in-place'
import { useLastShown } from '@/presentation/components/use-last-shown'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { EveningPage } from './evening-page'
import { EveningStamp, eveningStampOf } from './evening-stamp'
import { isLastRound } from './is-last-round'
import { OwnLinesEditor } from './own-lines-editor'
import { PlaylistPicker } from './playlist-picker'
import { SettingsPanel } from './settings-panel'
import { useCrossFadeOnReshape } from './use-cross-fade-on-reshape'

import './evening-entry-page.sass'

type EveningEntryPageProps = {
  /** The entry's index in the line-up. */
  at: number
  isLive: boolean
  onBack: () => void
  onRememberSlateKey: (itemIndex: number, key: string) => void
  onSettingsChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, or `null` if they never set anything. */
  preferences: HostPreferences | null
  preparedSlateKeys: readonly (string | null)[]
  view: HostRoomView
}

/**
 * One round of the evening on a page of its own: what the game is and its
 * settings, which change the entry and nothing else. What is done to the
 * round itself — copying it, moving it, taking it out — is its row's menu.
 *
 * The entry the next round is on is set through the room's own settings, as
 * the fold always set it. Any other is set through a copy of the room moved
 * onto it, and only its game's settings are written back into the line-up:
 * the answer mode is the next round's, so it is offered on that page alone.
 */
export const EveningEntryPage: React.FC<EveningEntryPageProps> = ({
  at,
  isLive,
  onBack,
  onRememberSlateKey,
  onSettingsChange,
  preferences,
  preparedSlateKeys,
  view
}) => {
  const { locale, translate } = useI18n()
  const { settings } = view
  const entry = settings.lineUp[at]
  const isNext = at === settings.lineUpAt
  const roundInPlay = isRoundInPlay(view.phase)
  const played = view.lineUpPlayed[at] ?? 0
  const isFixed = entry !== undefined && isPlayedOut({ entry, played })
  const body = useRef<HTMLDivElement>(null)

  useCrossFadeOnReshape({ box: body, shape: isFixed ? 'fixed' : 'open' })

  const stamp =
    entry === undefined
      ? null
      : eveningStampOf({
          entry,
          isEveningOver: view.phase === 'revealed' && isLastRound(view),
          isNext,
          isOnlyEntry: settings.lineUp.length < 2,
          phase: view.phase,
          played
        })
  const shownStamp = useLastShown(stamp)

  if (entry === undefined) {
    return <EveningPage onBack={onBack} />
  }

  const entrySettings = isNext
    ? settings
    : movedToEntry({
        at,
        locale,
        remembered: rememberedSetupFor({ game: entry.kind, preferences }),
        settings
      })
  const changeEntry = (changed: RoomSettings) => {
    onSettingsChange(
      isNext
        ? changed
        : {
            ...settings,
            lineUp: settings.lineUp.with(at, changed.game ?? entry)
          }
    )
  }
  const deck = view.deckSummaries[at] ?? null
  const awaitsSlateKey = entry.kind === 'slate' && !isNext

  return (
    <EveningPage onBack={onBack}>
      <header
        className='entry-lid'
        style={{ '--spine': `var(--spine-${entry.kind})` }}
      >
        <GameIcon game={entry.kind} />
        <h2>{translate(gameNameKey(entry.kind))}</h2>
        <p>
          {translate(
            capabilitiesOf(entry.kind).servesItsOwnContent
              ? 'host.evening.fills'
              : 'host.evening.once'
          )}
        </p>
        {/* A stable piece around the stamp, whose own key swaps it in. */}
        <LeavesInPlace value={stamp === null ? null : 'stamp'}>
          {() => (
            <span className='stamp-piece'>
              {shownStamp !== null && (
                <EveningStamp kind={shownStamp} played={played} />
              )}
            </span>
          )}
        </LeavesInPlace>
        {deck !== null && (
          <DeckNote game={entry.kind} left={deck.size - deck.played} />
        )}
      </header>

      <div className='entry-body' ref={body}>
        {isFixed ? (
          <p className='fixed'>{translate('host.evening.fixed')}</p>
        ) : (
          <div className='entry-settings'>
            {entry.kind === 'blindtest' && (
              <PlaylistPicker
                key={at}
                onSourceChange={(source) => {
                  onSettingsChange(withEntrySource({ at, settings, source }))
                }}
                settings={entry}
              />
            )}
            <SettingsPanel
              isLive={isLive}
              isNextRound={isNext}
              isRoundInPlay={roundInPlay && isNext}
              isSeated={view.youId !== null}
              isSheetOnStage={view.phase === 'lobby' && isNext}
              onChange={changeEntry}
              onPrepareSlateKey={onRememberSlateKey}
              preparedSlateKeys={preparedSlateKeys}
              settings={entrySettings}
            />
            {entry.kind === 'challenge' && (
              <p className='hint'>{translate('host.evening.challengeLine')}</p>
            )}
            {entry.kind === 'slate' && (
              <div
                className='hint-fold'
                data-open={awaitsSlateKey || undefined}
                inert={!awaitsSlateKey}
              >
                <p className='hint'>
                  {translate('host.evening.slateKeyLater')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {(entry.kind === 'challenge' || entry.kind === 'mostlikely') && (
        <OwnLinesEditor game={entry.kind} />
      )}
    </EveningPage>
  )
}
