import type { Soundtrack, SoundtrackStyle } from '@melee/protocol/room'

import { nextSoundtrackStyle } from '@melee/core/room/ambient-music'

import { type AmbientPlayer, startStyles } from './ambient-player'
import type { Style } from './piece'
import { arcadeStyle } from './styles/arcade'
import { driftStyle } from './styles/drift'
import { lofiStyle } from './styles/lofi'
import { loungeStyle } from './styles/lounge'
import { marimbaStyle } from './styles/marimba'

const STYLES: Readonly<Record<SoundtrackStyle, Style>> = {
  arcade: arcadeStyle,
  drift: driftStyle,
  lofi: lofiStyle,
  lounge: loungeStyle,
  marimba: marimbaStyle
}

export type SoundtrackPlayer = AmbientPlayer & {
  /**
   * Takes the room's new choice: a style other than the one playing
   * crossfades into it at once, a mix draws from the next piece.
   */
  follow: (soundtrack: Soundtrack) => void
}

/** The room's soundtrack, loaded only once a speaker's audio runs. */
export const startSoundtrack = ({
  context,
  soundtrack
}: {
  context: AudioContext
  soundtrack: Soundtrack
}): SoundtrackPlayer => {
  let chosen = soundtrack
  let playing: SoundtrackStyle | null = null

  const player = startStyles({
    context,
    destination: context.destination,
    styleOfNextPiece: () => {
      const next =
        nextSoundtrackStyle({
          previous: playing,
          random: Math.random,
          soundtrack: chosen
        }) ??
        playing ??
        'lounge'

      playing = next

      return STYLES[next]
    }
  })

  return {
    ...player,
    follow: (next) => {
      chosen = next

      if (next !== 'off' && next !== 'mix' && next !== playing) {
        player.crossfadeNow()
      }
    }
  }
}
