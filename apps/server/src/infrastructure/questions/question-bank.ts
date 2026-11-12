import { z } from 'zod'

import type { Difficulty } from '@melee/protocol/difficulty'
import {
  flagFileSchema,
  type HostQuestion,
  hostQuestionSchema,
  type QuestionCategory,
  type QuestionDrawSettings,
  type QuestionLanguage,
  questionCategorySchema,
  questionLanguageSchema,
  silhouetteFileSchema
} from '@melee/protocol/question'

import { pickRandom } from '@melee/core/helpers/random'
import {
  type ContentTier,
  contentTiers,
  dealByDifficulty,
  drawByDifficulty
} from '@melee/core/round/difficulty-draw'

import {
  asksACapitalTheRubricAsks,
  bankedCapitalQuestions
} from './capital-questions'
import { bankedFlagQuestions } from './flag-questions'
import bank from './question-bank.json' with { type: 'json' }
import { bankedRebusQuestions } from './rebus-questions'
import { bankedSilhouetteQuestions } from './silhouette-questions'

/**
 * The one module that knows where the questions came from. Everything above it
 * speaks `HostQuestion`, so moving to another bank — a second language, a
 * curated file, an API somebody finally publishes — is a rewrite of this file
 * and of nothing else.
 *
 * The bank is a bundled asset rather than a network call, and that is a
 * property worth keeping: a quiz whose data weighs less than a photograph has
 * no business going down because somebody else's web server did, in the middle
 * of a party.
 */
const bankedQuestionSchema = hostQuestionSchema.extend({
  category: questionCategorySchema,
  /**
   * Whether the prompt is only a question with its own three decoys under it.
   * *Which country drives on the left side of the road?* answers Japan, and so
   * does India: the sentence names no set, so only the four on screen do. Drawn
   * for a room that will show them and nowhere else — see `drawQuestion`.
   */
  choiceOnly: z.boolean(),
  /**
   * The decoys an `easy` room is shown instead, from other continents — a
   * child picks Japan's flag beside Brazil's, not beside Bangladesh's. Only a
   * country rubric carries them: a near miss is the game everywhere else.
   */
  easyDecoys: z
    .tuple([z.string(), z.string(), z.string()])
    .nullable()
    .default(null),
  /** Absent from the bank's own rows, which are all text: only `flag-questions.ts` deals a flag. */
  flag: flagFileSchema.nullable().default(null),
  /**
   * Drawn only for a room that is not `isFamilyFriendly`. A rating beside the
   * category rather than one more category: a question about a porn actress's
   * first album is a celebrities question that happens to be adult, and folding
   * the two axes into one row is what makes such a control read as a mistake.
   */
  isAdult: z.boolean(),
  /**
   * Whether the room can be expected to have heard of what this asks about.
   * The two halves reach it their own way — Open Trivia DB rates its own rows,
   * and a French row is read off the traffic its subject's Wikipedia article
   * takes — and the field says only what the room is promised.
   */
  isWellKnown: z.boolean(),
  language: questionLanguageSchema,
  /** Absent from the bank's own rows too: only `rebus-questions.ts` deals one. */
  rebus: z.string().nullable().default(null),
  /** Absent from the bank's own rows too: only `silhouette-questions.ts` deals one. */
  silhouette: silhouetteFileSchema.nullable().default(null),
  /** The upstream pack, so a question that turns out to be wrong is traceable. */
  theme: z.string(),
  /**
   * How hard the rubric that built the row ranks it. Absent from the bank's
   * own rows, which carry `isWellKnown` and nothing finer.
   */
  tier: z.enum(contentTiers).nullable().default(null)
})

/**
 * Parsed once, on the first draw rather than at boot. Every cold start of a
 * Durable Object evaluates this module, and most rooms are not a quiz: parsing
 * 5.6 MB of rows there held each first request for seconds. A bank that no
 * longer matches the schema is still caught before a deploy, by the corpus
 * sweep in `question-bank.test.ts`, which reads the rows through this same
 * parse.
 *
 * The parse rather than the JSON's own type: the type TypeScript infers from
 * the literal degraded the day the English half started carrying `accepted`
 * spellings, and a `decoys` silently widening to `any` takes the sweep's
 * guarantees with it.
 */
let parsedBank: BankedQuestion[] | undefined

export const bankedQuestions = (): BankedQuestion[] => {
  parsedBank ??= [
    ...z
      .array(bankedQuestionSchema)
      .parse(bank.questions)
      .filter((question) => !asksACapitalTheRubricAsks(question)),
    ...bankedFlagQuestions(),
    ...bankedCapitalQuestions(),
    ...bankedRebusQuestions(),
    ...bankedSilhouetteQuestions()
  ]

  return parsedBank
}

/**
 * A row as the bank holds it, which is more than a round needs: the rating that
 * decides whether it may be drawn, and the pack it came from. Neither belongs
 * to the game, so `hostQuestionOf` names the fields that do rather than
 * spreading the row into a round.
 */
export type BankedQuestion = z.infer<typeof bankedQuestionSchema>

/**
 * Split once, with the parse, because a room only ever draws from one language
 * and, at `mixed`, from one category: the two banks are separate downloads from
 * separate sources, and scanning every row on every draw to keep one category
 * of them cost a test of twelve hundred draws its timeout on a loaded machine.
 */
let questionsByLanguage:
  | Map<string, Map<QuestionCategory, BankedQuestion[]>>
  | undefined

const categoriesIn = (
  language: QuestionLanguage
): Map<QuestionCategory, BankedQuestion[]> => {
  questionsByLanguage ??= new Map(
    [...Map.groupBy(bankedQuestions(), (question) => question.language)].map(
      ([rowsLanguage, rows]) => [
        rowsLanguage,
        Map.groupBy(rows, (question) => question.category)
      ]
    )
  )

  return questionsByLanguage.get(language) ?? new Map()
}

/** The round's question, with the softer decoys when the room plays `easy` and the row has them. */
export const hostQuestionOf = ({
  difficulty,
  question: {
    accepted,
    answer,
    category,
    decoys,
    easyDecoys,
    flag,
    id,
    note,
    prompt,
    rebus,
    silhouette
  }
}: {
  difficulty: Difficulty
  question: BankedQuestion
}): HostQuestion => ({
  accepted,
  answer,
  category,
  decoys: difficulty === 'easy' && easyDecoys !== null ? easyDecoys : decoys,
  flag,
  id,
  note,
  prompt,
  rebus,
  silhouette
})

/**
 * A rubric's row carries its tier. The bank's own carry a verdict, not a
 * ladder — heard of or not — so they hold no medium tier, and `mixed` deals
 * their two halves in equal shares.
 */
const tierOfQuestion = ({ isWellKnown, tier }: BankedQuestion): ContentTier =>
  tier ?? (isWellKnown ? 'easy' : 'hard')

/**
 * One question the room has not had yet. `playedIds` is the room's memory
 * rather than this module's: two rooms playing at once must be able to draw the
 * same question, and a bank that remembered would leak one party into another.
 *
 * An empty `categories` means every category, the same way an empty genre list
 * does for the blind test.
 *
 * **The category is drawn first, then a question inside it**, which is what
 * makes "every subject" a mix rather than a reflection of how lopsided a bank
 * happens to be. Drawing uniformly over questions gave an English room a video
 * game once every five rounds and a history question once every twenty, because
 * `arts` is 55% of that bank and `history` 10%. It self-corrects as an evening
 * runs: a category whose questions have all been played holds nothing eligible
 * any more, so it stops being offered.
 *
 * `isUsable` is how a game asks for a shape of question rather than a subject.
 * A `choiceOnly` row wants its own decoys on screen, which is true of a quiz in
 * `choice` mode and of nothing else: typed mode has a text field.
 *
 * **At `easy` and `hard` the level's tier is drawn before the category**
 * (`dealByDifficulty`), so `easy` deals a question a room has heard of
 * whenever any ticked subject still holds one. **At `mixed` the category comes
 * first and the tier inside it**: only the country rubrics and the rebus hold
 * a `medium` tier, and a tier drawn first sent a third of every evening to
 * those four subjects of thirteen.
 *
 * `previousCategory` is the round just played, and is not drawn again while
 * another category is left: an independent draw dealt two flags in a row one
 * round in three over three rubrics, and a table reads that as a broken mix.
 */
export const drawQuestion = ({
  isFamilyFriendly,
  isUsable,
  playedIds,
  previousCategory = null,
  settings
}: {
  /** The room's own setting: no adult-rated row is drawn while it holds. */
  isFamilyFriendly: boolean
  isUsable: (question: BankedQuestion) => boolean
  playedIds: ReadonlySet<string>
  previousCategory?: QuestionCategory | null
  settings: QuestionDrawSettings
}): BankedQuestion | null => {
  const isEligible = (question: BankedQuestion): boolean =>
    !playedIds.has(question.id) &&
    !(isFamilyFriendly && question.isAdult) &&
    isUsable(question)
  const ticked = [...categoriesIn(settings.language)].filter(
    ([category]) =>
      settings.categories.length === 0 || settings.categories.includes(category)
  )

  const categoryToDeal = (
    canBeDealt: (question: BankedQuestion) => boolean
  ): BankedQuestion[] => {
    const stocked = ticked.filter(([, rows]) => rows.some(canBeDealt))
    const fresh =
      previousCategory !== null && stocked.length > 1
        ? stocked.filter(([category]) => category !== previousCategory)
        : stocked
    const [, rows] = pickRandom(fresh) ?? [null, []]

    return rows.filter(canBeDealt)
  }

  if (settings.difficulty === 'mixed') {
    return drawByDifficulty({
      difficulty: 'mixed',
      pool: categoryToDeal(isEligible),
      tierOf: tierOfQuestion
    })
  }

  return dealByDifficulty({
    deal: (share) => {
      const inShare = new Set(share)

      return pickRandom(categoryToDeal((question) => inShare.has(question)))
    },
    difficulty: settings.difficulty,
    pool: ticked.flatMap(([, rows]) => rows.filter(isEligible)),
    tierOf: tierOfQuestion
  })
}
