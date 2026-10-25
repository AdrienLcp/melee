import { z } from 'zod'

import type { SavedEvening } from '@melee/core/room/saved-evening'

import {
  type OwnChallengeLine,
  ownChallengeLineSchema
} from './own-challenge-lines-storage'
import { savedEveningsSchema } from './preferences-storage'
import { parseStoredWithSchema } from './read-stored-with-schema'

/** What a host carries from one machine to another. */
export type HostExport = {
  challengeLines: readonly OwnChallengeLine[]
  savedEvenings: readonly SavedEvening[]
}

const HOST_EXPORT_KIND = 'melee-host-export'

const challengeLinesSchema = z.array(z.unknown()).transform((stored) =>
  stored.flatMap((line) => {
    const read = ownChallengeLineSchema.safeParse(line)

    return read.success ? [read.data] : []
  })
)

const hostExportSchema = z.object({
  challengeLines: challengeLinesSchema.catch([]),
  kind: z.literal(HOST_EXPORT_KIND),
  savedEvenings: savedEveningsSchema.catch([])
})

/** The file's text: the same shapes the stores write, under a kind that names it. */
export const hostExportText = ({
  challengeLines,
  savedEvenings
}: HostExport): string =>
  JSON.stringify(
    { challengeLines, kind: HOST_EXPORT_KIND, savedEvenings, version: 1 },
    null,
    2
  )

/**
 * A file read back entry by entry, the way the stores read themselves: what
 * this build cannot read costs that entry alone, and a file that is not an
 * export at all is `unrecognized`.
 */
export const parseHostExport = (text: string) =>
  parseStoredWithSchema<HostExport>({ schema: hostExportSchema, text })
