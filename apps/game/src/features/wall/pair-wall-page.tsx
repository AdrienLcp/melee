import type React from 'react'
import { useState } from 'react'
import { flushSync } from 'react-dom'

import type { RoomCode } from '@melee/protocol/identifiers'

import { pairWall } from '@/infrastructure/api/melee-api'
import { replaceScreen } from '@/infrastructure/browser'
import {
  homePathFor,
  hostPathFor,
  usePairingCodeParam
} from '@/infrastructure/router/navigation'
import { readHostToken } from '@/infrastructure/storage/session-storage'
import { Button } from '@/presentation/components/button'
import { Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { useOpenHostedRooms } from '@/presentation/room-actions/use-open-hosted-rooms'
import { usePhaseField } from '@/presentation/theme/use-phase-field'

import './pair-wall-page.sass'

type Pairing =
  | { status: 'failed' }
  | { status: 'idle' }
  | { roomCode: RoomCode; status: 'paired' }
  | { status: 'pairing' }

/**
 * Where the square on a waiting wall leads. Whoever scans it lands here, and
 * only a device holding a table's token has anything to press: that token is
 * what the wall is handed, so a player who scanned it by mistake is shown why
 * nothing happens rather than a button that fails.
 */
export const PairWallPage: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const pairingCode = usePairingCodeParam()
  const hosted = useOpenHostedRooms()
  const [pairing, setPairing] = useState<Pairing>({ status: 'idle' })
  const [failures, setFailures] = useState(0)
  const isFailed = pairing.status === 'failed'

  usePhaseField('lobby')

  const pair = async (roomCode: RoomCode): Promise<void> => {
    const hostToken = readHostToken(roomCode)

    if (pairingCode === null || hostToken === null) {
      setFailures((previous) => previous + 1)
      setPairing({ status: 'failed' })

      return
    }

    setPairing({ status: 'pairing' })

    const paired = await pairWall({ hostToken, pairingCode, roomCode })

    if (paired.status === 'failure') {
      setFailures((previous) => previous + 1)
      setPairing({ status: 'failed' })

      return
    }

    replaceScreen(() => {
      flushSync(() => {
        setPairing({ roomCode, status: 'paired' })
      })
    })
  }

  if (pairing.status === 'paired') {
    return (
      // A page of its own, replacing the question it answers as a page change
      // would.
      <Main className='pair-wall-page' key='paired'>
        <DocumentTitle>{translate('wall.pair.documentTitle')}</DocumentTitle>
        <h1>{translate('wall.pair.done')}</h1>
        <Link
          href={hostPathFor(pairing.roomCode)}
          size='large'
          variant='filled'
        >
          {translate('wall.pair.backToTable')}
        </Link>
      </Main>
    )
  }

  if (hosted === null) {
    return (
      <Main className='pair-wall-page'>
        <DocumentTitle>{translate('wall.pair.documentTitle')}</DocumentTitle>
      </Main>
    )
  }

  if (pairingCode === null || hosted.length === 0) {
    return (
      <Main className='pair-wall-page'>
        <DocumentTitle>{translate('wall.pair.documentTitle')}</DocumentTitle>
        <h1>{translate('wall.pair.nothingHeld.title')}</h1>
        <p>{translate('wall.pair.nothingHeld.description')}</p>
        <Link href={homePathFor(locale)} variant='outlined'>
          {translate('navigation.back')}
        </Link>
      </Main>
    )
  }

  return (
    <Main className='pair-wall-page'>
      <DocumentTitle>{translate('wall.pair.documentTitle')}</DocumentTitle>
      <h1>{translate('wall.pair.title')}</h1>
      <p>{translate('wall.pair.description', { code: pairingCode })}</p>

      <div className='tables'>
        {hosted.map((roomCode) => (
          <Button
            isDisabled={pairing.status === 'pairing'}
            key={roomCode}
            onPress={() => {
              void pair(roomCode)
            }}
            size='large'
            variant={hosted.length === 1 ? 'filled' : 'outlined'}
          >
            {translate('wall.pair.show', { room: roomCode })}
          </Button>
        ))}
      </div>

      <div
        aria-hidden={!isFailed}
        className='failure'
        data-open={isFailed || undefined}
      >
        <p className='error' key={failures} role='alert'>
          {translate('wall.pair.failed')}
        </p>
      </div>
    </Main>
  )
}
