import { z } from 'zod'

/**
 * The interface languages this product ships a dictionary for. It lives in the
 * contract rather than in the app because it crosses the wire once: opening a
 * room carries the host's, which is the only signal available for a setting the
 * table has not been asked about yet.
 *
 * It is deliberately *not* `QuestionLanguage`. The two hold the same two members
 * today and mean different things — this one is a dictionary this app ships,
 * that one is a bank somebody wrote — so the map between them is a rule with a
 * fallback, in `@melee/core/quiz/question-language`.
 */
export const LOCALES = ['en', 'fr', 'pt'] as const

export const localeSchema = z.enum(LOCALES)

/**
 * What a request that names no locale is read as. It sits here rather than with
 * the negotiation rule because it is the contract's own fallback: a create-room
 * frame from a tab opened before this field existed still has to mean something.
 */
export const DEFAULT_LOCALE = 'en' as const satisfies Locale

export type Locale = z.infer<typeof localeSchema>

/**
 * The guard that goes with the schema, for a value read back from a place zod
 * is not worth reaching for — a storage blob, a URL segment, a select.
 */
export const isLocale = (value: string): value is Locale =>
  LOCALES.some((locale) => locale === value)

const withShippedLocalesOnly = (input: unknown): unknown =>
  typeof input === 'object' && input !== null && !Array.isArray(input)
    ? Object.fromEntries(Object.entries(input).filter(([key]) => isLocale(key)))
    : input

/**
 * A value in every language this app ships, missing none. A language not
 * shipped yet is dropped rather than refused: a bank gains its rows before the
 * locale joins `LOCALES`, and a screen loaded before a deploy still reads a
 * frame from the server after it.
 */
export const localizedSchema = <Value extends z.ZodType>(value: Value) =>
  z.preprocess(withShippedLocalesOnly, z.record(localeSchema, value))

/**
 * Builds a value for every language this app ships. The one place that spells
 * the keys out, so a locale added to `LOCALES` fails to compile here first.
 */
export const byLocale = <Value>(
  valueIn: (locale: Locale) => Value
): Record<Locale, Value> => ({
  en: valueIn('en'),
  fr: valueIn('fr'),
  pt: valueIn('pt')
})

/**
 * A line of text in every language a screen speaks, each screen reading its
 * own: a country's name in a flag question, the prompt above it.
 */
export const localizedTextSchema = localizedSchema(z.string().min(1))

export type LocalizedText = z.infer<typeof localizedTextSchema>

/**
 * One language's text standing in every locale — a bank row written in one,
 * a line a host typed — so a screen reads `text[locale]` whatever the source.
 */
export const sameInEveryLocale = (text: string): LocalizedText =>
  byLocale(() => text)
