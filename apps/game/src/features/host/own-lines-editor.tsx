import type React from 'react'
import { useState } from 'react'

import type { OwnLinesGame } from '@melee/protocol/deck'

import {
  OWN_LINE_MAX_LENGTH,
  OWN_LINES_MAX,
  type OwnLine
} from '@/infrastructure/storage/own-lines-storage'
import { Button } from '@/presentation/components/button'
import { CrossIcon, PlusIcon } from '@/presentation/components/icons'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { setOwnLines, useOwnLines } from './use-own-lines'
import { useRowArrivals } from './use-row-arrivals'

import './own-lines-editor.sass'

type OwnLinesEditorProps = {
  /** Whose lines, which also names every word the editor shows. */
  game: OwnLinesGame
}

/**
 * The lines a host writes for a game before the evening, sent to the room and
 * dealt ahead of the bank's in the order written. Each is saved when its field
 * is left, and one left empty goes.
 */
export const OwnLinesEditor: React.FC<OwnLinesEditorProps> = ({ game }) => {
  const translate = useTranslate()
  const lines = useOwnLines(game)
  const write = (next: readonly OwnLine[]) => {
    setOwnLines({ game, lines: next })
  }
  const [drafts, setDrafts] = useState<Readonly<Record<number, string>>>({})
  const [fresh, setFresh] = useState('')
  const { isArriving, settleOnEnd } = useRowArrivals(lines.length)
  const toCome = lines.filter((line) => !line.isPlayed).length

  const add = () => {
    const text = fresh.trim()

    if (text === '' || lines.length >= OWN_LINES_MAX) {
      return
    }

    write([...lines, { isPlayed: false, text }])
    setFresh('')
  }

  const remove = (at: number) => {
    write(lines.filter((_, index) => index !== at))
    setDrafts({})
  }

  return (
    <section className='own-lines'>
      <header>
        <h3>{translate(`${game}.own.title`)}</h3>
        <span
          aria-hidden={lines.length === 0 || undefined}
          className='summary'
          data-empty={lines.length === 0 || undefined}
        >
          {translate(`${game}.own.summary`, { count: toCome })}
        </span>
      </header>
      <p className='hint'>{translate(`${game}.own.description`)}</p>
      {lines.length > 0 && (
        <ol className='lines'>
          {lines.map((line, at) => (
            <li
              data-arrived={isArriving(at) || undefined}
              data-played={line.isPlayed || undefined}
              key={String(at)}
              onAnimationEnd={settleOnEnd(at)}
            >
              <span className='index'>{at + 1}</span>
              <TextField
                autoComplete='off'
                className='line'
                isMultiline
                label={translate(`${game}.own.field`, { index: at + 1 })}
                maxLength={OWN_LINE_MAX_LENGTH[game]}
                onBlur={() => {
                  const draft = drafts[at]?.trim()

                  if (draft === undefined || draft === line.text) {
                    return
                  }

                  if (draft === '') {
                    remove(at)

                    return
                  }

                  write(
                    lines.map((other, index) =>
                      index === at ? { ...other, text: draft } : other
                    )
                  )
                }}
                onChange={(next) => {
                  setDrafts((previous) => ({ ...previous, [at]: next }))
                }}
                value={drafts[at] ?? line.text}
              />
              {line.isPlayed && (
                <span className='played'>
                  {translate(`${game}.own.played`)}
                </span>
              )}
              <Button
                aria-label={translate(`${game}.own.remove`, {
                  index: at + 1
                })}
                className='remove'
                onPress={() => {
                  remove(at)
                }}
                size='small'
                variant='underlined'
              >
                <CrossIcon />
              </Button>
            </li>
          ))}
        </ol>
      )}
      <form
        className='add'
        onSubmit={(event) => {
          event.preventDefault()
          add()
        }}
      >
        <TextField
          autoComplete='off'
          className='line'
          enterKeyHint='done'
          label={translate(`${game}.own.new`)}
          maxLength={OWN_LINE_MAX_LENGTH[game]}
          onChange={setFresh}
          placeholder={translate(`${game}.own.newPlaceholder`)}
          value={fresh}
        />
        <Button
          isDisabled={fresh.trim() === '' || lines.length >= OWN_LINES_MAX}
          size='small'
          type='submit'
          variant='outlined'
        >
          <PlusIcon />
          {translate(`${game}.own.add`)}
        </Button>
      </form>
    </section>
  )
}
