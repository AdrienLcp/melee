import type React from 'react'
import { useState } from 'react'

import type { PetitBacSettings } from '@melee/protocol/game'
import {
  MAX_PETIT_BAC_CATEGORIES,
  MIN_PETIT_BAC_CATEGORIES,
  MIN_PLAYABLE_PETIT_BAC_LETTERS,
  PETIT_BAC_OWN_CATEGORY_MAX_LENGTH,
  type PetitBacBankCategory,
  type PetitBacCategory,
  petitBacBankCategories,
  petitBacLetters
} from '@melee/protocol/petit-bac'

import { Button } from '@/presentation/components/button'
import { CrossIcon, PlusIcon } from '@/presentation/components/icons'
import { NumberField } from '@/presentation/components/number-field'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { Switch } from '@/presentation/components/switch'
import { TextField } from '@/presentation/components/text-field'
import { ToggleGroup } from '@/presentation/components/toggle-group'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { NumberChoice, useDurationLabels } from './number-choice'

import './petit-bac-setup.sass'

const WRITING_DURATIONS_MS = [60_000, 120_000, 180_000] as const

/** What a host switching to a list of their own starts from: the paper game's classic six. */
const CLASSIC_CATEGORIES: readonly PetitBacCategory[] = [
  { key: 'country', kind: 'bank' },
  { key: 'animal', kind: 'bank' },
  { key: 'firstName', kind: 'bank' },
  { key: 'job', kind: 'bank' },
  { key: 'brand', kind: 'bank' },
  { key: 'kitchenThing', kind: 'bank' }
]

const DRAWN = 'drawn'
const FIXED = 'fixed'

const asBankCategory = (
  value: string | number
): PetitBacBankCategory | undefined =>
  petitBacBankCategories.find((key) => key === value)

const asLetter = (value: string | number) =>
  petitBacLetters.find((letter) => letter === value)

type PetitBacSetupProps = {
  game: PetitBacSettings
  isDisabled: boolean
  onChange: (game: PetitBacSettings) => void
}

/**
 * What a round of Petit Bac is played on: the categories — drawn afresh each
 * round, or one list the host picked from the box and wrote into — the letters
 * the draw may land on, how long the sheets stay open and whether a full one
 * may close them.
 */
export const PetitBacSetup: React.FC<PetitBacSetupProps> = ({
  game,
  isDisabled,
  onChange
}) => {
  const translate = useTranslate()
  const { seconds: secondsLabel } = useDurationLabels()
  const excluded = new Set<string>(game.excludedLetters)

  return (
    <div className='petit-bac-setup'>
      <SegmentedControl
        isDisabled={isDisabled}
        label={translate('petitbac.setup.categories')}
        onChange={(next) => {
          onChange({
            ...game,
            categories: next === FIXED ? [...CLASSIC_CATEGORIES] : null
          })
        }}
        options={[
          { label: translate('petitbac.setup.drawn'), value: DRAWN },
          { label: translate('petitbac.setup.fixed'), value: FIXED }
        ]}
        value={game.categories === null ? DRAWN : FIXED}
      />

      {game.categories === null ? (
        <NumberField
          className='category-count'
          isDisabled={isDisabled}
          label={translate('petitbac.setup.count')}
          maxValue={MAX_PETIT_BAC_CATEGORIES}
          minValue={MIN_PETIT_BAC_CATEGORIES}
          onChange={(categoryCount) => {
            if (Number.isInteger(categoryCount)) {
              onChange({ ...game, categoryCount })
            }
          }}
          value={game.categoryCount}
        />
      ) : (
        <FixedCategories
          categories={game.categories}
          isDisabled={isDisabled}
          onChange={(categories) => {
            onChange({ ...game, categories })
          }}
        />
      )}

      <ToggleGroup
        className='letters'
        isDisabled={isDisabled}
        label={translate('petitbac.setup.letters')}
        onSelectionChange={(keys) => {
          const kept = new Set([...keys].map(asLetter))

          // Fewer than this and the server refuses the frame, so the press is
          // not sent rather than sent and bounced.
          if (kept.size >= MIN_PLAYABLE_PETIT_BAC_LETTERS) {
            onChange({
              ...game,
              excludedLetters: petitBacLetters.filter(
                (letter) => !kept.has(letter)
              )
            })
          }
        }}
        options={petitBacLetters.map((letter) => ({
          label: letter,
          value: letter
        }))}
        selectedKeys={petitBacLetters.filter((letter) => !excluded.has(letter))}
      />

      <NumberChoice
        isDisabled={isDisabled}
        label={translate('petitbac.setup.duration')}
        onChange={(roundDurationMs) => {
          onChange({ ...game, roundDurationMs })
        }}
        optionLabel={secondsLabel}
        options={WRITING_DURATIONS_MS}
        value={game.roundDurationMs}
      />

      <Switch
        isDisabled={isDisabled}
        isSelected={game.stopsWhenFull}
        label={translate('petitbac.setup.stop')}
        onChange={(stopsWhenFull) => {
          onChange({ ...game, stopsWhenFull })
        }}
      />
    </div>
  )
}

type FixedCategoriesProps = {
  categories: readonly PetitBacCategory[]
  isDisabled: boolean
  /** Only ever called with a list the server takes: between three and ten. */
  onChange: (categories: PetitBacCategory[]) => void
}

/** The box's categories as chips, then the host's own lines, played in that order every round. */
const FixedCategories: React.FC<FixedCategoriesProps> = ({
  categories,
  isDisabled,
  onChange
}) => {
  const translate = useTranslate()
  const [fresh, setFresh] = useState('')
  const own = categories.filter((category) => category.kind === 'own')
  const picked = categories
    .filter((category) => category.kind === 'bank')
    .map((category) => category.key)
  const isFull = categories.length >= MAX_PETIT_BAC_CATEGORIES

  const submit = (next: PetitBacCategory[]) => {
    if (
      next.length >= MIN_PETIT_BAC_CATEGORIES &&
      next.length <= MAX_PETIT_BAC_CATEGORIES
    ) {
      onChange(next)
    }
  }

  const add = () => {
    const label = fresh.trim()
    const isTaken = own.some(
      (category) => category.label.toLowerCase() === label.toLowerCase()
    )

    if (label === '' || isFull || isTaken) {
      return
    }

    submit([...categories, { kind: 'own', label }])
    setFresh('')
  }

  return (
    <section className='fixed-categories'>
      <p className='summary'>
        {translate('petitbac.setup.summary', {
          count: categories.length,
          max: MAX_PETIT_BAC_CATEGORIES,
          min: MIN_PETIT_BAC_CATEGORIES
        })}
      </p>

      <ToggleGroup
        className='bank'
        isDisabled={isDisabled}
        label={translate('petitbac.setup.bank')}
        onSelectionChange={(keys) => {
          const chosen = new Set([...keys].map(asBankCategory))

          submit([
            ...petitBacBankCategories
              .filter((key) => chosen.has(key))
              .map((key) => ({ key, kind: 'bank' as const })),
            ...own
          ])
        }}
        options={petitBacBankCategories.map((key) => ({
          label: translate(`petitbac.category.${key}`),
          value: key
        }))}
        selectedKeys={picked}
      />

      {own.length > 0 && (
        <ul
          aria-label={translate('petitbac.setup.own')}
          className='own-categories'
        >
          {own.map(({ label }) => (
            <li key={label}>
              <span>{label}</span>
              <Button
                aria-label={translate('petitbac.setup.remove', { label })}
                isDisabled={
                  isDisabled || categories.length <= MIN_PETIT_BAC_CATEGORIES
                }
                onPress={() => {
                  submit(
                    categories.filter(
                      (category) =>
                        category.kind !== 'own' || category.label !== label
                    )
                  )
                }}
                size='small'
                variant='underlined'
              >
                <CrossIcon />
              </Button>
            </li>
          ))}
        </ul>
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
          enterKeyHint='done'
          isDisabled={isDisabled || isFull}
          label={translate('petitbac.setup.new')}
          maxLength={PETIT_BAC_OWN_CATEGORY_MAX_LENGTH}
          onChange={setFresh}
          placeholder={translate('petitbac.setup.newPlaceholder')}
          value={fresh}
        />
        <Button
          isDisabled={isDisabled || isFull || fresh.trim() === ''}
          size='small'
          type='submit'
          variant='outlined'
        >
          <PlusIcon />
          {translate('petitbac.setup.add')}
        </Button>
      </form>
    </section>
  )
}
