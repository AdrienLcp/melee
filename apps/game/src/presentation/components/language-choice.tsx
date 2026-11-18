import type { Locale } from '@melee/protocol/locale'
import type { QuestionLanguage } from '@melee/protocol/question'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { LANGUAGE_NAMES } from '@/presentation/i18n/language-names'

import './language-choice.sass'

type Language = Locale | QuestionLanguage

type LanguageChoiceProps<Choice extends Language> = {
  isDisabled?: boolean
  label: string
  /** Offered in order, each named in its own words. */
  languages: readonly Choice[]
  onChange: (language: Choice) => void
  value: Choice
}

/**
 * The strip that picks a language — the menu's for the interface, a game's for
 * what it deals — whose labels are the same words in every locale, so it
 * stacks at one width wherever it is mounted.
 */
export const LanguageChoice = <Choice extends Language>({
  languages,
  onChange,
  ...props
}: LanguageChoiceProps<Choice>) => (
  <SegmentedControl
    {...props}
    className='language-choice'
    onChange={(next) => {
      const chosen = languages.find((language) => language === next)

      if (chosen !== undefined) {
        onChange(chosen)
      }
    }}
    options={languages.map((language) => ({
      label: LANGUAGE_NAMES[language],
      value: language
    }))}
  />
)
