import { describe, expect, it } from 'vitest'

import {
  withClipSpan,
  withHoldFields,
  withLocalizedFiveClues,
  withLocalizedQuiz
} from './stored-round'

describe('a round stored before the ready hold', () => {
  it('[stored] reads as counting the setting’s hold, with nothing waived', () => {
    expect(withHoldFields({ advancesAt: 42_000 })).toEqual({
      advancesAt: 42_000,
      isHoldWaived: false,
      isReadyHold: false,
      settingHoldEndsAt: 42_000
    })
  })

  it('[stored] keeps the fields a current round already carries', () => {
    const current = {
      advancesAt: 5_000,
      isHoldWaived: false,
      isReadyHold: true,
      settingHoldEndsAt: 20_000
    }

    expect(withHoldFields(current)).toEqual(current)
  })
})

describe('a blind test round stored before a flash existed', () => {
  const track = {
    artist: 'Toto',
    coverUrl: null,
    film: null,
    id: '1079668',
    previewUrl: 'https://cdn.example/africa.mp3',
    title: 'Africa'
  }
  const stored = {
    content: {
      choices: [],
      correctChoiceIndex: null,
      kind: 'blindtest' as const,
      playback: { isPaused: false, restarts: 0 },
      track
    }
  }

  it('[stored] plays its whole clip from the top', () => {
    expect(withClipSpan(stored).content).toEqual({
      ...stored.content,
      clip: { startMs: 0, windowMs: null }
    })
  })

  it('[stored] keeps the span a current round carries', () => {
    const current = {
      content: { ...stored.content, clip: { startMs: 10_000, windowMs: 1_000 } }
    }

    expect(withClipSpan(current)).toEqual(current)
  })
})

describe('a quiz round stored before a question was read in every language', () => {
  const question = {
    accepted: ['Cervin'],
    answer: 'Le Cervin',
    category: 'geography' as const,
    decoys: ['Le Chasseral', 'Le Suchet', 'Le Roti'] as const,
    flag: null,
    id: 'question-1',
    note: null,
    prompt: 'Which mountain is the most recognisable in Switzerland?',
    rebus: null,
    silhouette: null
  }
  const stored = {
    content: {
      choices: ['Le Suchet', 'Le Cervin', 'Le Roti', 'Le Chasseral'],
      correctChoiceIndex: 1,
      kind: 'quiz' as const,
      question
    }
  }
  const everywhere = (text: string) => ({ en: text, fr: text, pt: text })

  it('[stored] reads its one language’s text in every locale, the right pick kept', () => {
    expect(withLocalizedQuiz(stored).content).toEqual({
      choices: ['Le Suchet', 'Le Cervin', 'Le Roti', 'Le Chasseral'].map(
        everywhere
      ),
      correctChoiceIndex: 1,
      kind: 'quiz',
      question: {
        ...question,
        answer: everywhere('Le Cervin'),
        decoys: question.decoys.map(everywhere),
        prompt: everywhere(question.prompt)
      }
    })
  })

  it('[stored] keeps a question already read in every language', () => {
    const current = withLocalizedQuiz(stored)

    expect(withLocalizedQuiz(current)).toEqual(current)
  })
})

describe('a five clues round stored while it dealt one language for the table', () => {
  const stored = {
    content: {
      answer: {
        accepted: ['Peru'],
        answer: 'Pérou',
        decoys: ['Équateur', 'Mali', 'Chili']
      },
      choices: ['Mali', 'Pérou', 'Chili', 'Équateur'],
      clueDurationMs: 10_000,
      clueOpenedAtElapsedMs: 0,
      correctChoiceIndex: 1,
      kind: 'fiveclues' as const,
      ladder: [
        {
          areaSquareKilometres: 1_285_216,
          kind: 'size' as const,
          population: 34_200_000
        },
        { kind: 'region' as const, region: '005' as const },
        { kind: 'text' as const, text: 'Andean' },
        { cities: ['Cuzco', 'Arequipa'], kind: 'cities' as const },
        {
          capital: 'Lima',
          flag: 'abcdef012345.svg',
          kind: 'flag' as const
        }
      ],
      openClueIndex: 2,
      seats: new Map(),
      subject: 'country' as const
    }
  }
  const everywhere = (text: string) => ({ en: text, fr: text, pt: text })

  it('[stored] reads its one language’s names and rungs in every locale, the right pick and the grading kept', () => {
    expect(withLocalizedFiveClues(stored).content).toEqual({
      ...stored.content,
      answer: {
        accepted: ['Peru'],
        answer: everywhere('Pérou'),
        decoys: ['Équateur', 'Mali', 'Chili'].map(everywhere)
      },
      choices: ['Mali', 'Pérou', 'Chili', 'Équateur'].map(everywhere),
      ladder: [
        stored.content.ladder[0],
        stored.content.ladder[1],
        { kind: 'text', text: everywhere('Andean') },
        { cities: ['Cuzco', 'Arequipa'].map(everywhere), kind: 'cities' },
        { capital: everywhere('Lima'), flag: 'abcdef012345.svg', kind: 'flag' }
      ]
    })
  })

  it('[stored] keeps a round already read in every language', () => {
    const current = withLocalizedFiveClues(stored)

    expect(withLocalizedFiveClues(current)).toEqual(current)
  })
})
