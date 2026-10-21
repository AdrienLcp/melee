import type React from 'react'

import type { FlagFile } from '@melee/protocol/question'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './flag-picture.sass'

type FlagPictureProps = {
  /** The file under `/flags/`, named after its drawing and never its country. */
  file: FlagFile
  /**
   * The country is printed beside it, as on the reveal: the picture is then a
   * repeat a screen reader skips. While the question is open its text names a
   * flag to recognise, and never the country.
   */
  isNamedBeside?: boolean
}

/**
 * A flag printed onto the card it is asked on, at the 4:3 every file is drawn
 * at. The caller sizes it through `--flag-height`.
 */
export const FlagPicture: React.FC<FlagPictureProps> = ({
  file,
  isNamedBeside = false
}) => {
  const translate = useTranslate()

  return (
    <img
      alt={isNamedBeside ? '' : translate('quiz.flag.alt')}
      className='flag-picture'
      height={480}
      src={`/flags/${file}`}
      width={640}
    />
  )
}
