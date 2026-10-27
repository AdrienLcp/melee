import type React from 'react'
import { useCallback } from 'react'

import type { HostRoomView, RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import { capabilitiesOf } from '@melee/core/room/game-capabilities'
import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { endsTheEvening, isPlayedOut } from '@melee/core/room/next-game'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import { movedToEntry } from '@melee/core/room/room-settings'

import { GameIcon } from '@/presentation/components/icons'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { EveningPage } from './evening-page'
import { EveningStamp, eveningStampOf } from './evening-stamp'
import { OwnChallengeLinesEditor } from './own-challenge-lines-editor'
import { PlaylistPicker } from './playlist-picker'
import { SettingsPanel } from './settings-panel'

import './evening-entry-page.sass'

type EveningEntryPageProps = {
  /** The entry's index in the line-up. */
  at: number
  /** The blind test's source as the picker shows it, while this entry is the next round's. */
  draftSource: TrackSource | null
  isLive: boolean
  onBack: () => void
  /** Must be stable — the picker reports upward from an effect. */
  onDraftSource: (source: TrackSource | null) => void
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
  draftSource,
  isLive,
  onBack,
  onDraftSource,
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

  const commitSource = useCallback(
    (source: TrackSource | null) => {
      const current = settings.lineUp[at]

      if (
        source === null ||
        current?.kind !== 'blindtest' ||
        JSON.stringify(source) === JSON.stringify(current.source)
      ) {
        return
      }

      onSettingsChange({
        ...settings,
        lineUp: settings.lineUp.with(at, { ...current, source })
      })
    },
    [at, onSettingsChange, settings]
  )

  if (entry === undefined) {
    return <EveningPage onBack={onBack} />
  }

  const played = view.lineUpPlayed[at] ?? 0
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
  const stamp = eveningStampOf({
    entry,
    isEveningOver:
      view.phase === 'revealed' &&
      endsTheEvening({
        lineUp: settings.lineUp,
        played: view.lineUpPlayed,
        roundCount: settings.roundCount,
        roundIndex: view.round?.index ?? 0
      }),
    isNext,
    isOnlyEntry: settings.lineUp.length < 2,
    phase: view.phase,
    played
  })
  const isFixed = isPlayedOut({ entry, played })

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
        {stamp !== null && <EveningStamp kind={stamp} played={played} />}
      </header>

      {isFixed ? (
        <p className='fixed'>{translate('host.evening.fixed')}</p>
      ) : (
        <div className='entry-settings'>
          {entry.kind === 'blindtest' && (
            <PlaylistPicker
              key={at}
              onDraftChange={isNext ? onDraftSource : commitSource}
              settings={entry}
            />
          )}
          <SettingsPanel
            draftSource={isNext ? draftSource : null}
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
          {entry.kind === 'slate' && !isNext && (
            <p className='hint'>{translate('host.evening.slateKeyLater')}</p>
          )}
        </div>
      )}

      {entry.kind === 'challenge' && <OwnChallengeLinesEditor />}
    </EveningPage>
  )
}
