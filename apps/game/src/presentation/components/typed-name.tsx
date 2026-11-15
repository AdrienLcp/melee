import type React from 'react'

import './typed-name.sass'

/**
 * The `<name>` span of a dictionary sentence — a seat's or a team's name —
 * set in the read face inside the display face around it, so a capital I and
 * a small l stand apart. Handed to `translate.rich` as `name: typedName` and
 * rendered through `RichText`.
 */
export const typedName = (name: string): React.ReactNode => (
  <span className='typed-name'>{name}</span>
)
