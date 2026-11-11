import type React from 'react'
import { useState } from 'react'
import { FileTrigger } from 'react-aria-components'

import { withOwnLinesImported } from '@melee/core/challenge/own-lines-import'
import type { SavedEvening } from '@melee/core/room/saved-evening'

import { readFileText, saveTextFile } from '@/infrastructure/browser'
import {
  hostExportText,
  parseHostExport
} from '@/infrastructure/storage/host-export-file'
import { OWN_LINES_MAX } from '@/infrastructure/storage/own-lines-storage'
import { Button } from '@/presentation/components/button'
import { ExportIcon, ImportIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { setOwnLines, useOwnLines } from './use-own-lines'

type ImportOutcome =
  | { evenings: number; lines: number; status: 'imported' }
  | { status: 'idle' }
  | { status: 'refused' }

type SavedEveningsTransferProps = {
  evenings: readonly SavedEvening[]
  /** Folds the evenings a file carried in among the kept ones. */
  onImport: (evenings: readonly SavedEvening[]) => void
}

/**
 * Carries what this host spent effort on — the kept line-ups and the lines
 * they wrote ahead — to another machine as one file, and folds such a file in
 * here without losing anything already kept.
 */
export const SavedEveningsTransfer: React.FC<SavedEveningsTransferProps> = ({
  evenings,
  onImport
}) => {
  const translate = useTranslate()
  const challengeLines = useOwnLines('challenge')
  const mostlikelyLines = useOwnLines('mostlikely')
  const [outcome, setOutcome] = useState<ImportOutcome>({ status: 'idle' })

  const importFile = async (file: File) => {
    const text = await readFileText(file)
    const read = text.status === 'success' ? parseHostExport(text.data) : text

    if (read.status === 'failure') {
      setOutcome({ status: 'refused' })

      return
    }

    const challenge = withOwnLinesImported({
      imported: read.data.challengeLines,
      lines: challengeLines,
      max: OWN_LINES_MAX
    })
    const mostlikely = withOwnLinesImported({
      imported: read.data.mostlikelyLines,
      lines: mostlikelyLines,
      max: OWN_LINES_MAX
    })

    onImport(read.data.savedEvenings)
    setOwnLines({ game: 'challenge', lines: challenge })
    setOwnLines({ game: 'mostlikely', lines: mostlikely })
    setOutcome({
      evenings: read.data.savedEvenings.length,
      lines:
        challenge.length +
        mostlikely.length -
        challengeLines.length -
        mostlikelyLines.length,
      status: 'imported'
    })
  }

  return (
    <div className='transfer'>
      <p className='hint'>{translate('host.saved.transferHint')}</p>
      <div className='presses'>
        <Button
          isDisabled={
            evenings.length === 0 &&
            challengeLines.length === 0 &&
            mostlikelyLines.length === 0
          }
          onPress={() => {
            saveTextFile({
              name: translate('host.saved.exportFileName'),
              text: hostExportText({
                challengeLines,
                mostlikelyLines,
                savedEvenings: evenings
              })
            })
          }}
          variant='outlined'
        >
          <ExportIcon />
          {translate('host.saved.export')}
        </Button>
        <FileTrigger
          acceptedFileTypes={['application/json', '.json']}
          onSelect={(files) => {
            const file = files?.[0]

            if (file !== undefined) {
              void importFile(file)
            }
          }}
        >
          <Button variant='outlined'>
            <ImportIcon />
            {translate('host.saved.import')}
          </Button>
        </FileTrigger>
      </div>
      <p className='outcome' role='status'>
        {outcome.status === 'imported' &&
          translate('host.saved.imported', {
            evenings: outcome.evenings,
            lines: outcome.lines
          })}
        {outcome.status === 'refused' && translate('host.saved.importRefused')}
      </p>
    </div>
  )
}
