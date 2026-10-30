import type React from 'react'

import './notice-card.sass'

/**
 * A wait printed on a paper card lying face up on the board: the one thing
 * the screen has to say while nothing on it can be pressed.
 */
export const NoticeCard: React.FC<{ detail?: string; title: string }> = ({
  detail,
  title
}) => (
  <div className='notice-card'>
    <p className='notice-title'>{title}</p>
    {detail !== undefined && <p className='notice-detail'>{detail}</p>}
  </div>
)
