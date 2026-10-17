import type React from 'react'
import { useState } from 'react'
import { DialogTrigger, Form } from 'react-aria-components'

import { TEAM_NAME_MAX_LENGTH, type Team } from '@melee/protocol/team'

import { Button } from '@/presentation/components/button'
import { RenameIcon } from '@/presentation/components/icons'
import { Leaflet } from '@/presentation/components/leaflet'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './team-leaflet.sass'

type RenameTeamProps = {
  onRename: (name: string) => void
  team: Team
}

/** The pencil in a team's head, opening the one field that names it. */
export const RenameTeam: React.FC<RenameTeamProps> = ({ onRename, team }) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const label = translate('team.rename.action', { team: teamName(team) })

  return (
    <DialogTrigger>
      <Button
        aria-label={label}
        className='team-press'
        size='small'
        variant='outlined'
      >
        <RenameIcon />
      </Button>
      <Leaflet aria-label={label} className='team-leaflet' placement='bottom'>
        {({ close }) => (
          <RenameForm
            initial={teamName(team)}
            onRename={(name) => {
              onRename(name)
              close()
            }}
          />
        )}
      </Leaflet>
    </DialogTrigger>
  )
}

/** Mounted with the leaflet, so each opening starts from the name on screen. */
const RenameForm: React.FC<{
  initial: string
  onRename: (name: string) => void
}> = ({ initial, onRename }) => {
  const translate = useTranslate()
  const [name, setName] = useState(initial)

  return (
    <Form
      className='team-leaflet-form'
      onSubmit={(event) => {
        event.preventDefault()
        onRename(name.trim())
      }}
    >
      <TextField
        autoComplete='off'
        autoFocus
        label={translate('team.rename.label')}
        maxLength={TEAM_NAME_MAX_LENGTH}
        onChange={setName}
        value={name}
      />
      <Button isDisabled={name.trim() === ''} type='submit' variant='filled'>
        {translate('team.rename.submit')}
      </Button>
    </Form>
  )
}
