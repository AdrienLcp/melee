import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { ToggleButton } from 'react-aria-components'

import type {
  AdminReportSummary,
  AdminReportsQuery
} from '@melee/protocol/admin'
import {
  clientReportKinds,
  reportBrowsers,
  serverReportKinds
} from '@melee/protocol/http'

import { fetchAdminReports } from '@/infrastructure/api/melee-api'
import { nowMs } from '@/infrastructure/clock'
import { Button } from '@/presentation/components/button'
import { Loader } from '@/presentation/components/loader'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { TextField } from '@/presentation/components/text-field'
import { useLeavingValue } from '@/presentation/components/use-leaving-value'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { AdminSelect } from './admin-select'
import { receivedAgo } from './admin-time'
import { ReportDetail } from './report-detail'

const KINDS = [...clientReportKinds, ...serverReportKinds]

const WINDOW_MS = {
  day: 86_400_000,
  hour: 3_600_000,
  month: 30 * 86_400_000,
  week: 7 * 86_400_000
} as const

type ReportWindow = keyof typeof WINDOW_MS

type Filters = Pick<
  Partial<AdminReportsQuery>,
  'browser' | 'build' | 'game' | 'kind' | 'room'
> & { since: ReportWindow }

type Listed = { nextBefore: number | null; reports: AdminReportSummary[] }

const isWindow = (value: string): value is ReportWindow => value in WINDOW_MS

const asKind = (value: string | undefined) =>
  KINDS.find((kind) => kind === value)

const asBrowser = (value: string | undefined) =>
  reportBrowsers.find((browser) => browser === value)

const queryOf = ({ since, ...filters }: Filters, now: number) => ({
  ...filters,
  from: now - WINDOW_MS[since]
})

/** The reports kept, newest first, narrowed by its filters, one opened beside the list. */
export const ReportsView: React.FC<{
  /** The key the server accepted. */
  adminKey: string
  /** Called once the server stops accepting it. */
  onRefused: () => void
}> = ({ adminKey, onRefused }) => {
  const translate = useTranslate()
  const [filters, setFilters] = useState<Filters>({ since: 'week' })
  const [listed, setListed] = useState<Listed | null>(null)
  const [openedId, setOpenedId] = useState<number | null>(null)
  const [listedAt, setListedAt] = useState(0)
  const olderRequest = useRef<AbortController | null>(null)
  const opened = useLeavingValue(openedId)

  useEffect(() => {
    const controller = new AbortController()
    const now = nowMs()

    const load = async () => {
      const page = await fetchAdminReports({
        adminKey,
        query: queryOf(filters, now),
        signal: controller.signal
      })

      if (controller.signal.aborted) {
        return
      }

      if (page.status === 'failure') {
        if (page.error === 'rejected') onRefused()
        return
      }

      setListedAt(now)
      setListed(page.data)
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [adminKey, filters, onRefused])

  useEffect(
    () => () => {
      olderRequest.current?.abort()
    },
    []
  )

  const loadOlder = async () => {
    if (listed?.nextBefore == null) return

    olderRequest.current?.abort()
    const controller = new AbortController()
    olderRequest.current = controller

    const page = await fetchAdminReports({
      adminKey,
      query: { ...queryOf(filters, listedAt), before: listed.nextBefore },
      signal: controller.signal
    })

    if (page.status === 'success') {
      setListed({
        nextBefore: page.data.nextBefore,
        reports: [...listed.reports, ...page.data.reports]
      })
    }
  }

  const narrow = (change: Partial<Filters>) => {
    setOpenedId(null)
    setFilters({ ...filters, ...change })
  }

  return (
    <div
      className='reports-view'
      data-opened={opened.drawn !== null || undefined}
    >
      <div className='report-filters'>
        <AdminSelect
          anyLabel={translate('admin.reports.any')}
          label={translate('admin.reports.filters.kind')}
          onChange={(kind) => narrow({ kind: asKind(kind) })}
          options={KINDS}
          value={filters.kind}
        />
        <AdminSelect
          anyLabel={translate('admin.reports.any')}
          label={translate('admin.reports.filters.browser')}
          onChange={(browser) => narrow({ browser: asBrowser(browser) })}
          options={reportBrowsers}
          value={filters.browser}
        />
        {(['game', 'build', 'room'] as const).map((field) => (
          <TextField
            autoCapitalize={field === 'room' ? 'characters' : 'off'}
            key={field}
            label={translate(`admin.reports.filters.${field}`)}
            onChange={(value) => narrow({ [field]: value.trim() || undefined })}
            value={filters[field] ?? ''}
          />
        ))}
        <SegmentedControl
          label={translate('admin.reports.filters.since')}
          onChange={(since) => {
            if (isWindow(since)) narrow({ since })
          }}
          options={(['hour', 'day', 'week', 'month'] as const).map((value) => ({
            label: translate(`admin.reports.windows.${value}`),
            value
          }))}
          value={filters.since}
        />
      </div>
      <div className='report-list'>
        {listed === null ? (
          <Loader label={translate('admin.views.reports')} />
        ) : listed.reports.length === 0 ? (
          <p className='admin-empty'>{translate('admin.reports.empty')}</p>
        ) : (
          <>
            <ul className='admin-rows'>
              {listed.reports.map((report) => {
                const ago = receivedAgo({
                  at: report.receivedAt,
                  now: listedAt
                })

                return (
                  <li key={report.id}>
                    <ToggleButton
                      className='admin-row report-row'
                      isSelected={report.id === openedId}
                      onChange={(isOpened) => {
                        setOpenedId(isOpened ? report.id : null)
                      }}
                    >
                      <span className='row-title'>
                        {report.kind}
                        {report.code !== null && (
                          <span className='row-tag'>{report.code}</span>
                        )}
                      </span>
                      <span className='row-message'>
                        {report.errorMessage ??
                          translate('admin.reports.noMessage')}
                      </span>
                      <span className='row-facts'>
                        {[
                          translate(ago.key, { when: ago.when }),
                          report.browserName === null
                            ? null
                            : `${report.browserName} ${report.browserVersion ?? ''}`.trim(),
                          report.role,
                          report.game,
                          report.roomCode
                        ]
                          .filter((fact) => fact !== null)
                          .join(' · ')}
                      </span>
                    </ToggleButton>
                  </li>
                )
              })}
            </ul>
            {listed.nextBefore !== null && (
              <Button onPress={loadOlder} size='small' variant='outlined'>
                {translate('admin.reports.more')}
              </Button>
            )}
          </>
        )}
      </div>
      {opened.drawn !== null && (
        <ReportDetail
          adminKey={adminKey}
          id={opened.drawn}
          isLeaving={opened.isLeaving}
          onAnimationEnd={opened.onAnimationEnd}
          onClose={() => {
            setOpenedId(null)
          }}
        />
      )}
    </div>
  )
}
