import type React from 'react'
import { useState } from 'react'

import type { EstimatePhoto as Photo } from '@melee/protocol/estimate'

import './estimate-photo.sass'

type EstimatePhotoProps = {
  photo: Photo
}

/**
 * A photograph of what the question measures, printed on the card beside its
 * name, which is why a screen reader skips it. Its frame is laid out at the
 * file's ratio before the file arrives, and the picture fades in once it has,
 * so nothing moves when it lands. The caller sizes it through
 * `--prompt-picture-height`; a panorama stops at 1.6 times that wide.
 */
export const EstimatePhoto: React.FC<EstimatePhotoProps> = ({ photo }) => {
  const [loadedFile, setLoadedFile] = useState<string | null>(null)

  return (
    <span
      aria-hidden
      className='estimate-photo'
      data-loaded={loadedFile === photo.file || undefined}
      style={{ '--photo-ratio': photo.width / photo.height }}
    >
      <img
        alt=''
        decoding='async'
        height={photo.height}
        onLoad={() => setLoadedFile(photo.file)}
        src={`/pictures/${photo.file}`}
        width={photo.width}
      />
    </span>
  )
}
