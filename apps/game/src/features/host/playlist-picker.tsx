import type React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Form } from 'react-aria-components'

import type { BlindtestSettings } from '@melee/protocol/game'
import {
  EVERY_STRAND,
  type TrackDecade,
  type TrackSource,
  trackDecades
} from '@melee/protocol/track'

import { Button } from '@/presentation/components/button'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { TextField } from '@/presentation/components/text-field'
import { ToggleGroup } from '@/presentation/components/toggle-group'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  asDecade,
  asGenreId,
  CATALOGUE_STRANDS,
  type CatalogueStrand,
  decadeLabelKey,
  GENRE_IDS,
  type GenreId,
  genreLabelKey,
  STRAND_LABEL_KEYS,
  strandsOf
} from '@/presentation/i18n/track-labels'
import type {
  PlainTranslationKey,
  Translate
} from '@/presentation/i18n/translation'

import { useArrivedLater } from './use-arrived-later'
import { usePlaylistPreview } from './use-playlist-preview'

import './playlist-picker.sass'

/** Where the tracks come from: the curated catalogue, or a list the host names. */
type Place = TrackSource['kind']

const PLACE_LABELS: Record<Place, PlainTranslationKey> = {
  catalogue: 'blindtest.source.catalogue',
  playlist: 'blindtest.source.playlist',
  search: 'blindtest.source.search'
}

const isPlace = (value: string | number): value is Place =>
  typeof value === 'string' && value in PLACE_LABELS

/**
 * What the closed setup says of a source: a list the host named by its kind,
 * a catalogue by the strands it mixes.
 */
export const sourceSummary = ({
  source,
  translate
}: {
  source: TrackSource
  translate: Translate
}): string => {
  if (source.kind !== 'catalogue') {
    return translate(PLACE_LABELS[source.kind])
  }

  const strands = strandsOf(source)

  return strands.length === CATALOGUE_STRANDS.length
    ? translate('blindtest.source.wholeCatalogue')
    : strands.map((strand) => translate(STRAND_LABEL_KEYS[strand])).join(' + ')
}

/**
 * Everything every place needs, all at once, so moving between them keeps what
 * was typed, and unticking a strand keeps its picks for when it comes back.
 */
type Draft = {
  charts: GenreId[]
  decades: TrackDecade[]
  place: Place
  playlistId: string
  query: string
  strands: CatalogueStrand[]
}

/**
 * The room's settings are the truth on mount, so the picker opens on the source
 * the room is actually running — genres chosen before a `play again` are still
 * the selected ones when the lobby comes back.
 */
const draftFromSource = (source: TrackSource): Draft => {
  const catalogue = source.kind === 'catalogue' ? source : EVERY_STRAND

  return {
    charts: (catalogue.charts ?? [])
      .map(asGenreId)
      .filter((id) => id !== undefined),
    decades: catalogue.decades ?? [],
    place: source.kind,
    playlistId: source.kind === 'playlist' ? source.playlistId : '',
    query: source.kind === 'search' ? source.query : '',
    strands: strandsOf(catalogue)
  }
}

/** `null` while the chosen place is still missing what it needs. */
const sourceFromDraft = ({
  charts,
  decades,
  place,
  playlistId,
  query,
  strands
}: Draft): TrackSource | null => {
  switch (place) {
    case 'catalogue':
      return strands.length === 0
        ? null
        : {
            charts: strands.includes('charts') ? charts : null,
            decades: strands.includes('decades') ? decades : null,
            hasFilmScores: strands.includes('filmScores'),
            kind: 'catalogue'
          }
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
  /**
   * Saves a source the host finished choosing: a strand, a genre or a decade
   * as it is pressed, a playlist id or a query once its field is left or
   * submitted, never per keystroke. Called once per source that differs
   * from the last one saved, the entry's own counting as the first.
   */
  onSourceChange: (source: TrackSource) => void
  settings: BlindtestSettings
}

/**
 * A blind test with the wrong decade is a wasted evening, so the pool is chosen
 * rather than discovered on the first round.
 *
 * Two levels, because the catalogue's strands mix and a named list does not:
 * one strip holding both would untick three strands the moment a search was
 * pressed, and say nothing about it.
 *
 * Every choice is saved as it is made, like every other setting on the page,
 * and lands on the round after the one on screen. The preview only looks, at a
 * playlist id or a query alone: the catalogue's lists are curated and never
 * come back empty, and neither an id nor a query is finished until the typing
 * stops, so both wait for a press.
 */
export const PlaylistPicker: React.FC<PlaylistPickerProps> = ({
  onSourceChange,
  settings
}) => {
  const translate = useTranslate()
  const [draft, setDraft] = useState<Draft>(() =>
    draftFromSource(settings.source)
  )
  const isCatalogue = draft.place === 'catalogue'
  const drawsCharts = isCatalogue && draft.strands.includes('charts')
  const drawsDecades = isCatalogue && draft.strands.includes('decades')
  const drawsFilmScores = isCatalogue && draft.strands.includes('filmScores')
  const catalogueArrived = useArrivedLater(isCatalogue)
  const genresArrived = useArrivedLater(drawsCharts)
  const decadesArrived = useArrivedLater(drawsDecades)
  const typedSourceArrived = useArrivedLater(!isCatalogue)
  const { clear, preview, previewSource } = usePlaylistPreview(
    settings.difficulty
  )
  const draftSource = sourceFromDraft(draft)
  const lastSaved = useRef(JSON.stringify(settings.source))

  const save = (saved: Draft): void => {
    const source = sourceFromDraft(saved)
    const written = JSON.stringify(source)

    if (source !== null && written !== lastSaved.current) {
      lastSaved.current = written
      onSourceChange(source)
    }
  }

  // A press that leaves the page need not blur the field first, so whatever
  // the field holds is saved on the way out.
  const saveOnLeave = useEffectEvent(() => {
    save(draft)
  })

  useEffect(
    () => () => {
      saveOnLeave()
    },
    []
  )

  const revise = (patch: Partial<Draft>): Draft => {
    const revised = { ...draft, ...patch }

    setDraft(revised)
    clear()

    return revised
  }

  const choose = (patch: Partial<Draft>): void => {
    save(revise(patch))
  }

  return (
    <section className='playlist-picker'>
      <SegmentedControl
        className='track-place'
        label={translate('blindtest.source.label')}
        onChange={(place) => {
          if (isPlace(place)) {
            choose({ place })
          }
        }}
        options={Object.entries(PLACE_LABELS).map(([value, key]) => ({
          label: translate(key),
          value
        }))}
        value={draft.place}
      />

      {isCatalogue && (
        <div className='catalogue' data-arrived={catalogueArrived}>
          <ToggleGroup
            className='strands'
            disallowEmptySelection
            label={translate('blindtest.source.strands')}
            onSelectionChange={(keys) => {
              choose({
                strands: CATALOGUE_STRANDS.filter((strand) => keys.has(strand))
              })
            }}
            options={CATALOGUE_STRANDS.map((strand) => ({
              label: translate(STRAND_LABEL_KEYS[strand]),
              value: strand
            }))}
            selectedKeys={draft.strands}
          />

          {drawsCharts && (
            <div className='genres' data-arrived={genresArrived}>
              <ToggleGroup
                label={translate('blindtest.genre.label')}
                onSelectionChange={(keys) => {
                  choose({
                    charts: [...keys]
                      .map(asGenreId)
                      .filter((id) => id !== undefined)
                  })
                }}
                options={GENRE_IDS.map((id) => ({
                  label: translate(genreLabelKey(id)),
                  value: String(id)
                }))}
                selectedKeys={draft.charts.map(String)}
              />
              {draft.charts.length === 0 && (
                <p className='hint'>{translate('blindtest.genre.none')}</p>
              )}
            </div>
          )}

          {drawsDecades && (
            <div className='decades' data-arrived={decadesArrived}>
              <ToggleGroup
                label={translate('blindtest.decade.label')}
                onSelectionChange={(keys) => {
                  choose({
                    decades: [...keys]
                      .map(asDecade)
                      .filter((decade) => decade !== undefined)
                  })
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

          {drawsFilmScores && (
            <p className='hint'>{translate('blindtest.source.filmHint')}</p>
          )}
        </div>
      )}

      {!isCatalogue && (
        <Form
          data-arrived={typedSourceArrived}
          onSubmit={(event) => {
            event.preventDefault()
            save(draft)

            if (draftSource !== null && draftSource.kind !== 'catalogue') {
              void previewSource(draftSource)
            }
          }}
        >
          {draft.place === 'search' ? (
            <>
              <TextField
                label={translate('blindtest.source.query')}
                onBlur={() => {
                  save(draft)
                }}
                onChange={(query) => {
                  revise({ query })
                }}
                value={draft.query}
              />
              {/* What is typed here leaves the site, so the field names
                  where it goes, as the playlist's hint already does. */}
              <p className='hint' key='query'>
                {translate('blindtest.source.queryHint')}
              </p>
            </>
          ) : (
            <>
              <TextField
                label={translate('blindtest.source.playlistId')}
                onBlur={() => {
                  save(draft)
                }}
                onChange={(playlistId) => {
                  revise({ playlistId })
                }}
                value={draft.playlistId}
              />
              <p className='hint' key='playlist'>
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

      {preview.status === 'found' && !isCatalogue && (
        <p className='ready'>
          {translate('blindtest.source.ready', {
            count: preview.count
          })}
        </p>
      )}
    </section>
  )
}
