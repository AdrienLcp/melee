import { useThemePreference } from '@adrienlcp/theme-preference/react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'

import { BUG_REPORT_NOTE_MAX } from '@melee/protocol/http'

import type { ApiError } from '@/infrastructure/api/melee-api'
import {
  bugReportCooldownLeftMs,
  reportProblem
} from '@/infrastructure/bug-report'
import { useConnection } from '@/presentation/connection/connection-provider'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'
import { themeStore } from '@/presentation/theme/theme-store'

import { Button } from './button'
import { Disclosure } from './disclosure'
import { ArrowIcon, BugIcon } from './icons'
import { RefusalNote } from './refusal-note'
import { TextField } from './text-field'

import './report-problem.sass'

type Sending =
  | { status: 'idle' }
  | { isRetry: boolean; status: 'sending' }
  | { status: 'sent' }
  | { failure: ApiError | 'too_soon'; status: 'failed' }

const FAILURE_KEYS: Record<ApiError | 'too_soon', PlainTranslationKey> = {
  rate_limited: 'menu.report.tooSoon',
  rejected: 'menu.report.failed',
  too_soon: 'menu.report.tooSoon',
  unexpected_response: 'menu.report.failed',
  unreachable: 'menu.report.failed'
}

const sendingAtMount = (): Sending =>
  bugReportCooldownLeftMs() > 0 ? { status: 'sent' } : { status: 'idle' }

/**
 * A row every screen carries, for whoever saw something break: an optional
 * line, and _Send_. What goes with it — the device, the screen, the table and
 * its last two minutes — is `reportProblem`'s, and the field says so, because
 * it leaves the device. The thanks holds for as long as this device has to
 * wait before another, so a second press is never offered to be refused.
 */
export const ReportProblem: React.FC = () => {
  const { locale, translate } = useI18n()
  const { preference } = useThemePreference(themeStore)
  const connection = useConnection()
  const [note, setNote] = useState('')
  const [sending, setSending] = useState<Sending>(sendingAtMount)
  const isSent = sending.status === 'sent'
  const failure = sending.status === 'failed' ? sending.failure : null
  const isRetry =
    failure !== null || (sending.status === 'sending' && sending.isRetry)

  useEffect(() => {
    if (!isSent) {
      return
    }

    const reopen = setTimeout(() => {
      setSending({ status: 'idle' })
    }, bugReportCooldownLeftMs())

    return () => {
      clearTimeout(reopen)
    }
  }, [isSent])

  const send = async (): Promise<void> => {
    setSending({ isRetry: failure !== null, status: 'sending' })

    const sent = await reportProblem({
      note,
      screen: {
        connection:
          connection === null
            ? null
            : { clock: connection.clock, status: connection.status },
        locale,
        theme: preference
      }
    })

    if (sent.status === 'success') {
      setNote('')
      setSending({ status: 'sent' })
    } else {
      setSending({ failure: sent.error, status: 'failed' })
    }
  }

  return (
    <Disclosure
      className='report-problem'
      icon={<BugIcon />}
      label={translate('menu.report.label')}
      summary={null}
    >
      <div
        className='report-form'
        data-open={!isSent || undefined}
        inert={isSent}
      >
        <Form
          onSubmit={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <TextField
            description={translate('menu.report.attached')}
            isMultiline
            label={translate('menu.report.field')}
            maxLength={BUG_REPORT_NOTE_MAX}
            name='report-note'
            onChange={setNote}
            value={note}
          />
          <Button
            icon={<ArrowIcon />}
            isPending={sending.status === 'sending'}
            size='small'
            type='submit'
            variant='outlined'
          >
            <span className='name' key={String(isRetry)}>
              {translate(isRetry ? 'menu.report.retry' : 'menu.report.send')}
            </span>
          </Button>
          <RefusalNote
            message={failure === null ? null : translate(FAILURE_KEYS[failure])}
          />
        </Form>
      </div>
      <div
        className='report-sent'
        data-open={isSent || undefined}
        inert={!isSent}
      >
        <div>
          <p role='status'>{translate('menu.report.sent')}</p>
        </div>
      </div>
    </Disclosure>
  )
}
