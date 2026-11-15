import type React from 'react'
import { useEffect, useState } from 'react'

import type { AdminLiveRoomsResponse } from '@melee/protocol/admin'

import { fetchAdminRooms } from '@/infrastructure/api/melee-api'
import { Loader } from '@/presentation/components/loader'
import { NoticeCard } from '@/presentation/components/notice-card'
import { useLeavingRows } from '@/presentation/components/use-leaving-rows'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { timeAgo } from './admin-time'
import { Unreachable } from './unreachable'

const REFRESH_MS = 10_000

/** Every open room, and the ones closed a moment ago, refreshed every ten seconds. */
export const LiveRoomsView: React.FC<{
  /** The key the server accepted. */
  adminKey: string
  /** Called once the server stops accepting it. */
  onRefused: () => void
}> = ({ adminKey, onRefused }) => {
  const translate = useTranslate()
  const [listed, setListed] = useState<AdminLiveRoomsResponse | null>(null)
  const [isUnreachable, setIsUnreachable] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let next: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      const rooms = await fetchAdminRooms({
        adminKey,
        signal: controller.signal
      })

      if (controller.signal.aborted) {
        return
      }

      if (rooms.status === 'failure' && rooms.error === 'rejected') {
        onRefused()
        return
      }

      setIsUnreachable(rooms.status === 'failure')

      if (rooms.status === 'success') {
        setListed(rooms.data)
      }

      next = setTimeout(poll, REFRESH_MS)
    }

    void poll()

    return () => {
      controller.abort()

      if (next !== null) {
        clearTimeout(next)
      }
    }
  }, [adminKey, onRefused])

  const drawn = useLeavingRows({
    exitAnimation: 'row-closes',
    rows: (listed?.rooms ?? []).map((room) => ({ ...room, id: room.code }))
  })

  if (listed === null) {
    return isUnreachable ? (
      <Unreachable />
    ) : (
      <Loader label={translate('admin.views.rooms')} />
    )
  }

  const isEmpty = listed.rooms.length === 0

  const agoWords = (at: number) => {
    const ago = timeAgo({ at, now: listed.now })

    return translate(ago.key, { when: ago.when })
  }

  return (
    <div className='live-rooms'>
      <div className='fold' data-open={isEmpty || undefined} inert={!isEmpty}>
        <div>
          <NoticeCard
            detail={translate('admin.rooms.emptyDetail')}
            title={translate('admin.rooms.empty')}
          />
        </div>
      </div>
      <ul className='admin-rows'>
        {drawn.rows.map((room) => (
          <li
            className='admin-slot'
            data-arriving={room.isArriving || undefined}
            data-leaving={room.isLeaving || undefined}
            key={room.id}
            onAnimationEnd={
              room.isLeaving ? drawn.endExitOf(room.id) : undefined
            }
          >
            <div
              className='admin-row room-row'
              data-closed={room.closedAt !== null || undefined}
            >
              <span className='room-code'>{room.code}</span>
              <span className='row-title'>
                {room.game ?? translate('admin.rooms.noGame')}
                <span className='row-tag'>
                  {room.closedAt === null
                    ? room.phase
                    : translate('admin.rooms.closed')}
                </span>
              </span>
              <span className='row-facts'>
                {[
                  room.roundIndex === null
                    ? null
                    : translate('admin.rooms.round', { n: room.roundIndex }),
                  translate('admin.rooms.seats', { count: room.seatCount }),
                  translate('admin.rooms.walls', { count: room.wallCount }),
                  translate('admin.rooms.opened', {
                    when: agoWords(room.openedAt)
                  }),
                  translate('admin.rooms.moved', {
                    when: agoWords(room.updatedAt)
                  })
                ]
                  .filter((fact) => fact !== null)
                  .join(' · ')}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
