import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { fiveCluesContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { FiveCluesLadder } from '@/presentation/components/five-clues-ladder'
import { FlagPicture } from '@/presentation/components/flag-picture'
import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './five-clues-reveal.sass'

/** Past this many finders a rung of the room's reveal prints each one's rank, pawn and pay, the names left to the standings beside it. */
const MOST_NAMED_ON_A_RUNG = 8

type FiveCluesRevealProps = {
  players: readonly PublicPlayer[]
  round: RoundView
  /** Which screen draws it: the room's names every finder, a seat prints their pawns. */
  size: 'reveal' | 'seat'
  /** The reader's own seat, framed wherever it stands; `null` without one. */
  youId: PlayerId | null
}

/**
 * The country at the summit and the whole ladder under it, each finder
 * standing on the rung it found on, ranked by the clue then the millisecond
 * as `round.awards` already comes, with what it paid — the answer's share and
 * the clock's printed apart, as every clocked pay is.
 */
export const FiveCluesReveal: React.FC<FiveCluesRevealProps> = ({
  players,
  round,
  size,
  youId
}) => {
  const translate = useTranslate()
  const content = fiveCluesContent(round)
  const answer = content?.answer ?? null

  if (content === null || answer === null) {
    return null
  }

  const foundOn = new Map(
    content.standings.flatMap((standing) =>
      standing.status === 'found'
        ? [[standing.playerId, standing.clueIndex] as const]
        : []
    )
  )
  const ranked = round.awards.filter((award) => foundOn.has(award.playerId))
  const out = content.standings.filter((standing) => standing.status === 'out')

  return (
    <div className='five-clues-reveal' data-size={size}>
      {size === 'seat' && <FiveCluesSummit round={round} />}
      <FiveCluesLadder
        clues={content.clues}
        isRevealed
        openClueIndex={content.openClueIndex}
        peopleOf={(clueIndex) => (
          <ol
            className='ranked'
            data-crowded={
              ranked.filter(
                (award) => foundOn.get(award.playerId) === clueIndex
              ).length > MOST_NAMED_ON_A_RUNG || undefined
            }
          >
            {ranked.map((award, rank) => {
              const seat = players.findIndex(
                (player) => player.id === award.playerId
              )
              const player = players[seat]

              if (foundOn.get(award.playerId) !== clueIndex || !player) {
                return null
              }

              return (
                <li
                  className='finder'
                  data-you={award.playerId === youId || undefined}
                  key={award.playerId}
                  style={{ '--finder-at': rank }}
                >
                  <span className='rank'>{rank + 1}</span>
                  <Pawn seat={seat} />
                  <span className='name'>{player.nickname}</span>
                  <span className='pay'>
                    {award.speedBonus > 0
                      ? translate('round.awardWithSpeed', {
                          answer:
                            shownPoints(award.points) -
                            shownPoints(award.speedBonus),
                          speed: shownPoints(award.speedBonus)
                        })
                      : translate('round.scored', {
                          points: shownPoints(award.points)
                        })}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
        size='reveal'
      />
      {size === 'reveal' && out.length > 0 && (
        <ul className='misses'>
          {out.map(({ playerId }) => {
            const seat = players.findIndex((player) => player.id === playerId)
            const player = players[seat]
            const said = round.revealedAnswers.find(
              (answered) => answered.playerId === playerId
            )?.said

            return player === undefined ? null : (
              <li className='miss' key={playerId}>
                <Pawn seat={seat} />
                <span className='name'>{player.nickname}</span>
                {said !== undefined && <s className='said'>{said}</s>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** The country climbed to, on a green summit beside its flag and its capital. */
export const FiveCluesSummit: React.FC<{ round: RoundView }> = ({ round }) => {
  const translate = useTranslate()
  const content = fiveCluesContent(round)
  const answer = content?.answer ?? null

  if (content === null || answer === null) {
    return null
  }

  const flag = content.clues.find((clue) => clue.kind === 'flag')

  return (
    <div className='five-clues-summit'>
      {flag !== undefined && <FlagPicture file={flag.flag} isNamedBeside />}
      <p className='country'>
        {translate(`atlas.country.${answer.code}.name`)}
      </p>
      {flag !== undefined && (
        <p className='capital'>
          <small>{translate('fiveclues.clue.capital')}</small>
          {flag.capital}
        </p>
      )}
    </div>
  )
}
