import type React from 'react'

import type { PublicPlayer } from '@melee/protocol/room'

import { Pawn } from '@/presentation/components/pawn'

import './petit-bac-authors.sass'

type PetitBacAuthorsProps = {
  /** The seats that wrote the word, as the server listed them. */
  authorIds: readonly string[]
  /** Needed to turn the ids into pawns and names. */
  players: readonly PublicPlayer[]
}

/**
 * Who wrote a word, by pawn and by name: in a team evening every pawn of a
 * team wears its colour, so the name is the only thing telling two apart.
 */
export const PetitBacAuthors: React.FC<PetitBacAuthorsProps> = ({
  authorIds,
  players
}) => (
  <ul className='petit-bac-authors'>
    {authorIds.map((playerId) => {
      const seat = players.findIndex((player) => player.id === playerId)

      return (
        <li key={playerId}>
          <Pawn seat={seat} />
          <span className='name'>{players[seat]?.nickname ?? ''}</span>
        </li>
      )
    })}
  </ul>
)
