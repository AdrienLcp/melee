import type React from 'react'
import { useState } from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { HostRoomView, RoundView } from '@melee/protocol/room'
import type { TeamVerdict } from '@melee/protocol/team'

import { Button } from '@/presentation/components/button'
import { Pawn } from '@/presentation/components/pawn'
import { ToggleGroup } from '@/presentation/components/toggle-group'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './team-verdicts.sass'

const HAD_IT = 'hadIt'
const TITLE = 'title'
const ARTIST = 'artist'

type TeamVerdictsProps = {
  isLive: boolean
  round: RoundView
  send: (message: ClientMessage) => boolean
  view: HostRoomView
}

const verdictOf = ({
  halves,
  picked
}: {
  halves: boolean
  picked: ReadonlySet<string>
}): TeamVerdict['verdict'] | null => {
  if (picked.size === 0) {
    return null
  }

  return halves
    ? {
        artistCorrect: picked.has(ARTIST),
        kind: 'halves',
        titleCorrect: picked.has(TITLE)
      }
    : { isCorrect: true, kind: 'single' }
}

/**
 * The host's word on which teams had it, at a table answering aloud: a row per
 * team, then one press that pays and turns the answer over. A blind test asks
 * for the title and the artist apart, because each is a point.
 *
 * Laid out like the challenge's podium: a row is one glance and one press, in
 * roster order so nothing moves under the thumb.
 */
export const TeamVerdicts: React.FC<TeamVerdictsProps> = ({
  isLive,
  round,
  send,
  view
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const [picks, setPicks] = useState<ReadonlyMap<string, ReadonlySet<string>>>(
    () => new Map()
  )

  const content = view.currentContent
  const halves = content?.kind === 'blindtest'
  const asksForAFilm =
    content?.kind === 'blindtest' && (content.track?.film ?? null) !== null

  const options = halves
    ? [
        {
          label: translate(
            asksForAFilm ? 'team.aloud.film' : 'team.aloud.title'
          ),
          value: TITLE
        },
        {
          label: translate(
            asksForAFilm ? 'team.aloud.composer' : 'team.aloud.artist'
          ),
          value: ARTIST
        }
      ]
    : [{ label: translate('team.aloud.hadIt'), value: HAD_IT }]

  const verdicts: TeamVerdict[] = view.teams.flatMap((team) => {
    const verdict = verdictOf({
      halves,
      picked: picks.get(team.id) ?? new Set()
    })

    return verdict === null ? [] : [{ teamId: team.id, verdict }]
  })

  return (
    <section
      aria-label={translate('team.aloud.label')}
      className='team-verdicts'
    >
      <ul className='team-verdicts-rows'>
        {view.teams.map((team) => (
          <li
            className='team-verdicts-row'
            key={team.id}
            style={{ '--team': `var(--pawn-${team.colour})` }}
          >
            <Pawn colour={team.colour} />
            <ToggleGroup
              isDisabled={!isLive}
              label={teamName(team)}
              onSelectionChange={(selected) => {
                setPicks(
                  new Map(picks).set(
                    team.id,
                    new Set([...selected].map(String))
                  )
                )
              }}
              options={options}
              selectedKeys={picks.get(team.id) ?? new Set()}
            />
          </li>
        ))}
      </ul>
      <div className='team-verdicts-actions'>
        <Button
          isDisabled={!isLive || verdicts.length === 0}
          onPress={() => {
            send({ roundId: round.id, type: 'host.awardTeams', verdicts })
          }}
          size='large'
        >
          {translate('team.aloud.confirm')}
        </Button>
        <Button
          isDisabled={!isLive}
          onPress={() => {
            send({ roundId: round.id, type: 'host.reveal' })
          }}
          variant='underlined'
        >
          {translate('team.aloud.nobody')}
        </Button>
      </div>
    </section>
  )
}
