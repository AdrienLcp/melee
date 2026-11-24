import type { FiveCluesClue } from '@melee/protocol/five-clues'
import { sameInEveryLocale } from '@melee/protocol/locale'
import {
  type HostQuestion,
  writtenInOneLanguage
} from '@melee/protocol/question'

import { clipSpanFor } from '@melee/core/blindtest/clip-audio'
import type { QuestionAnswer } from '@melee/core/quiz/question-answer'

import type { Round } from './room'

type HoldFields = Pick<
  Round,
  'isHoldWaived' | 'isReadyHold' | 'settingHoldEndsAt'
>

/**
 * A round as the Durable Object stored it, which may predate the ready hold: a
 * room outlives a deploy, and a round missing these fields put `undefined` on
 * a view the schema refuses, so every screen of that room lost its snapshot.
 * The hold it was counting is the setting's, the only one that existed.
 */
export const withHoldFields = <T extends Pick<Round, 'advancesAt'>>(
  round: T & Partial<HoldFields>
): T & HoldFields => ({
  ...round,
  isHoldWaived: round.isHoldWaived ?? false,
  isReadyHold: round.isReadyHold ?? false,
  settingHoldEndsAt: round.settingHoldEndsAt ?? round.advancesAt
})

type BlindtestContent = Extract<Round['content'], { kind: 'blindtest' }>

/** A round's content as storage may hand it back: a blind test's without its span. */
type StoredContent = Round['content'] | Omit<BlindtestContent, 'clip'>

/**
 * A blind test round stored before a flash existed, which played its whole
 * clip from the top: without its span the view put `undefined` where the
 * schema wants one, and the room lost its snapshot on every screen.
 */
export const withClipSpan = <T extends { content: StoredContent }>(
  round: T
): Omit<T, 'content'> & Pick<Round, 'content'> => {
  const { content } = round

  if (content.kind !== 'blindtest') {
    return { ...round, content }
  }

  return {
    ...round,
    content: {
      ...content,
      clip: 'clip' in content ? content.clip : clipSpanFor(null)
    }
  }
}

type QuizContent = Extract<Round['content'], { kind: 'quiz' }>

/** A quiz round's content as stored before a question was read in every language. */
type WrittenQuizContent = Omit<QuizContent, 'choices' | 'question'> & {
  choices: string[]
  question: Omit<HostQuestion, 'answer' | 'decoys' | 'prompt'> & {
    answer: string
    decoys: readonly [string, string, string]
    prompt: string
  }
}

const isWrittenQuiz = (
  content: Round['content'] | WrittenQuizContent
): content is WrittenQuizContent =>
  content.kind === 'quiz' && typeof content.question.answer === 'string'

/**
 * A quiz round stored before its question was read in every language, whose
 * one language's text a screen would read as a record of three and draw
 * nothing: the text it holds stands in every locale.
 */
export const withLocalizedQuiz = <
  T extends { content: Round['content'] | WrittenQuizContent }
>(
  round: T
): Omit<T, 'content'> & Pick<Round, 'content'> => {
  const { content } = round

  if (!isWrittenQuiz(content)) {
    return { ...round, content }
  }

  return {
    ...round,
    content: {
      ...content,
      choices: content.choices.map(sameInEveryLocale),
      question: {
        ...content.question,
        ...writtenInOneLanguage(content.question)
      }
    }
  }
}

type FiveCluesContent = Extract<Round['content'], { kind: 'fiveclues' }>

/** A rung as stored while five clues dealt one language for the table. */
type WrittenClue =
  | Exclude<FiveCluesClue, { kind: 'cities' | 'flag' | 'image' | 'text' }>
  | (Omit<Extract<FiveCluesClue, { kind: 'cities' }>, 'cities'> & {
      cities: string[]
    })
  | (Omit<Extract<FiveCluesClue, { kind: 'flag' }>, 'capital'> & {
      capital: string
    })
  | (Omit<Extract<FiveCluesClue, { kind: 'image' }>, 'alt'> & { alt: string })
  | (Omit<Extract<FiveCluesClue, { kind: 'text' }>, 'text'> & { text: string })

/** A five clues round's content as stored while it dealt one language for the table. */
type WrittenFiveCluesContent = Omit<
  FiveCluesContent,
  'answer' | 'choices' | 'ladder'
> & {
  answer: QuestionAnswer
  choices: string[]
  ladder: WrittenClue[]
}

const isWrittenFiveClues = (
  content: Round['content'] | WrittenFiveCluesContent
): content is WrittenFiveCluesContent =>
  content.kind === 'fiveclues' && typeof content.answer.answer === 'string'

const localizedClue = (clue: WrittenClue): FiveCluesClue => {
  switch (clue.kind) {
    case 'cities':
      return { ...clue, cities: clue.cities.map(sameInEveryLocale) }
    case 'flag':
      return { ...clue, capital: sameInEveryLocale(clue.capital) }
    case 'image':
      return { ...clue, alt: sameInEveryLocale(clue.alt) }
    case 'text':
      return { ...clue, text: sameInEveryLocale(clue.text) }
    default:
      return clue
  }
}

/**
 * A five clues round stored while it dealt one language for the table, whose
 * names and rungs a screen would read as a record of three and draw nothing:
 * the text it holds stands in every locale, and the typed line is graded
 * against it as before.
 */
export const withLocalizedFiveClues = <
  T extends { content: Round['content'] | WrittenFiveCluesContent }
>(
  round: T
): Omit<T, 'content'> & Pick<Round, 'content'> => {
  const { content } = round

  if (!isWrittenFiveClues(content)) {
    return { ...round, content }
  }

  return {
    ...round,
    content: {
      ...content,
      answer: {
        accepted: content.answer.accepted,
        answer: sameInEveryLocale(content.answer.answer),
        decoys: content.answer.decoys.map(sameInEveryLocale)
      },
      choices: content.choices.map(sameInEveryLocale),
      ladder: content.ladder.map(localizedClue)
    }
  }
}
