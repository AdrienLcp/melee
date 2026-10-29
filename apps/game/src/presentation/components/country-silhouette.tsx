import type React from 'react'

import type { SilhouetteFile } from '@melee/protocol/question'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './country-silhouette.sass'

type CountrySilhouetteProps = {
  /** The file under `/silhouettes/`, named after its drawing and never its country. */
  file: SilhouetteFile
  /**
   * The country is printed beside it, as on the reveal: the picture is then a
   * repeat a screen reader skips.
   */
  isNamedBeside?: boolean
}

/**
 * A country's outline printed in the card's ink, square like every file is
 * drawn. The file is a mask, so the outline takes the palette's ink rather
 * than the black it was drawn in. The caller sizes it through
 * `--prompt-picture-height`.
 */
export const CountrySilhouette: React.FC<CountrySilhouetteProps> = ({
  file,
  isNamedBeside = false
}) => {
  const translate = useTranslate()

  const style = { '--silhouette-url': `url(/silhouettes/${file})` }

  if (isNamedBeside) {
    return <div aria-hidden className='country-silhouette' style={style} />
  }

  return (
    <div
      aria-label={translate('quiz.silhouette.alt')}
      className='country-silhouette'
      role='img'
      style={style}
    />
  )
}
