import { z } from 'zod'

import {
  type CountryCode,
  countryCodeSchema
} from '@melee/protocol/country-code'
import type { Difficulty } from '@melee/protocol/difficulty'
import {
  FIVE_CLUES_CLUE_COUNT,
  type FiveCluesLadder,
  type FiveCluesSubject
} from '@melee/protocol/five-clues'

import {
  contentTiers,
  drawByDifficulty
} from '@melee/core/round/difficulty-draw'

import animals from './five-clues-animal.json' with { type: 'json' }
import characters from './five-clues-character.json' with { type: 'json' }
import films from './five-clues-film.json' with { type: 'json' }
import landmarks from './five-clues-landmark.json' with { type: 'json' }
import people from './five-clues-person.json' with { type: 'json' }
import peopleAtHome from './five-clues-person-home.json' with { type: 'json' }
import { photoOf } from './picture-bank'

/** The subjects written by hand, every one but the country, which is composed from the other games' banks. */
export type AuthoredSubject = Exclude<FiveCluesSubject, 'country'>

const wordedSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
  pt: z.string().min(1)
})

/** Which of the three decoys a rung rules out as it opens: the first three rungs strike one each, in order. */
export const STRUCK_BY_RUNG = [0, 1, 2, null, null] as const

/** The rung a photograph may stand in for: the last, the giveaway. */
const PHOTO_RUNG = FIVE_CLUES_CLUE_COUNT - 1

const authoredClueSchema = z.object({
  photo: z.literal(true).optional(),
  strikes: z.number().int().min(0).max(2).optional(),
  text: wordedSchema
})

export const authoredRowSchema = z
  .object({
    accepted: z.object({
      en: z.array(z.string().min(1)),
      fr: z.array(z.string().min(1)),
      pt: z.array(z.string().min(1))
    }),
    clues: z.array(authoredClueSchema).length(FIVE_CLUES_CLUE_COUNT),
    decoys: z.tuple([wordedSchema, wordedSchema, wordedSchema]),
    /** The one culture that knows it, whose tables alone are dealt it; `null` for a row any table knows. */
    homeCountry: countryCodeSchema.nullable(),
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: wordedSchema,
    tier: z.enum(contentTiers),
    /** The Wikidata item whose photograph `build-picture-bank.ts` fetches, checked against `name.en` there. */
    wikidata: z
      .string()
      .regex(/^Q\d+$/)
      .nullable()
  })
  .superRefine((row, context) => {
    row.clues.forEach((clue, index) => {
      if ((clue.strikes ?? null) !== STRUCK_BY_RUNG[index]) {
        context.addIssue({
          code: 'custom',
          message: `${row.id}: clue ${index + 1} must strike decoy ${STRUCK_BY_RUNG[index]}`
        })
      }

      if (clue.photo && (index !== PHOTO_RUNG || row.wikidata === null)) {
        context.addIssue({
          code: 'custom',
          message: `${row.id}: only the last clue of a row with a Wikidata item may be a photograph`
        })
      }
    })
  })

export type AuthoredRow = z.infer<typeof authoredRowSchema>

const RAW_ROWS_BY_SUBJECT: Readonly<
  Record<AuthoredSubject, readonly unknown[]>
> = {
  animal: animals,
  character: characters,
  film: films,
  landmark: landmarks,
  person: [...people, ...peopleAtHome]
}

let rowsBySubject: Readonly<
  Record<AuthoredSubject, readonly AuthoredRow[]>
> | null = null

/** Every hand-written ladder of a subject, parsed on the first draw. */
export const authoredRowsOf = (
  subject: AuthoredSubject
): readonly AuthoredRow[] => {
  rowsBySubject ??= {
    animal: z.array(authoredRowSchema).parse(RAW_ROWS_BY_SUBJECT.animal),
    character: z.array(authoredRowSchema).parse(RAW_ROWS_BY_SUBJECT.character),
    film: z.array(authoredRowSchema).parse(RAW_ROWS_BY_SUBJECT.film),
    landmark: z.array(authoredRowSchema).parse(RAW_ROWS_BY_SUBJECT.landmark),
    person: z.array(authoredRowSchema).parse(RAW_ROWS_BY_SUBJECT.person)
  }

  return rowsBySubject[subject]
}

/** Whether a table sat in `homeCountry` is dealt `row`: everyone's rows, and its own country's beside them. */
export const isDealtAt = ({
  homeCountry,
  row
}: {
  homeCountry: CountryCode | null
  row: AuthoredRow
}): boolean => row.homeCountry === null || row.homeCountry === homeCountry

/** The id a dealt row takes in the room's no-repeat set. */
export const playedAuthoredId = ({
  row,
  subject
}: {
  row: AuthoredRow
  subject: AuthoredSubject
}): string => `fiveclues:${subject}:${row.id}`

/** The key `picture-bank.json` files a row's photograph under. */
export const authoredPictureEntity = ({
  row,
  subject
}: {
  row: AuthoredRow
  subject: AuthoredSubject
}): string => `fiveclues-${subject}-${row.id}`

/**
 * A row of the subject at the room's level, dealt at its table, that the room
 * has not climbed yet — or any such row once it has climbed them all.
 */
export const drawAuthoredRow = ({
  difficulty,
  homeCountry,
  playedIds,
  subject
}: {
  difficulty: Difficulty
  homeCountry: CountryCode | null
  playedIds: ReadonlySet<string>
  subject: AuthoredSubject
}): AuthoredRow | null => {
  const dealt = authoredRowsOf(subject).filter((row) =>
    isDealtAt({ homeCountry, row })
  )
  const unplayed = dealt.filter(
    (row) => !playedIds.has(playedAuthoredId({ row, subject }))
  )

  return drawByDifficulty({
    difficulty,
    pool: unplayed.length > 0 ? unplayed : dealt,
    tierOf: ({ tier }) => tier
  })
}

/**
 * The five rungs in every language a screen reads. The last becomes its
 * photograph where the row asks for one and the picture bank kept a file, and
 * its text is then what a screen reader says in the photograph's place.
 */
export const authoredLadderOf = ({
  row,
  subject
}: {
  row: AuthoredRow
  subject: AuthoredSubject
}): FiveCluesLadder => {
  const photo = photoOf(authoredPictureEntity({ row, subject }))

  return row.clues.map((clue) =>
    clue.photo && photo !== null
      ? { alt: { ...clue.text }, kind: 'image', photo }
      : { kind: 'text', text: { ...clue.text } }
  )
}
