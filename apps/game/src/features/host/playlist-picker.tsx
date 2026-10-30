import type React from 'react'
import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'

import type { BlindtestSettings } from '@melee/protocol/game'
import {
  type TrackDecade,
  type TrackSource,
  trackDecades
} from '@melee/protocol/track'

import { Button } from '@/presentation/components/button'
import { TextField } from '@/presentation/components/text-field'
import { ToggleGroup } from '@/presentation/components/toggle-group'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  asDecade,
  asGenreId,
  decadeLabelKey,
  GENRE_IDS,
  type GenreId,
  genreLabelKey
} from '@/presentation/i18n/track-labels'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { usePlaylistPreview } from './use-playlist-preview'

import './playlist-picker.sass'

type SourceKind = TrackSource['kind']

/** The kinds the strip offers; `all` is the strip with none of them pressed. */
type ChosenKind = Exclude<SourceKind, 'all'>

const KIND_LABELS: Record<ChosenKind, PlainTranslationKey> = {
  chart: 'blindtest.source.chart',
  decade: 'blindtest.source.decade',
  film: 'blindtest.source.film',
  playlist: 'blindtest.source.playlist',
  search: 'blindtest.source.search'
}

const isChosenKind = (value: string | number): value is ChosenKind =>
  typeof value === 'string' && value in KIND_LABELS

export const sourceKindKey = (kind: SourceKind): PlainTranslationKey =>
  kind === 'all' ? 'blindtest.source.all' : KIND_LABELS[kind]

/**
 * What the source kinds that hold a choice need, all at once, so switching kind
 * keeps what was typed. The composers hold none, which is why they are a kind
 * with no field here.
 */
type Draft = {
  decades: TrackDecade[]
  genreIds: GenreId[]
  kind: SourceKind
  playlistId: string
  query: string
}

/**
 * The room's settings are the truth on mount, so the picker opens on the source
 * the room is actually running — genres chosen before a `play again` are still
 * the selected ones when the lobby comes back.
 */
const draftFromSource = (source: TrackSource): Draft => ({
  decades: source.kind === 'decade' ? source.decades : [],
  genreIds:
    source.kind === 'chart'
      ? source.genreIds.map(asGenreId).filter((id) => id !== undefined)
      : [],
  kind: source.kind,
  playlistId: source.kind === 'playlist' ? source.playlistId : '',
  query: source.kind === 'search' ? source.query : ''
})

/** `null` while the chosen kind is still missing the text it needs. */
const sourceFromDraft = ({
  decades,
  genreIds,
  kind,
  playlistId,
  query
}: Draft): TrackSource | null => {
  switch (kind) {
    case 'all':
      return { kind: 'all' }
    case 'chart':
      return { genreIds, kind: 'chart' }
    case 'decade':
      return { decades, kind: 'decade' }
    case 'film':
      return { kind: 'film' }
    case 'playlist':
      return playlistId.trim().length === 0
        ? null
        : { kind: 'playlist', playlistId: playlistId.trim() }
    case 'search':
      return query.trim().length === 0
        ? null
        : { kind: 'search', query: query.trim() }
  }
}

type PlaylistPickerProps = {
  /** Called on every edit. Must be stable — it is an effect dependency. */
  onDraftChange: (source: TrackSource | null) => void
  settings: BlindtestSettings
}

/**
 * A blind test with the wrong decade is a wasted evening, so the pool is chosen
 * rather than discovered on the first round.
 *
 * Nothing here commits: whatever opens the next round is what sends the source,
 * because a choice that has to be confirmed and *then* launched is two
 * decisions where the host only made one. That is also what lets the picker
 * stay reachable while a game runs — a source edited mid-clip cannot touch the
 * round already drawn. The preview is the exception, and it only looks: a
 * source with no visible answer is a guess. Which press asks for it differs by
 * kind — a decade answers on its own, where a query or an id waits for a button
 * because neither is finished until the typing stops.
 */
export const PlaylistPicker: React.FC<PlaylistPickerProps> = ({
  onDraftChange,
  settings
}) => {
  const translate = useTranslate()
  const [draft, setDraft] = useState<Draft>(() =>
    draftFromSource(settings.source)
  )
  const { clear, preview, previewSource } = usePlaylistPreview(
    settings.difficulty
  )
  const draftSource = sourceFromDraft(draft)

  // The control that commits this draft is the one that starts the game, and it
  // lives in the console's footer rather than here.
  useEffect(() => {
    onDraftChange(sourceFromDraft(draft))
  }, [draft, onDraftChange])

  const revise = (patch: Partial<Draft>): void => {
    setDraft({ ...draft, ...patch })
    clear()
  }

  // A decade names itself and says nothing about what is inside it, so it is
  // the one source that answers for itself the moment it is pressed. An id or a
  // query cannot: neither is finished until the host stops typing.
  const chooseDecades = (decades: TrackDecade[]): void => {
    setDraft({ ...draft, decades })

    void previewSource({ decades, kind: 'decade' })
  }

  // The composers answer for themselves the same way a decade does, and with
  // nothing left to press afterwards they have to: the arm carries no control,
  // so choosing it is the only moment there is to ask on.
  const chooseKind = (kind: SourceKind): void => {
    revise({ kind })

    if (kind === 'film') {
      void previewSource({ kind: 'film' })
    }
  }

  return (
    <section className='playlist-picker'>
      <div className='sources'>
        <ToggleGroup
          className='track-source'
          label={translate('blindtest.source.label')}
          onSelectionChange={(keys) => {
            chooseKind([...keys].find(isChosenKind) ?? 'all')
          }}
          options={Object.entries(KIND_LABELS).map(([value, key]) => ({
            label: translate(key),
            value
          }))}
          selectedKeys={draft.kind === 'all' ? [] : [draft.kind]}
          selectionMode='single'
        />
        {draft.kind === 'all' && (
          <p className='hint'>{translate('blindtest.source.none')}</p>
        )}
      </div>

      {draft.kind === 'chart' && (
        <div className='genres'>
          <ToggleGroup
            label={translate('blindtest.genre.label')}
            onSelectionChange={(keys) => {
              revise({
                genreIds: [...keys]
                  .map(asGenreId)
                  .filter((id) => id !== undefined)
              })
            }}
            options={GENRE_IDS.map((id) => ({
              label: translate(genreLabelKey(id)),
              value: String(id)
            }))}
            selectedKeys={draft.genreIds.map(String)}
          />
          {draft.genreIds.length === 0 && (
            <p className='hint'>{translate('blindtest.genre.none')}</p>
          )}
        </div>
      )}

      {draft.kind === 'decade' && (
        <div className='decades'>
          <ToggleGroup
            label={translate('blindtest.decade.label')}
            onSelectionChange={(keys) => {
              chooseDecades(
                [...keys].map(asDecade).filter((decade) => decade !== undefined)
              )
            }}
            options={trackDecades.map((decade) => ({
              label: translate(decadeLabelKey(decade)),
              value: decade
            }))}
            selectedKeys={draft.decades}
          />
          {draft.decades.length === 0 && (
            <p className='hint'>{translate('blindtest.decade.none')}</p>
          )}
        </div>
      )}

      {draft.kind === 'film' && (
        <p className='hint'>{translate('blindtest.source.filmHint')}</p>
      )}

      {(draft.kind === 'playlist' || draft.kind === 'search') && (
        <Form
          onSubmit={(event) => {
            event.preventDefault()

            if (
              draftSource !== null &&
              draftSource.kind !== 'all' &&
              draftSource.kind !== 'chart'
            ) {
              void previewSource(draftSource)
            }
          }}
        >
          {draft.kind === 'search' ? (
            <>
              <TextField
                label={translate('blindtest.source.query')}
                onChange={(query) => {
                  revise({ query })
                }}
                value={draft.query}
              />
              {/* What is typed here leaves the site, so the field names
                  where it goes, as the playlist's hint already does. */}
              <p className='hint'>{translate('blindtest.source.queryHint')}</p>
            </>
          ) : (
            <>
              <TextField
                label={translate('blindtest.source.playlistId')}
                onChange={(playlistId) => {
                  revise({ playlistId })
                }}
                value={draft.playlistId}
              />
              <p className='hint'>
                {translate('blindtest.source.playlistIdHint')}
              </p>
            </>
          )}
          <Button
            isDisabled={draftSource === null}
            isPending={preview.status === 'previewing'}
            type='submit'
            variant='underlined'
          >
            {translate('blindtest.source.preview')}
          </Button>
        </Form>
      )}

      {preview.status === 'failed' && (
        <p className='error' role='alert'>
          {translate(preview.error)}
        </p>
      )}

      {preview.status === 'found' && (
        <p className='ready'>
          {translate('blindtest.source.ready', {
            count: preview.count
          })}
        </p>
      )}
    </section>
  )
}
