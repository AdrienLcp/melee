import { type AmbientPlayer, startStyle } from './ambient-player'
import { loungeStyle } from './styles/lounge'

/** The room's soundtrack, loaded only once a speaker's audio runs. */
export const startSoundtrack = (context: AudioContext): AmbientPlayer =>
  startStyle({ context, destination: context.destination, style: loungeStyle })
