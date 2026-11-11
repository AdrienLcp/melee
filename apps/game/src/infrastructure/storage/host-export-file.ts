import { z } from 'zod'

import type { OwnLinesGame } from '@melee/protocol/deck'

import type { SavedEvening } from '@melee/core/room/saved-evening'

import { type OwnLine, ownLineSchemaOf } from './own-lines-storage'
import { savedEveningsSchema } from './preferences-storage'
import { parseStoredWithSchema } from './read-stored-with-schema'

/** What a host carries from one machine to another. */
export type HostExport = {
  challengeLines: readonly OwnLine[]
  mostlikelyLines: readonly OwnLine[]
  savedEvenings: readonly SavedEvening[]
}

const HOST_EXPORT_KIND = 'melee-host-export'

const ownLinesSchemaOf = (game: OwnLinesGame) =>
  z
    .array(z.unknown())
    .transform((stored) =>
      stored.flatMap((line) => {
        const read = ownLineSchemaOf(game).safeParse(line)

        return read.success ? [read.data] : []
      })
    )
    .catch([])

const hostExportSchema = z.object({
  challengeLines: ownLinesSchemaOf('challenge'),
  kind: z.literal(HOST_EXPORT_KIND),
  mostlikelyLines: ownLinesSchemaOf('mostlikely').default([]),
  savedEvenings: savedEveningsSchema.catch([])
})

/** The file's text: the same shapes the stores write, under a kind that names it. */
export const hostExportText = ({
  challengeLines,
  mostlikelyLines,
  savedEvenings
}: HostExport): string =>
  JSON.stringify(
    {
      challengeLines,
      kind: HOST_EXPORT_KIND,
      mostlikelyLines,
      savedEvenings,
      version: 1
    },
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
