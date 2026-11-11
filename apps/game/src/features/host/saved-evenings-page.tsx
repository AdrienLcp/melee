import type React from 'react'
import { useId, useRef, useState } from 'react'
import { Button as AriaButton, Form } from 'react-aria-components'

import { EVENING_NAME_MAX_LENGTH } from '@melee/protocol/evening'
import type { HostRoomView } from '@melee/protocol/room'

import {
  isSameName,
  type SavedEntry,
  type SavedEvening
} from '@melee/core/room/saved-evening'

import { Button } from '@/presentation/components/button'
import { CopyButton } from '@/presentation/components/copy-button'
import {
  ChevronRightIcon,
  CrossIcon,
  SavedIcon
} from '@/presentation/components/icons'
import { TextField } from '@/presentation/components/text-field'
import { useLastShown } from '@/presentation/components/use-last-shown'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { EveningPage } from './evening-page'
import { SavedEveningsTransfer } from './saved-evenings-transfer'
import { useCrossFadeOnReshape } from './use-cross-fade-on-reshape'
import { useEveningLinks } from './use-evening-links'

import './saved-evenings.sass'

const kindOf = (entry: SavedEntry) =>
  typeof entry === 'string' ? entry : entry.kind

/** Each entry's game with a key that tells two entries of one game apart. */
export const spinesOf = (lineUp: readonly SavedEntry[]) =>
  lineUp.map((entry, index) => {
    const kind = kindOf(entry)
    const nth = lineUp
      .slice(0, index)
      .filter((other) => kindOf(other) === kind).length

    return { id: `${kind}:${nth}`, kind }
  })

type SavedEveningsDoorProps = {
  /** How many evenings this host has kept. */
  count: number
  isDisabled: boolean
  onOpen: () => void
}

/** The row under the planned games that opens the saved evenings in their place. */
export const SavedEveningsDoor: React.FC<SavedEveningsDoorProps> = ({
  count,
  isDisabled,
  onOpen
}) => {
  const translate = useTranslate()

  return (
    <AriaButton
      className='saved-evenings-door'
      isDisabled={isDisabled}
      onPress={onOpen}
    >
      <SavedIcon />
      <span className='name'>{translate('host.saved.door')}</span>
      <span className='detail'>
        {count === 0
          ? translate('host.saved.doorEmpty')
          : translate('host.saved.doorCount', { count })}
      </span>
      <ChevronRightIcon className='chevron' />
    </AriaButton>
  )
}

type SavedEveningsPageProps = {
  evenings: readonly SavedEvening[]
  isLive: boolean
  /** The kept evening this console last ran or kept, which a press saves the room over; `null` for none. */
  loadedName: string | null
  onBack: () => void
  onForget: (name: string) => void
  /** Folds the evenings a file from another machine carried in among these. */
  onImport: (evenings: readonly SavedEvening[]) => void
  /** Puts the room on `evening`, from its first round. */
  onRun: (evening: SavedEvening) => void
  /** Keeps the evening the room is on under `name`. */
  onSave: (name: string) => void
  view: HostRoomView
}

/**
 * The evenings this host kept, each run again with one press while the table
 * is still in its lobby, and — once the room is on a game — the field that
 * keeps this one, replacing a kept evening of the same name — and the file
 * that carries them, with the host's own lines, to another machine.
 */
export const SavedEveningsPage: React.FC<SavedEveningsPageProps> = ({
  evenings,
  isLive,
  loadedName,
  onBack,
  onForget,
  onImport,
  onRun,
  onSave,
  view
}) => {
  const translate = useTranslate()
  const [name, setName] = useState('')
  const canRun = isLive && view.phase === 'lobby'
  const isReplacing = evenings.some((evening) => isSameName(evening.name, name))
  const loaded = evenings.find(
    (evening) => loadedName !== null && isSameName(evening.name, loadedName)
  )
  const [savedOver, setSavedOver] = useState<string | null>(null)
  const currentSettings = JSON.stringify(view.settings)
  const isUpToDate = savedOver === currentSettings
  const offersSaveOver = view.settings.game !== null && loaded !== undefined
  const lastLoadedName = useLastShown(offersSaveOver ? loaded.name : null) ?? ''

  const [keptWhenOpened] = useState(
    () => new Set(evenings.map((evening) => evening.name))
  )
  const links = useEveningLinks(evenings)
  const kept = useRef<HTMLDivElement>(null)

  useCrossFadeOnReshape({
    box: kept,
    shape: `${evenings.length}:${view.phase === 'lobby'}`
  })

  return (
    <EveningPage onBack={onBack}>
      <section className='saved-evenings'>
        <h2 className='heading'>{translate('host.saved.heading')}</h2>
        <div
          className='over-fold'
          data-open={offersSaveOver || undefined}
          inert={!offersSaveOver}
        >
          <div className='over'>
            <p className='loaded' key={String(isUpToDate)} role='status'>
              {translate(
                isUpToDate ? 'host.saved.savedOver' : 'host.saved.loaded',
                { name: lastLoadedName }
              )}
            </p>
            <Button
              aria-label={translate('host.saved.saveOverNamed', {
                name: lastLoadedName
              })}
              onPress={() => {
                onSave(lastLoadedName)
                setSavedOver(currentSettings)
              }}
              variant='outlined'
            >
              {translate('host.saved.saveOver')}
            </Button>
          </div>
        </div>
        {view.settings.game !== null && (
          <Form
            className='keep'
            onSubmit={(event) => {
              event.preventDefault()
              onSave(name)
              setName('')
              setSavedOver(currentSettings)
            }}
          >
            <TextField
              autoComplete='off'
              description={
                isReplacing ? translate('host.saved.replaces') : undefined
              }
              label={translate('host.saved.name')}
              maxLength={EVENING_NAME_MAX_LENGTH}
              onChange={setName}
              value={name}
            />
            <Button
              isDisabled={name.trim() === ''}
              type='submit'
              variant='outlined'
            >
              {translate(
                isReplacing ? 'host.saved.replace' : 'host.saved.save'
              )}
            </Button>
          </Form>
        )}
        <div className='kept' ref={kept}>
          {evenings.length === 0 ? (
            <p className='hint'>{translate('host.saved.empty')}</p>
          ) : (
            <>
              {view.phase !== 'lobby' && (
                <p className='hint'>{translate('host.saved.inLobby')}</p>
              )}
              <ul className='evenings'>
                {evenings.map((evening) => (
                  <SavedEveningRow
                    evening={evening}
                    hasArrived={!keptWhenOpened.has(evening.name)}
                    isRunnable={canRun}
                    key={evening.name}
                    link={links.get(evening.name) ?? null}
                    onForget={onForget}
                    onRun={onRun}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
        <SavedEveningsTransfer evenings={evenings} onImport={onImport} />
      </section>
    </EveningPage>
  )
}

const SavedEveningRow: React.FC<{
  evening: SavedEvening
  /** Kept while the page was open, so it rises in rather than standing there already. */
  hasArrived: boolean
  isRunnable: boolean
  /** The link it is shared by, or `null` until it is written. */
  link: string | null
  onForget: (name: string) => void
  onRun: (evening: SavedEvening) => void
}> = ({ evening, hasArrived, isRunnable, link, onForget, onRun }) => {
  const translate = useTranslate()
  const nameId = useId()
  const spines = spinesOf(evening.lineUp)
  const games = [...new Set(spines.map(({ kind }) => kind))]
    .map((game) => translate(gameNameKey(game)))
    .join(', ')
  const rounds =
    evening.roundCount === null
      ? translate('host.saved.endless')
      : translate('host.saved.rounds', { count: evening.roundCount })

  return (
    <li data-arrived={hasArrived || undefined}>
      <AriaButton
        aria-label={translate('host.saved.run', { name: evening.name })}
        className='evening'
        isDisabled={!isRunnable}
        onPress={() => {
          onRun(evening)
        }}
      >
        <span aria-hidden className='spines'>
          {spines.map(({ id, kind }) => (
            <span key={id} style={{ '--spine': `var(--spine-${kind})` }} />
          ))}
        </span>
        <span className='name' id={nameId}>
          {evening.name}
        </span>
        <span className='detail'>
          {games} · {rounds}
        </span>
      </AriaButton>
      <CopyButton
        aria-describedby={nameId}
        isDisabled={link === null}
        label='invite.copyLink'
        value={link ?? ''}
      />
      <Button
        aria-label={translate('host.saved.forget', { name: evening.name })}
        className='forget'
        onPress={() => {
          onForget(evening.name)
        }}
        size='small'
        variant='underlined'
      >
        <CrossIcon />
      </Button>
    </li>
  )
}
