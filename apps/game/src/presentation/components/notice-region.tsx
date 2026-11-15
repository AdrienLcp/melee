import type React from 'react'
import {
  Text,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastRegion as ToastRegion
} from 'react-aria-components'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { CheckIcon, CrossIcon, FaultIcon } from './icons'
import {
  dismissNotice,
  type Notice,
  noticeQueue,
  removeNotice,
  useLeavingNotices
} from './notices'

import './notice-region.sass'

type NoticeCardProps = {
  isLeaving: boolean
  noticeKey: string
  notice: Notice
}

const NoticeCard: React.FC<NoticeCardProps> = ({
  isLeaving,
  noticeKey,
  notice
}) => {
  const translate = useTranslate()

  return (
    <div
      className='notice-piece'
      data-leaving={isLeaving || undefined}
      data-tone={notice.tone}
      onAnimationEnd={
        isLeaving
          ? (event) => {
              if (
                event.target === event.currentTarget &&
                event.animationName === 'row-closes'
              ) {
                removeNotice(noticeKey)
              }
            }
          : undefined
      }
    >
      <span aria-hidden className='notice-mark'>
        {notice.tone === 'fault' ? <FaultIcon /> : <CheckIcon />}
      </span>
      <ToastContent className='notice-words'>
        <Text className='notice-title' slot='title'>
          {notice.title}
        </Text>
        {notice.description !== null && (
          <Text className='notice-description' slot='description'>
            {notice.description}
          </Text>
        )}
      </ToastContent>
      {notice.action !== null && (
        <Button
          className='notice-action'
          onPress={notice.action.onPress}
          size='small'
        >
          {notice.action.label}
        </Button>
      )}
      {notice.action === null && (
        <Button
          aria-label={translate('notice.dismiss')}
          className='notice-dismiss'
          onPress={() => {
            dismissNotice(noticeKey)
          }}
          size='small'
          variant='underlined'
        >
          <CrossIcon />
        </Button>
      )}
    </div>
  )
}

/**
 * Where every notice of every screen is said: below the menu's row, so the
 * exits stay in reach, and above the page, so a fault is never a line lost at
 * the foot of a panel. A notice carrying a press stands until what it says
 * is fixed, so it has no dismiss of its own.
 */
export const NoticeRegion: React.FC = () => {
  const leaving = useLeavingNotices()

  return (
    <ToastRegion className='notice-region' queue={noticeQueue}>
      {({ toast }) => (
        <Toast className='notice-slot' toast={toast}>
          <NoticeCard
            isLeaving={leaving.has(toast.key)}
            notice={toast.content}
            noticeKey={toast.key}
          />
        </Toast>
      )}
    </ToastRegion>
  )
}
