import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { AdminReportResponse } from '@melee/protocol/admin'

import { fetchAdminReport } from '@/infrastructure/api/melee-api'
import { Button } from '@/presentation/components/button'
import { ArrowIcon } from '@/presentation/components/icons'
import { Loader } from '@/presentation/components/loader'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

type Frame = { direction: string; type: string }

const isFrame = (value: unknown): value is Frame =>
  typeof value === 'object' &&
  value !== null &&
  'direction' in value &&
  'type' in value

/** A sent report's room view and settings, read as the one blob they were on the screen. */
const WHOLE_PATHS: ReadonlySet<string> = new Set(['settings', 'view'])

/** Every leaf of the context under its dotted path, the frames and the stack drawn apart. */
const contextRows = (
  value: unknown,
  path: string
): { name: string; value: string }[] => {
  if (path === 'frames' || path === 'error.stack') {
    return []
  }

  if (WHOLE_PATHS.has(path)) {
    return [{ name: path, value: JSON.stringify(value) }]
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([name, child]) =>
      contextRows(child, path === '' ? name : `${path}.${name}`)
    )
  }

  return [{ name: path, value: JSON.stringify(value) }]
}

const stackOf = (context: AdminReportResponse['context']): string | null => {
  const { error } = context

  return typeof error === 'object' &&
    error !== null &&
    'stack' in error &&
    typeof error.stack === 'string'
    ? error.stack
    : null
}

/** One report opened whole: every field of its context, the frame trail and the stack. */
export const ReportDetail: React.FC<{
  adminKey: string
  id: number
  /** Playing its exit, after the list let it go. */
  isLeaving: boolean
  onAnimationEnd: React.AnimationEventHandler | undefined
  onClose: () => void
}> = ({ adminKey, id, isLeaving, onAnimationEnd, onClose }) => {
  const translate = useTranslate()
  const [report, setReport] = useState<AdminReportResponse | null>(null)
  const [failedId, setFailedId] = useState<number | null>(null)
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    section.current?.scrollIntoView({ block: 'nearest' })

    const load = async () => {
      const found = await fetchAdminReport({
        adminKey,
        id,
        signal: controller.signal
      })

      if (controller.signal.aborted) {
        return
      }

      if (found.status === 'success') {
        setReport(found.data)
      } else if (found.error !== 'aborted') {
        setFailedId(id)
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [adminKey, id])

  const frames = Array.isArray(report?.context.frames)
    ? report.context.frames
        .filter(isFrame)
        .map((frame, ordinal) => ({ ...frame, ordinal }))
    : []
  const stack = report === null ? null : stackOf(report.context)

  return (
    <section
      aria-labelledby='report-detail-title'
      className='report-detail'
      data-leaving={isLeaving || undefined}
      onAnimationEnd={onAnimationEnd}
      ref={section}
    >
      <Button onPress={onClose} size='small' variant='underlined'>
        {translate('admin.detail.close')}
      </Button>
      {failedId === id ? (
        <p className='admin-empty'>{translate('admin.detail.failed')}</p>
      ) : report === null || report.id !== id ? (
        <Loader label={translate('admin.detail.context')} />
      ) : (
        <div className='detail-body' key={report.id}>
          <h2 id='report-detail-title'>
            {report.kind}
            <span className='row-tag'>#{report.id}</span>
          </h2>
          {report.errorMessage !== null && (
            <p className='detail-message'>
              {report.errorName}: {report.errorMessage}
            </p>
          )}
          <h3>{translate('admin.detail.context')}</h3>
          <dl className='detail-fields'>
            {contextRows(report.context, '').map((row) => (
              <div key={row.name}>
                <dt>{row.name}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
            <div>
              <dt>serverBuild</dt>
              <dd>{report.serverBuild}</dd>
            </div>
          </dl>
          <h3>{translate('admin.detail.frames')}</h3>
          {frames.length === 0 ? (
            <p className='admin-empty'>{translate('admin.detail.noFrames')}</p>
          ) : (
            <ol className='detail-frames'>
              {frames.map((frame) => (
                <li data-direction={frame.direction} key={frame.ordinal}>
                  <ArrowIcon aria-hidden />
                  <VisuallyHidden>
                    {translate(
                      frame.direction === 'in'
                        ? 'admin.detail.received'
                        : 'admin.detail.sent'
                    )}
                  </VisuallyHidden>
                  {frame.type}
                </li>
              ))}
            </ol>
          )}
          <h3>{translate('admin.detail.stack')}</h3>
          {stack === null ? (
            <p className='admin-empty'>{translate('admin.detail.noStack')}</p>
          ) : (
            <pre className='detail-stack'>{stack}</pre>
          )}
        </div>
      )}
    </section>
  )
}
