import type React from 'react'

import type { WorldmapShown } from '@melee/protocol/worldmap'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { LazyWorldMap } from './lazy-world-map'

import './map-question.sass'

type MapQuestionProps = {
  /** The point a `name` round shows, which is the whole of its question. */
  shown: WorldmapShown
}

/**
 * A `name` round's question card: the map is the picture the question is
 * about, the way a flag is a quiz's, and the line under it only says what kind
 * of place to name. Built on the quiz's card, so it lays out beside four tiles
 * or over a typed field exactly as a question does.
 */
export const MapQuestion: React.FC<MapQuestionProps> = ({ shown }) => {
  const translate = useTranslate()
  const prompt = translate(`worldmap.naming.${shown.kind}`)

  return (
    <div
      className='asked-question map-question'
      style={{ '--prompt-length': prompt.length }}
    >
      <p className='prompt'>{prompt}</p>
      <LazyWorldMap
        marker={null}
        region={shown.kind === 'city' ? 'france' : 'world'}
        shown={shown}
      />
    </div>
  )
}
