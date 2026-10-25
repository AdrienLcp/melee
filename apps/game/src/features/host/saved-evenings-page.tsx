import type React from 'react'
import { useState } from 'react'
import { Button as AriaButton, Form } from 'react-aria-components'

import type { HostRoomView } from '@melee/protocol/room'

import {
  isSameName,
  SAVED_EVENING_NAME_MAX_LENGTH,
  type SavedEntry,
  type SavedEvening
} from '@melee/core/room/saved-evening'

import { Button } from '@/presentation/components/button'
import {
  ChevronRightIcon,
  CrossIcon,
  SavedIcon
} from '@/presentation/components/icons'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { EveningPage } from './evening-page'

import './saved-evenings.sass'

const kindOf = (entry: SavedEntry) =>
  typeof entry === 'string' ? entry : entry.kind

/** Each entry's game with a key that tells two entries of one game apart. */
const spinesOf = (lineUp: readonly SavedEntry[]) =>
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
  onBack: () => void
  onForget: (name: string) => void
  /** Puts the room on `evening`, from its first round. */
  onRun: (evening: SavedEvening) => void
  /** Keeps the evening the room is on under `name`. */
  onSave: (name: string) => void
  view: HostRoomView
}

/**
 * The evenings this host kept, each run again with one press while the table
 * is still in its lobby, and — once the room is on a game — the field that
 * keeps this one, replacing a kept evening of the same name.
 */
export const SavedEveningsPage: React.FC<SavedEveningsPageProps> = ({
  evenings,
  isLive,
  onBack,
  onForget,
  onRun,
  onSave,
  view
}) => {
  const translate = useTranslate()
  const [name, setName] = useState('')
  const canRun = isLive && view.phase === 'lobby'
  const isReplacing = evenings.some((evening) => isSameName(evening.name, name))

  return (
    <EveningPage onBack={onBack}>
      <section className='saved-evenings'>
        <h2 className='heading'>{translate('host.saved.heading')}</h2>
        {view.settings.game !== null && (
          <Form
            className='keep'
            onSubmit={(event) => {
              event.preventDefault()
              onSave(name)
              setName('')
            }}
          >
            <TextField
              autoComplete='off'
              label={translate('host.saved.name')}
              maxLength={SAVED_EVENING_NAME_MAX_LENGTH}
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
                  isRunnable={canRun}
                  key={evening.name}
                  onForget={onForget}
                  onRun={onRun}
                />
              ))}
            </ul>
          </>
        )}
      </section>
    </EveningPage>
  )
}

const SavedEveningRow: React.FC<{
  evening: SavedEvening
  isRunnable: boolean
  onForget: (name: string) => void
  onRun: (evening: SavedEvening) => void
}> = ({ evening, isRunnable, onForget, onRun }) => {
  const translate = useTranslate()
  const spines = spinesOf(evening.lineUp)
  const games = [...new Set(spines.map(({ kind }) => kind))]
    .map((game) => translate(gameNameKey(game)))
    .join(', ')
  const rounds =
    evening.roundCount === null
      ? translate('host.saved.endless')
      : translate('host.saved.rounds', { count: evening.roundCount })

  return (
    <li>
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
        <span className='name'>{evening.name}</span>
        <span className='detail'>
          {games} · {rounds}
        </span>
      </AriaButton>
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
