import type { QuestionLanguage } from '@melee/protocol/question'

/**
 * A language the word games hold a dictionary and a letter draw for. Portuguese
 * has both before it is a question language a room may play in; once `pt`
 * joins `QuestionLanguage` this is the same union, and goes
 * (`docs/plans/72-portuguese.md`, session 08).
 */
export type WordLanguage = QuestionLanguage | 'pt'
