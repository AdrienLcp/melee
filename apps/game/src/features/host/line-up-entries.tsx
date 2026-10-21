import type React from 'react'

import type { RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import {
  canHoldVariants,
  followedByLineUp,
  withoutEntry,
  withVariantAdded
} from '@melee/core/room/line-up'
import { movedToEntry } from '@melee/core/room/room-settings'

import { Button } from '@/presentation/components/button'
import { CrossIcon, PlusIcon } from '@/presentation/components/icons'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntryNames } from '@/presentation/i18n/line-up-entry-names'

import './line-up-entries.sass'

type LineUpEntriesProps = {
  /** The blind test's source as its picker shows it, committed before the fold moves to another entry. */
  draftSource: TrackSource | null
  /** The socket is closed, or a round is under way and the server would refuse a switch. */
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, or `null` if they never set anything. */
  preferences: HostPreferences | null
  settings: RoomSettings
}

/**
 * The entries of the evening, at the head of the round's settings: which one
 * the fold below is setting, and so which one the next round is on — one
 * control, because they are the same fact. A variant is added from the entry
 * being set, as a copy the fold then changes, and an entry is taken out from
 * here once the evening holds another.
 */
export const LineUpEntries: React.FC<LineUpEntriesProps> = ({
  draftSource,
  isDisabled,
  onChange,
  preferences,
  settings
}) => {
  const { locale, translate } = useI18n()
  const drafted = withDraftSource({ draftSource, settings })
  const names = useLineUpEntryNames(drafted.lineUp)
  const { game, lineUp, lineUpAt } = drafted

  if (game === null || lineUpAt === null) {
    return null
  }

  const rememberedFor = (kind: (typeof lineUp)[number]['kind']) =>
    rememberedSetupFor({ game: kind, preferences })

  return (
    <div className='line-up-entries'>
      {lineUp.length > 1 && (
        <SegmentedControl
          className='entries'
          description={translate('host.lineUp.entryHint')}
          isDisabled={isDisabled}
          label={translate('host.lineUp.next')}
          onChange={(value) => {
            const at = Number(value)
            const entry = lineUp[at]

            if (entry !== undefined && at !== lineUpAt) {
              onChange(
                movedToEntry({
                  at,
                  locale,
                  remembered: rememberedFor(entry.kind),
                  settings: drafted
                })
              )
            }
          }}
          options={names.map((name, at) => ({
            label: name,
            value: String(at)
          }))}
          value={String(lineUpAt)}
        />
      )}
      <div className='entry-actions'>
        {canHoldVariants(game.kind) && (
          <Button
            isDisabled={isDisabled}
            onPress={() => {
              onChange(withVariantAdded(drafted))
            }}
            size='small'
            variant='outlined'
          >
            <PlusIcon />
            {translate('host.lineUp.addVariant')}
          </Button>
        )}
        {lineUp.length > 1 && (
          <Button
            isDisabled={isDisabled}
            onPress={() => {
              onChange(
                withoutEntry({
                  at: lineUpAt,
                  locale,
                  rememberedFor,
                  settings: drafted
                })
              )
            }}
            size='small'
            variant='outlined'
          >
            <CrossIcon />
            {translate('host.lineUp.takeOut')}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * The settings with the picker's source in the blind test the fold is
 * setting, and in its entry, so a press that moves the fold elsewhere does not
 * drop what was chosen there.
 */
const withDraftSource = ({
  draftSource,
  settings
}: {
  draftSource: TrackSource | null
  settings: RoomSettings
}): RoomSettings =>
  draftSource === null || settings.game?.kind !== 'blindtest'
    ? settings
    : followedByLineUp({
        ...settings,
        game: { ...settings.game, source: draftSource }
      })
