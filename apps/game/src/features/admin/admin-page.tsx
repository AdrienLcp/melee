import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { fetchAdminRooms } from '@/infrastructure/api/melee-api'
import { Button } from '@/presentation/components/button'
import { Main } from '@/presentation/components/main'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { TextField } from '@/presentation/components/text-field'
import { useLeavingValue } from '@/presentation/components/use-leaving-value'
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
  const [admitted, setAdmitted] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsPending(true)

    const adminKey = draft.trim()
    const rooms = await fetchAdminRooms({ adminKey })

    setIsPending(false)

    if (rooms.status === 'success') {
      setAdmitted(adminKey)
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
    <Form
      className='key-form'
      data-leaving={admitted !== null || undefined}
      onAnimationEnd={(event) => {
        if (admitted !== null && event.target === event.currentTarget) {
          onAdmitted(admitted)
        }
      }}
      onSubmit={submit}
    >
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
  const [shownView, setShownView] = useState<AdminView>('rooms')
  const admitted = useLeavingValue(adminKey)
  const isViewLeaving = view !== shownView

  const forgetKey = () => {
    setAdminKey(null)
  }

  return (
    <Main className='admin-page'>
      <DocumentTitle>{translate('admin.title')}</DocumentTitle>
      <meta content='noindex, nofollow' name='robots' />
      <h1>{translate('admin.title')}</h1>
      {admitted.drawn === null ? (
        <KeyForm onAdmitted={setAdminKey} />
      ) : (
        <div
          className='admin-console'
          data-leaving={admitted.isLeaving || undefined}
          onAnimationEnd={admitted.onAnimationEnd}
        >
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
          <div
            className='admin-view'
            data-leaving={isViewLeaving || undefined}
            key={shownView}
            onAnimationEnd={(event) => {
              if (isViewLeaving && event.target === event.currentTarget) {
                setShownView(view)
              }
            }}
          >
            {shownView === 'rooms' ? (
              <LiveRoomsView adminKey={admitted.drawn} onRefused={forgetKey} />
            ) : (
              <ReportsView adminKey={admitted.drawn} onRefused={forgetKey} />
            )}
          </div>
        </div>
      )}
    </Main>
  )
}
