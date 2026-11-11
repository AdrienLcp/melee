import { describe, expect, it } from 'vitest'

import type { Deck, QuizDeckItem } from '@melee/protocol/deck'
import { DEFAULT_GAME_SETTINGS, type GameSettings } from '@melee/protocol/game'

import {
  deckProblems,
  decksFollowingLineUp,
  decksForLineUp
} from './evening-decks'

const RIVER: QuizDeckItem = {
  accepted: [],
  answer: 'La Seine',
  category: null,
  choiceOnly: false,
  decoys: ['La Loire', 'Le Rhône', 'La Garonne'],
  note: null,
  prompt: 'Which river runs through Paris?'
}

const quizDeck = (...items: QuizDeckItem[]): Deck => ({ game: 'quiz', items })

const QUIZ = DEFAULT_GAME_SETTINGS.quiz

describe('deckProblems', () => {
  it('[deck] finds nothing in a deck that holds', () => {
    expect(
      deckProblems({ decks: [null, quizDeck(RIVER)], lineUp: [QUIZ, QUIZ] })
    ).toEqual([])
  })

  it('[deck] refuses a deck past the last entry', () => {
    expect(
      deckProblems({ decks: [null, quizDeck(RIVER)], lineUp: [QUIZ] })
    ).toEqual(['decks[1]: there is no lineUp entry at this index to deal it.'])
  })

  it('[deck] refuses a deck beside an entry of another game', () => {
    expect(
      deckProblems({
        decks: [quizDeck(RIVER)],
        lineUp: [DEFAULT_GAME_SETTINGS.buzzer]
      })
    ).toEqual(['decks[0].game: a quiz deck, beside a lineUp entry of buzzer.'])
  })

  it('[deck] refuses a decoy that is the answer itself', () => {
    expect(
      deckProblems({
        decks: [
          quizDeck(RIVER, {
            ...RIVER,
            decoys: ['La Loire', 'la seine', 'La Garonne']
          })
        ],
        lineUp: [QUIZ]
      })
    ).toEqual(['decks[0].items[1].decoys[1]: “la seine” is the answer itself.'])
  })

  it('[deck] refuses a decoy given twice', () => {
    expect(
      deckProblems({
        decks: [
          quizDeck({ ...RIVER, decoys: ['La Loire', 'Le Rhône', 'la loire'] })
        ],
        lineUp: [QUIZ]
      })
    ).toEqual([
      'decks[0].items[0].decoys[2]: “la loire” is another decoy again.'
    ])
  })

  it('[deck] refuses a decoy a player would be paid for, and the spelling that pays it', () => {
    expect(
      deckProblems({
        decks: [
          quizDeck({
            ...RIVER,
            accepted: ['Sequana'],
            decoys: ['La Loire', 'Séquana', 'La Garonne']
          })
        ],
        lineUp: [QUIZ]
      })
    ).toEqual([
      'decks[0].items[0].decoys[1]: “Séquana” would be graded right — a decoy must not be a spelling of the answer.',
      'decks[0].items[0].accepted[0]: “Sequana” also names the decoy “Séquana”.'
    ])
  })
})

describe('decksFollowingLineUp', () => {
  const BUZZER: GameSettings = { kind: 'buzzer', locksOutOnMiss: true }
  const TUNED_BUZZER: GameSettings = { kind: 'buzzer', locksOutOnMiss: false }

  it('[deck] follows an identical entry to wherever a drag put it', () => {
    expect(
      decksFollowingLineUp({
        decks: ['family', null],
        from: [QUIZ, BUZZER],
        to: [BUZZER, QUIZ]
      })
    ).toEqual([null, 'family'])
  })

  it('[deck] stays on an entry of its game left at its index, whose settings were tuned', () => {
    expect(
      decksFollowingLineUp({
        decks: [null, 'family'],
        from: [QUIZ, BUZZER],
        to: [QUIZ, TUNED_BUZZER]
      })
    ).toEqual([null, 'family'])
  })

  it('[deck] goes with an entry that left the line-up', () => {
    expect(
      decksFollowingLineUp({
        decks: ['family', null],
        from: [QUIZ, BUZZER],
        to: [BUZZER]
      })
    ).toEqual([null])
  })
})

describe('decksForLineUp', () => {
  it('[deck] follows an entry saved as its game alone onto the settings it opened on', () => {
    expect(
      decksForLineUp({
        decks: [quizDeck(RIVER)],
        from: ['quiz'],
        to: [QUIZ]
      })
    ).toEqual([quizDeck(RIVER)])
  })

  it('[deck] drops a deck landing beside another game, and is no deck at all then', () => {
    expect(
      decksForLineUp({
        decks: [quizDeck(RIVER)],
        from: ['quiz'],
        to: [DEFAULT_GAME_SETTINGS.buzzer]
      })
    ).toEqual([])
  })
})
