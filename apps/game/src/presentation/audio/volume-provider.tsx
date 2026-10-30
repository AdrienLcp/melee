import { createSafeContext } from '@adrienlcp/react'
import type React from 'react'
import { useState } from 'react'

import {
  readStoredVolume,
  writeStoredVolume
} from '@/infrastructure/storage/preferences-storage'

type VolumeContextValue = {
  setVolume: (volume: number) => void
  /**
   * 0 to 1, the level a console last set its room to, which the next room it
   * opens starts at. The speaker plays the room's `volume`, and this only until
   * the console has said it.
   */
  volume: number
}

const DEFAULT_VOLUME = 0.8

const storedVolumeOrDefault = (): number => {
  const stored = readStoredVolume()

  return stored.status === 'success' && stored.data !== null
    ? stored.data
    : DEFAULT_VOLUME
}

export const [VolumeContext, useVolume] =
  createSafeContext<VolumeContextValue>('VolumeProvider')

/**
 * The room volume this machine remembers, held above the router so the menu
 * and the console read one number rather than two. A console seeds each room
 * it opens with it and keeps it in step with the room's slider.
 *
 * Written on every change rather than on unmount: a console is closed by
 * closing the tab, and nothing runs after that.
 */
export const VolumeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [volume, setVolume] = useState(storedVolumeOrDefault)

  const chooseVolume = (next: number): void => {
    setVolume(next)
    writeStoredVolume(next)
  }

  return (
    <VolumeContext value={{ setVolume: chooseVolume, volume }}>
      {children}
    </VolumeContext>
  )
}
