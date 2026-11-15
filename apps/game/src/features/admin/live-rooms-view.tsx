import type React from 'react'
import { useEffect, useState } from 'react'

import type { AdminLiveRoomsResponse } from '@melee/protocol/admin'

import { fetchAdminRooms } from '@/infrastructure/api/melee-api'
import { Loader } from '@/presentation/components/loader'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { minutesSince } from './admin-time'

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

  if (listed === null) {
    return <Loader label={translate('admin.views.rooms')} />
  }

  if (listed.rooms.length === 0) {
    return <p className='admin-empty'>{translate('admin.rooms.empty')}</p>
  }

  return (
    <ul className='admin-rows'>
      {listed.rooms.map((room) => (
        <li
          className='admin-row room-row'
          data-closed={room.closedAt !== null || undefined}
          key={room.code}
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
                when: -minutesSince({ at: room.openedAt, now: listed.now })
              }),
              translate('admin.rooms.moved', {
                when: -minutesSince({ at: room.updatedAt, now: listed.now })
              })
            ]
              .filter((fact) => fact !== null)
              .join(' · ')}
          </span>
        </li>
      ))}
    </ul>
  )
}
