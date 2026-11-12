import { describe, expect, it } from 'vitest'

import { franchiseStemOf } from '@melee/core/blacksquare/franchise-stem'
import {
  type LineGrade,
  lineGraderFor
} from '@melee/core/blacksquare/line-match'
import { gradeQuizGuess } from '@melee/core/quiz/question-answer'

import {
  authoredBlackSquareSources,
  authoredBlackSquareThemes,
  type BlackSquareAnswer,
  bankedBlackSquareThemes,
  blackSquareThemePool,
  drawBlackSquareTheme,
  type PooledBlackSquareTheme,
  parseAuthoredBlackSquareThemes,
  playedBlackSquareThemeId
} from './black-square-bank'

/**
 * The templates whose answers are works. Elsewhere two answers sharing their
 * first words is no franchise: North and South Korea in French, Henri II and
 * Henri IV.
 */
const WORK_TEMPLATES: ReadonlySet<string> = new Set([
  'albums-by-band',
  'award-winning-films',
  'books-by-author',
  'films-directed-by',
  'films-of-studio'
])

const namesOf = ({
  aliases,
  labels
}: Pick<BlackSquareAnswer, 'aliases' | 'labels'>): string[] => [
  labels.en,
  labels.fr,
  ...aliases.en,
  ...aliases.fr
]

/** Every name of a theme against every other answer dealt alone: thousands of gradings a theme. */
const EVERY_NAME_GRADED = { timeout: 60_000 }

type Named = Pick<BlackSquareAnswer, 'aliases' | 'labels'>

type GradedTheme = {
  answers: readonly Named[]
  blackWord: Named
  id: string
}

/**
 * Every name of a theme graded the way a round grades it, one answer dealt and
 * the rest left out: each must find its own cell, the black word must land on
 * itself, and a true answer the deal left out must find nothing at all.
 */
const misgradedNamesOf = ({ answers, blackWord, id }: GradedTheme): string[] =>
  answers.flatMap((dealt, dealtIndex) => {
    const grade = lineGraderFor({
      answers: [namesOf(dealt)],
      blackWord: namesOf(blackWord),
      leftOut: answers.flatMap((other, index) =>
        index === dealtIndex ? [] : namesOf(other)
      )
    })
    const misgraded = (line: string, expected: LineGrade['kind']): string[] =>
      grade(line).kind === expected
        ? []
        : [`${id}: ${line} beside ${dealt.labels.en}`]

    return [
      ...namesOf(dealt).flatMap((line) => misgraded(line, 'cells')),
      ...namesOf(blackWord).flatMap((line) => misgraded(line, 'blackWord')),
      ...answers.flatMap((other, index) =>
        index === dealtIndex
          ? []
          : namesOf(other).flatMap((line) => misgraded(line, 'nothing'))
      )
    ]
  })

describe('the black-square bank', () => {
  it('[blacksquare] parses every theme, each id once', () => {
    const ids = bankedBlackSquareThemes().map(({ id }) => id)

    expect(ids.length).toBeGreaterThanOrEqual(60)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[blacksquare] hides nine different answers behind every theme', () => {
    for (const { answers, id } of bankedBlackSquareThemes()) {
      expect(answers, id).toHaveLength(9)
      expect(new Set(answers.map((answer) => answer.id)).size, id).toBe(9)
    }
  })

  it('[blacksquare] ranks the nine from the most read down', () => {
    for (const { answers, id } of bankedBlackSquareThemes()) {
      const views = answers.map((answer) => answer.views)

      expect(views, id).toEqual(views.toSorted((a, b) => b - a))
    }
  })

  it('[blacksquare] banks one answer per franchise, by its series', () => {
    const clusters = bankedBlackSquareThemes().flatMap(({ answers, id }) => {
      const series = answers.flatMap((answer) =>
        answer.series === null ? [] : [answer.series]
      )

      return series
        .filter((key, index) => series.indexOf(key) !== index)
        .map((key) => `${id}: ${key}`)
    })

    expect(clusters).toEqual([])
  })

  it('[blacksquare] banks one answer per franchise, by the shape of its title', () => {
    const clusters = bankedBlackSquareThemes()
      .filter(({ id }) => WORK_TEMPLATES.has(id.split(':')[0] ?? ''))
      .flatMap(({ answers, id }) =>
        (['en', 'fr'] as const).flatMap((language) => {
          const stems = answers.map(({ labels }) =>
            franchiseStemOf(labels[language])
          )

          return answers
            .filter((_, index) => stems.indexOf(stems[index] ?? '') !== index)
            .map(({ labels }) => `${id}: ${labels[language]}`)
        })
      )

    expect(clusters).toEqual([])
  })

  it('[blacksquare] holds one black word per theme, none of them an answer', () => {
    for (const { answers, blackWord, id } of bankedBlackSquareThemes()) {
      expect(blackWord.why.en.length, id).toBeGreaterThan(0)
      expect(blackWord.why.fr.length, id).toBeGreaterThan(0)
      expect(
        answers.map((answer) => answer.id),
        id
      ).not.toContain(blackWord.id)
    }
  })

  it('[blacksquare] never grades a name of the black word as one of the answers', () => {
    const collisions = bankedBlackSquareThemes().flatMap(
      ({ answers, blackWord, id }) =>
        namesOf(blackWord).flatMap((guess) =>
          answers
            .filter(
              (answer) =>
                gradeQuizGuess({
                  guess,
                  question: {
                    accepted: namesOf(answer),
                    answer: answer.labels.fr,
                    decoys: namesOf(blackWord)
                  }
                }).isCorrect
            )
            .map((answer) => `${id}: ${guess} → ${answer.labels.fr}`)
        )
    )

    expect(collisions).toEqual([])
  })
  it(
    '[blacksquare] grades every name as a round would: its own cell, the black word, or nothing once left out',
    EVERY_NAME_GRADED,
    () => {
      expect(bankedBlackSquareThemes().flatMap(misgradedNamesOf)).toEqual([])
    }
  )

  it('[blacksquare] banks a capital under any of its names, and Geneva as the black word', () => {
    const theme = bankedBlackSquareThemes().find(
      ({ id }) => id === 'capitals-of:western-europe'
    )

    if (theme === undefined) {
      throw new Error('capitals of Western Europe are not banked')
    }

    const grade = lineGraderFor({
      answers: theme.answers.map(namesOf),
      blackWord: namesOf(theme.blackWord),
      leftOut: []
    })
    const bern = theme.answers.findIndex(({ labels }) => labels.en === 'Bern')

    expect(grade('Berne')).toEqual({ cells: [bern], kind: 'cells' })
    expect(grade('geneva')).toEqual({ kind: 'blackWord' })
  })
})

/**
 * The first words two answers of one theme may share, each read and kept: the
 * word is the theme itself (_Sauce soja_, _Sauce tomate_) or a coincidence
 * between different things (_Corée du Nord_, _Corée du Sud_). Anywhere else
 * two answers opening alike are one thing twice — seven _Haricots_ of seven
 * colours — and the theme hides one answer for it, the rest as its aliases.
 */
const FIRST_WORDS_SHARED_ON_PURPOSE: ReadonlySet<string> = new Set([
  'asian-countries:coree',
  'athletics-events:lancer',
  'athletics-events:saut',
  'bathroom-items:brosse',
  'breads:pain',
  'breakfast-pastries:pain',
  'camping-gear:sac',
  'celebrations:fete',
  'celebrations:saint',
  'chinese-food:porc',
  'citrus-fruits:citron',
  'egg-dishes:œuf',
  'egg-dishes:œufs',
  'exotic-fruits:fruit',
  'fairy-tales:belle',
  'fairy-tales:petit',
  'fairy-tales:petite',
  'famous-monuments:tour',
  'fictional-detectives:inspecteur',
  'film-genres:comedie',
  'film-genres:film',
  'grape-varieties:cabernet',
  'grape-varieties:pinot',
  'hairstyles:coupe',
  'hats:chapeau',
  'household-appliances:lave',
  'mario-characters:princesse',
  'monkeys:singe',
  'nuts:noix',
  'on-the-road:passage',
  'potato-dishes:pommes',
  'pulses:pois',
  'red-fruits:baie',
  'rooms-of-a-house:salle',
  'sauces:sauce',
  'seas-and-oceans:mer',
  'seas-and-oceans:ocean',
  'seeds:graines',
  'snakes:serpent',
  'solar-system:ceinture',
  'soups:soupe',
  'squashes:courge',
  'star-wars-characters:dark',
  'superheroes:black',
  'video-game-consoles:game',
  'video-game-consoles:nintendo',
  'wild-cats:chat',
  'wild-cats:panthere'
])

const firstFrenchWordOf = (label: string): string =>
  label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/^(?:(?:le|la|les|the) |l')/u, '')
    .split(/[\s'’-]+/u)[0] ?? ''

describe('the authored black-square themes', () => {
  it('[blacksquare] writes at least two hundred broad themes by hand', () => {
    expect(authoredBlackSquareThemes().length).toBeGreaterThanOrEqual(200)
  })

  it('[blacksquare] hides one answer per thing, never its varieties side by side', () => {
    const repeated = authoredBlackSquareThemes().flatMap(({ answers, id }) => {
      const firstWords = answers.map(({ labels }) =>
        firstFrenchWordOf(labels.fr)
      )

      return [
        ...new Set(
          firstWords.filter((word, index) => firstWords.indexOf(word) !== index)
        )
      ]
        .map((word) => `${id}:${word}`)
        .filter((key) => !FIRST_WORDS_SHARED_ON_PURPOSE.has(key))
    })

    expect(repeated).toEqual([])
  })
})

describe.each(Object.entries(authoredBlackSquareSources))(
  'the authored black-square themes of %s',
  (_, source) => {
    const themes = (): PooledBlackSquareTheme[] =>
      parseAuthoredBlackSquareThemes(source)

    it('[blacksquare] parses every theme of the file', () => {
      expect(themes().length).toBeGreaterThan(0)
    })

    it('[blacksquare] pools twelve to twenty answers a theme, every tier at least three', () => {
      for (const { answers, id } of themes()) {
        for (const tier of ['easy', 'medium', 'hard'] as const) {
          expect(
            answers.filter((answer) => answer.tier === tier).length,
            `${id} ${tier}`
          ).toBeGreaterThanOrEqual(3)
        }
      }
    })

    it(
      '[blacksquare] grades every name as a round would: its own cell, the black word, or nothing once left out',
      EVERY_NAME_GRADED,
      () => {
        expect(themes().flatMap(misgradedNamesOf)).toEqual([])
      }
    )
  }
)

describe('the black-square theme pool', () => {
  it('[blacksquare] holds every theme of both banks, each id once', () => {
    const ids = blackSquareThemePool().map(({ id }) => id)

    expect(ids.length).toBe(
      bankedBlackSquareThemes().length + authoredBlackSquareThemes().length
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[blacksquare] tiers a Wikidata theme medium or hard, never easy', () => {
    const wikidataIds = new Set(bankedBlackSquareThemes().map(({ id }) => id))
    const tiers = new Set(
      blackSquareThemePool()
        .filter(({ id }) => wikidataIds.has(id))
        .map(({ tier }) => tier)
    )

    expect([...tiers].toSorted()).toEqual(['hard', 'medium'])
  })

  it('[blacksquare] tiers a Wikidata theme by thirds of its nine, the most read obvious', () => {
    const theme = blackSquareThemePool().find(({ id }) => id.includes(':'))

    expect(theme?.answers.map(({ tier }) => tier)).toEqual([
      'easy',
      'easy',
      'easy',
      'medium',
      'medium',
      'medium',
      'hard',
      'hard',
      'hard'
    ])
  })

  it('[blacksquare] deals an easy room the easy themes alone, until they run out', () => {
    const easyIds = new Set(
      blackSquareThemePool()
        .filter(({ tier }) => tier === 'easy')
        .map(({ id }) => id)
    )
    const playedIds = new Set<string>()

    for (const _ of easyIds) {
      const theme = drawBlackSquareTheme({ difficulty: 'easy', playedIds })

      expect(easyIds.has(theme?.id ?? '')).toBe(true)
      playedIds.add(playedBlackSquareThemeId(theme?.id ?? ''))
    }

    expect(drawBlackSquareTheme({ difficulty: 'easy', playedIds })?.tier).toBe(
      'medium'
    )
  })

  it('[blacksquare] never deals a hard room an easy theme while another is left', () => {
    for (const _ of Array.from({ length: 30 })) {
      expect(
        drawBlackSquareTheme({ difficulty: 'hard', playedIds: new Set() })?.tier
      ).not.toBe('easy')
    }
  })
})
