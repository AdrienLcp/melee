import type React from 'react'
import {
  DialogTrigger,
  Label,
  RadioButton,
  RadioField,
  RadioGroup
} from 'react-aria-components'

import { PAWN_COLOUR_COUNT, type Team } from '@melee/protocol/team'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { teamColourKey } from '@/presentation/i18n/translation'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import { Button } from './button'
import { PaletteIcon } from './icons'
import { Leaflet } from './leaflet'
import { Pawn } from './pawn'
import { VisuallyHidden } from './visually-hidden'

import './team-colour-press.sass'

const PAWN_COLOURS = Array.from(
  { length: PAWN_COLOUR_COUNT },
  (_, index) => index + 1
)

type TeamColourPressProps = {
  /** Sent with the colour picked; the server refuses one another team took first. */
  onRecolour: (colour: number) => void
  /** The team being repainted. */
  team: Team
  /** Every team in the room, whose colours are offered as taken. */
  teams: readonly Team[]
}

/**
 * A press in a team's head opening every pawn colour to repaint the team in.
 * A colour another team holds stays on the sheet, struck and out of reach, so
 * the sheet shows the whole box rather than a set that shrinks as teams pick.
 */
export const TeamColourPress: React.FC<TeamColourPressProps> = ({
  onRecolour,
  team,
  teams
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const label = translate('team.recolour.action', { team: teamName(team) })
  const holders = new Map(
    teams
      .filter((other) => other.id !== team.id)
      .map((other) => [other.colour, other] as const)
  )

  return (
    <DialogTrigger>
      <Button
        aria-label={label}
        className='team-colour-press'
        size='small'
        variant='outlined'
      >
        <PaletteIcon />
      </Button>
      <Leaflet
        aria-label={label}
        className='team-colour-leaflet'
        placement='bottom'
      >
        {({ close }) => (
          <RadioGroup
            className='team-colour-picker'
            onChange={(value) => {
              onRecolour(Number(value))
              close()
            }}
            orientation='horizontal'
            value={`${team.colour}`}
          >
            <Label>{translate('team.recolour.label')}</Label>
            <div className='colours'>
              {PAWN_COLOURS.map((colour) => {
                const holder = holders.get(colour)
                const colourName = translate(teamColourKey(colour))

                return (
                  <RadioField
                    className='colour-field'
                    isDisabled={holder !== undefined}
                    key={colour}
                    value={`${colour}`}
                  >
                    <RadioButton className='colour'>
                      <Pawn colour={colour} />
                      <VisuallyHidden elementType='span'>
                        {holder === undefined
                          ? colourName
                          : holder.name === null
                            ? translate('team.recolour.taken', {
                                colour: colourName
                              })
                            : translate('team.recolour.takenBy', {
                                colour: colourName,
                                team: holder.name
                              })}
                      </VisuallyHidden>
                    </RadioButton>
                  </RadioField>
                )
              })}
            </div>
          </RadioGroup>
        )}
      </Leaflet>
    </DialogTrigger>
  )
}
