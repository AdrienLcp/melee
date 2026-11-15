import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { fetchAdminRooms } from '@/infrastructure/api/melee-api'
import { Button } from '@/presentation/components/button'
import { Main } from '@/presentation/components/main'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { TextField } from '@/presentation/components/text-field'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { LiveRoomsView } from './live-rooms-view'
import { ReportsView } from './reports-view'

import './admin-page.sass'

type AdminView = 'reports' | 'rooms'

const KeyForm: React.FC<{
  /** Called with a key the server accepted. */
  onAdmitted: (adminKey: string) => void
}> = ({ onAdmitted }) => {
  const translate = useTranslate()
  const [draft, setDraft] = useState('')
  const [refusal, setRefusal] = useState<{
    draft: string
    reason: 'admin.key.refused' | 'admin.key.unreachable'
  } | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsPending(true)

    const rooms = await fetchAdminRooms({ adminKey: draft })

    setIsPending(false)

    if (rooms.status === 'success') {
      onAdmitted(draft)
      return
    }

    setRefusal({
      draft,
      reason:
        rooms.error === 'unreachable'
          ? 'admin.key.unreachable'
          : 'admin.key.refused'
    })
  }

  const isRefused = refusal !== null && refusal.draft === draft

  return (
    <Form className='key-form' onSubmit={submit}>
      <TextField
        autoComplete='current-password'
        errorMessage={isRefused ? translate(refusal.reason) : undefined}
        isInvalid={isRefused}
        isRequired
        label={translate('admin.key.label')}
        name='password'
        onChange={setDraft}
        type='password'
        value={draft}
      />
      <Button isPending={isPending} type='submit' variant='filled'>
        {translate('admin.key.submit')}
      </Button>
    </Form>
  )
}

/**
 * The back office: the rooms open now and the error reports kept
 * (`docs/observability.md`). Its key is asked for on arrival and held in
 * memory alone — a password manager fills it, nothing on the device keeps it —
 * and a request the server refuses later sends the page back to the form.
 */
export const AdminPage: React.FC = () => {
  const translate = useTranslate()
  const [adminKey, setAdminKey] = useState<string | null>(null)
  const [view, setView] = useState<AdminView>('rooms')

  const forgetKey = () => {
    setAdminKey(null)
  }

  return (
    <Main className='admin-page'>
      <DocumentTitle>{translate('admin.title')}</DocumentTitle>
      <meta content='noindex, nofollow' name='robots' />
      <h1>{translate('admin.title')}</h1>
      {adminKey === null ? (
        <KeyForm onAdmitted={setAdminKey} />
      ) : (
        <>
          <SegmentedControl
            label={translate('admin.views.label')}
            onChange={(next) => {
              setView(next === 'reports' ? 'reports' : 'rooms')
            }}
            options={[
              { label: translate('admin.views.rooms'), value: 'rooms' },
              { label: translate('admin.views.reports'), value: 'reports' }
            ]}
            value={view}
          />
          <div className='admin-view' key={view}>
            {view === 'rooms' ? (
              <LiveRoomsView adminKey={adminKey} onRefused={forgetKey} />
            ) : (
              <ReportsView adminKey={adminKey} onRefused={forgetKey} />
            )}
          </div>
        </>
      )}
    </Main>
  )
}
