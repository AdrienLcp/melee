import type React from 'react'
import { useState } from 'react'

import { CHALLENGE_TEXT_MAX_LENGTH } from '@melee/protocol/challenge'

import { OWN_CHALLENGE_LINES_MAX } from '@/infrastructure/storage/own-challenge-lines-storage'
import { Button } from '@/presentation/components/button'
import { CrossIcon, PlusIcon } from '@/presentation/components/icons'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import {
  setOwnChallengeLines,
  useOwnChallengeLines
} from './use-own-challenge-lines'

import './own-challenge-lines-editor.sass'

/**
 * The challenge lines a host writes before the evening, dealt into the hand
 * ahead of the bank's in the order written. Each is saved when its field is
 * left, and one left empty goes.
 */
export const OwnChallengeLinesEditor: React.FC = () => {
  const translate = useTranslate()
  const lines = useOwnChallengeLines()
  const [drafts, setDrafts] = useState<Readonly<Record<number, string>>>({})
  const [fresh, setFresh] = useState('')
  const toCome = lines.filter((line) => !line.isPlayed).length

  const add = () => {
    const text = fresh.trim()

    if (text === '' || lines.length >= OWN_CHALLENGE_LINES_MAX) {
      return
    }

    setOwnChallengeLines([...lines, { isPlayed: false, text }])
    setFresh('')
  }

  const remove = (at: number) => {
    setOwnChallengeLines(lines.filter((_, index) => index !== at))
    setDrafts({})
  }

  return (
    <section className='own-challenge-lines'>
      <header>
        <h3>{translate('challenge.own.title')}</h3>
        <span className='summary'>
          {translate('challenge.own.summary', { count: toCome })}
        </span>
      </header>
      <p className='hint'>{translate('challenge.own.description')}</p>
      {lines.length > 0 && (
        <ol className='lines'>
          {lines.map((line, at) => (
            <li data-played={line.isPlayed || undefined} key={String(at)}>
              <span className='index'>{at + 1}</span>
              <TextField
                autoComplete='off'
                className='line'
                isMultiline
                label={translate('challenge.own.field', { index: at + 1 })}
                maxLength={CHALLENGE_TEXT_MAX_LENGTH}
                onBlur={() => {
                  const draft = drafts[at]?.trim()

                  if (draft === undefined || draft === line.text) {
                    return
                  }

                  if (draft === '') {
                    remove(at)

                    return
                  }

                  setOwnChallengeLines(
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
                  {translate('challenge.own.played')}
                </span>
              )}
              <Button
                aria-label={translate('challenge.own.remove', {
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
          label={translate('challenge.own.new')}
          maxLength={CHALLENGE_TEXT_MAX_LENGTH}
          onChange={setFresh}
          placeholder={translate('challenge.own.newPlaceholder')}
          value={fresh}
        />
        <Button
          isDisabled={
            fresh.trim() === '' || lines.length >= OWN_CHALLENGE_LINES_MAX
          }
          size='small'
          type='submit'
          variant='outlined'
        >
          <PlusIcon />
          {translate('challenge.own.add')}
        </Button>
      </form>
    </section>
  )
}
