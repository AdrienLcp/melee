import type React from 'react'

import { type Soundtrack, soundtrackSchema } from '@melee/protocol/room'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { Select } from './select'

const SOUNDTRACK_KEYS: Readonly<Record<Soundtrack, PlainTranslationKey>> = {
  arcade: 'preferences.music.arcade',
  drift: 'preferences.music.drift',
  lofi: 'preferences.music.lofi',
  lounge: 'preferences.music.lounge',
  marimba: 'preferences.music.marimba',
  mix: 'preferences.music.mix',
  off: 'preferences.music.off'
}

const soundtrackOf = (key: unknown): Soundtrack | undefined =>
  soundtrackSchema.options.find((soundtrack) => soundtrack === key)

/**
 * What the room's speaker plays between the game's own sounds, under the
 * room volume. A module of its own because the console alone draws it, so no
 * player's screen downloads the list it opens.
 */
export const MenuMusicChoice: React.FC = () => {
  const translate = useTranslate()
  const { setSoundtrack, soundtrack } = useRoomActions()

  if (soundtrack === null || setSoundtrack === null) {
    return null
  }

  return (
    <Select
      label={translate('preferences.music.label')}
      onSelectionChange={(key) => {
        const next = soundtrackOf(key)

        if (next !== undefined) {
          setSoundtrack(next)
        }
      }}
      options={soundtrackSchema.options.map((value) => ({
        id: value,
        label: translate(SOUNDTRACK_KEYS[value])
      }))}
      selectedKey={soundtrack}
    />
  )
}
