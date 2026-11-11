import { describe, expect, it } from 'vitest'

import { questionLanguages } from '@melee/protocol/question'

import { contentTiers } from '@melee/core/round/difficulty-draw'

import blocklist from '../../../scripts/word-answer-blocklist.json' with {
  type: 'json'
}
import {
  drawMysteryWord,
  isFamiliarWord,
  isValidWord,
  mysteryWordAnswers,
  playedMysteryWordId,
  wordFormsByLength
} from './word-bank'

const ANSWER_LENGTHS = [5, 6, 7, 8] as const

/** Four evenings of twenty rounds at one length, which a level dealt from one tier alone must last. */
const TIER_FLOOR = 80

describe('the word bank', () => {
  it('[word-bank] deals every tier at every length in both languages', () => {
    const thin = questionLanguages.flatMap((language) =>
      ANSWER_LENGTHS.flatMap((length) =>
        contentTiers
          .filter(
            (tier) =>
              mysteryWordAnswers({ language, length }).filter(
                (answer) => answer.tier === tier
              ).length < TIER_FLOOR
          )
          .map((tier) => `${language} ${length} ${tier}`)
      )
    )

    expect(thin).toEqual([])
  })

  it('[word-bank] hides only words a seat may try, of the length asked', () => {
    for (const language of questionLanguages) {
      for (const length of ANSWER_LENGTHS) {
        const unfit = mysteryWordAnswers({ language, length }).filter(
          ({ word }) =>
            word.length !== length || !isValidWord({ language, word })
        )

        expect(unfit).toEqual([])
      }
    }
  })

  it('[word-bank] hides no word the blocklist strips', () => {
    for (const language of questionLanguages) {
      const blocked = new Set(blocklist[language])
      const hidden = ANSWER_LENGTHS.flatMap((length) =>
        mysteryWordAnswers({ language, length })
      ).filter(({ word }) => blocked.has(word))

      expect(hidden).toEqual([])
    }
  })

  it('[word-bank] knows common words, folded, and every form of one', () => {
    for (const word of ['MAISON', 'ETE', 'COEUR', 'MANGEAIENT', 'CHEVAUX']) {
      expect(isValidWord({ language: 'fr', word })).toBe(word !== 'MANGEAIENT')
    }

    for (const word of ['HOUSE', 'HOUSES', 'OX', 'WROTE']) {
      expect(isValidWord({ language: 'en', word })).toBe(true)
    }

    expect(isValidWord({ language: 'en', word: 'MAISON' })).toBe(false)
    expect(isValidWord({ language: 'fr', word: 'WHICH' })).toBe(false)
  })

  it('[word-bank] hides lemmas, never an inflected form', () => {
    const hidden = (language: 'en' | 'fr', word: string) =>
      mysteryWordAnswers({ language, length: word.length }).some(
        (answer) => answer.word === word
      )

    expect(hidden('fr', 'MAISON')).toBe(true)
    expect(hidden('fr', 'MAISONS')).toBe(false)
    expect(hidden('fr', 'MANGEONS')).toBe(false)
    expect(hidden('en', 'HOUSE')).toBe(true)
    expect(hidden('en', 'HOUSES')).toBe(false)
    expect(hidden('en', 'WROTE')).toBe(false)
  })

  it('[word-bank] lists the forms of two to nine letters, and names the familiar long ones', () => {
    const forms = wordFormsByLength('fr')

    expect([...forms.keys()].toSorted((left, right) => left - right)).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9
    ])
    expect(forms.get(9)?.includes('ORDINATEUR')).toBe(false)
    expect(isFamiliarWord({ language: 'fr', word: 'TELEPHONE' })).toBe(true)
    expect(isFamiliarWord({ language: 'en', word: 'TELEPHONE' })).toBe(true)
  })

  it('[word-bank] never deals a word the room was already dealt', () => {
    const language = 'en'
    const length = 5
    const playedIds = new Set(
      mysteryWordAnswers({ language, length })
        .slice(1)
        .map(({ word }) => playedMysteryWordId({ language, word }))
    )

    expect(
      drawMysteryWord({ difficulty: 'mixed', language, length, playedIds })
    ).toEqual(mysteryWordAnswers({ language, length })[0])
    expect(
      drawMysteryWord({
        difficulty: 'mixed',
        language,
        length,
        playedIds: new Set([
          ...playedIds,
          playedMysteryWordId({
            language,
            word: mysteryWordAnswers({ language, length })[0]?.word ?? ''
          })
        ])
      })
    ).toBeNull()
  })
})
