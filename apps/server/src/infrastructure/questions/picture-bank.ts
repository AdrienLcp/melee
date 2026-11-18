import { z } from 'zod'

import {
  type EstimatePhoto,
  estimatePhotoSchema
} from '@melee/protocol/estimate'

import pictureBank from './picture-bank.json' with { type: 'json' }

const pictureBankSchema = z.array(
  estimatePhotoSchema.extend({ entity: z.string().min(1) })
)

let photos: ReadonlyMap<string, EstimatePhoto> | undefined

/**
 * The photograph `scripts/build-picture-bank.ts` kept for a row of the
 * quantity or the price bank, or `null` when no free file showed it.
 */
export const photoOf = (entity: string): EstimatePhoto | null => {
  photos ??= new Map(
    pictureBankSchema
      .parse(pictureBank)
      .map(({ entity, ...photo }) => [entity, photo])
  )

  return photos.get(entity) ?? null
}
