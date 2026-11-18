import type React from 'react'

import type { PairPicture as Picture } from '@melee/protocol/higher-lower'

import { CountrySilhouette } from './country-silhouette'
import { EstimatePhoto } from './estimate-photo'

type PairPictureProps = {
  picture: Picture
}

/**
 * What one side of a pair is printed with, its name always beside it. The
 * caller sizes it through `--prompt-picture-height`, as on the estimate's card.
 */
export const PairPicture: React.FC<PairPictureProps> = ({ picture }) =>
  picture.kind === 'photo' ? (
    <EstimatePhoto photo={picture} />
  ) : (
    <CountrySilhouette file={picture.file} isNamedBeside />
  )
