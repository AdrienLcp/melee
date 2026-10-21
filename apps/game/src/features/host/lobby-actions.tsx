import type React from 'react'

import { launchesWithHostSeated } from '@melee/core/room/play-right-away'

import { Button } from '@/presentation/components/button'
import { PlayRightAway } from '@/presentation/components/play-right-away'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { PrimaryPress, SecondaryPresses, useActionSlot } from './action-slot'
import { ChallengeLineField } from './challenge-line-field'
import type { HostActionsProps } from './host-actions'
import { playStyleFor, TurnsChoice } from './turns-choice'

export const LobbyActions: React.FC<HostActionsProps> = ({
  challengeLine,
  isLive,
  onOpenRound,
  onPlayRightAway,
  onPlayStyle,
  playStyle,
  send,
  slateKeys,
  view
}) => {
  const translate = useTranslate()
  const slot = useActionSlot()
  const playsAloud = view.settings.teams.kind === 'aloud'
  const isRoomEmpty = view.players.length === 0 && !playsAloud
  const hasNoGame = view.settings.game === null

  // An empty table's launch seats its host and starts, which is the one press
  // somebody playing alone needs — the seat form and a greyed *gather round*
  // were three. The moment a player arrives it is the group's launch again.
  // The room's own screen is nobody's seat until the host says so in its
  // drawer, so its launch stays the group's.
  if (
    slot === 'all' &&
    !playsAloud &&
    launchesWithHostSeated({
      game: view.settings.game?.kind ?? null,
      mode: view.settings.mode.kind,
      seated: view.players.length
    })
  ) {
    return (
      <PlayRightAway
        className='launch'
        isDisabled={!isLive}
        onPlay={(nickname) => {
          onOpenRound()
          onPlayRightAway(nickname)
        }}
      />
    )
  }

  return (
    <div className='launch'>
      <SecondaryPresses>
        {challengeLine !== null && (
          <ChallengeLineField
            isDisabled={!isLive}
            onChange={challengeLine.onChange}
            value={challengeLine.text}
          />
        )}
        <TurnsChoice
          isDisabled={!isLive}
          onChange={onPlayStyle}
          playStyle={playStyle}
          view={view}
        />
      </SecondaryPresses>
      <PrimaryPress>
        <Button
          isDisabled={!isLive || isRoomEmpty || hasNoGame}
          onPress={() => {
            onOpenRound()
            send({
              challengeText: challengeLine?.text,
              playStyle: playStyleFor({ playStyle, view }),
              slateKeys,
              type: 'host.startRound'
            })
          }}
          size='large'
        >
          {translate('host.startGame')}
        </Button>
        {/*
        The game first when both are missing: it is the decision on the stage
        the host is already looking at, where the roster fills itself as
        players arrive. The server refuses either way — see `no_game_chosen`.
      */}
        {hasNoGame ? (
          <p className='reason'>{translate('host.needsGame')}</p>
        ) : (
          isRoomEmpty && (
            <p className='reason'>{translate('host.needsPlayer')}</p>
          )
        )}
      </PrimaryPress>
    </div>
  )
}
