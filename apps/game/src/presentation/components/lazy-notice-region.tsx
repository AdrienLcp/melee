import type React from 'react'
import { Suspense, use } from 'react'

import { lazyModule } from '@/infrastructure/lazy-module'

import { useHasNotices } from './notices'

import './notice-region.sass'

const noticeRegionModule = lazyModule(() => import('./notice-region'))

const LoadedNoticeRegion: React.FC = () => {
  const { NoticeRegion } = use(noticeRegionModule.load())

  return <NoticeRegion />
}

/**
 * The notice region behind its own chunk, fetched when the first notice is
 * queued: react-aria's toast region is weight on every page, and a player
 * arriving from a QR code is rarely told anything. Each notice enters on its
 * own keyframe as it mounts, so one drawn the moment the chunk lands still
 * plays its entrance.
 */
export const LazyNoticeRegion: React.FC = () => {
  const hasNotices = useHasNotices()

  if (!hasNotices) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <LoadedNoticeRegion />
    </Suspense>
  )
}
