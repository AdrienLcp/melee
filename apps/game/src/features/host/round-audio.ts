import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

import type { ClipPlayback, HostRoomView } from '@melee/protocol/room'
import type { ClipFault } from '@melee/protocol/sound'

import {
  type ClipRefusal,
  clipRecoveryFor,
  clipRefusalFor,
  isClipStalled,
  isClipUnheard,
  seekTargetMs
} from '@melee/core/blindtest/clip-audio'
import {
  type ClockEstimate,
  millisecondsUntil
} from '@melee/core/time/clock-sync'

import { blindtestHostContent } from '@/helpers/round-content'
import { nowMs } from '@/infrastructure/clock'

/**
 * `setTimeout` is only accurate to a handful of milliseconds under load, which
 * is the wrong order of magnitude for a countdown a room watches together. It
 * wakes this early and the last stretch is spun on `requestAnimationFrame`,
 * which is the clock the compositor is already keeping.
 */
const SPIN_LEAD_MS = 200

/**
 * Silence, so the element can be blessed inside the press that starts the game.
 * Autoplay policy attaches permission to the element, not to the source — and it
 * cannot be granted later, when the preview URL finally arrives over the socket.
 */
const SILENCE =
  'data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAACAgICAgICAgA=='

/**
 * The browser's own name for a rejection, and `null` when it did not give one —
 * which `clipRefusalFor` reads as telling the room nothing.
 */
const nameOf = (refusal: unknown): string | null =>
  refusal instanceof DOMException ? refusal.name : null

/**
 * A rejected `play()` means this screen is not armed after all, whatever the
 * reason: the console has to say which and offer the press again, or the tab is
 * mute for the rest of the evening with a message that never changes.
 */
const play = (
  audio: HTMLAudioElement,
  onRefused: (refusal: ClipRefusal) => void
): void => {
  void audio.play().catch((refusal: unknown) => {
    const refused = clipRefusalFor(nameOf(refusal))

    if (refused !== null) {
      onRefused(refused)
    }
  })
}

/**
 * The element is React state, which the compiler holds immutable inside the
 * hook: the effects change it through these instead of assigning to it.
 */
const setVolume = (audio: HTMLAudioElement, volume: number): void => {
  audio.volume = volume
}

const loadClip = (audio: HTMLAudioElement, url: string): void => {
  audio.src = url
  audio.load()
}

const moveTo = (audio: HTMLAudioElement, positionMs: number): void => {
  audio.currentTime = positionMs / 1_000
}

/** How often a sounding clip's position is looked at to tell it has stalled. */
const STALL_CHECK_MS = 1_000

/** The two blessed elements a round's clip alternates between. */
type Decks = readonly [HTMLAudioElement, HTMLAudioElement]

/** A round's clip, on the deck it was loaded into. */
type LoadedClip = { deck: HTMLAudioElement; roundId: string; url: string }

const clipKeyOf = ({ roundId, url }: { roundId: string; url: string }) =>
  `${roundId} ${url}`

export type RoundAudio = {
  /**
   * Whether a press has blessed an element on this screen. `false` after a
   * reload, a restored tab or an address pasted into a console mid-round — the
   * three ways of arriving at a running clip with nothing able to play it.
   */
  canPlay: boolean
  /**
   * Why the round on screen's clip is not sounding here, and `null` while it
   * plays or this screen is not the one meant to sound it. `blocked` is a
   * screen nobody armed — or whose arming was refused — through a round with a
   * clip; the other two are a clip an armed screen could not play.
   */
  fault: ClipFault | null
  /**
   * Why the last attempt to arm or to play was turned down, and `null` while
   * none has been. It is what stops the console offering an identical press
   * forever: the offer stays, because a policy can change between two of them,
   * but the screen says what happened the last time.
   */
  refusal: ClipRefusal | null
  /**
   * MUST be called synchronously inside a user gesture. Called later — from an
   * effect, or from the socket frame that brings the track — it silently does
   * nothing and no audio ever plays.
   */
  unlock: () => void
}

export const useRoundAudio = ({
  clock,
  view,
  volume
}: {
  clock: ClockEstimate | null
  view: HostRoomView | null
  /** 0 to 1. */
  volume: number
}): RoundAudio => {
  /**
   * Which deck holds which round's clip. Two decks so the last clip can go on
   * under its reveal and the countdown after it while the next one loads on
   * the other: one element would have to drop the music the room is still
   * listening to, or start the next clip late. Keyed on the URL as well: a
   * clip that would not load before its round is replaced on the same round.
   */
  const loadedRef = useRef<LoadedClip | null>(null)
  /** The clip this screen last loaded again after it would not sound. */
  const retriedRef = useRef<string | null>(null)
  /** When the round's elapsed time was last heard, to tell where it is now. */
  const elapsedSeenAtRef = useRef(0)
  /**
   * The blessed decks are **state**, not a ref, and that is the whole of what
   * makes a mid-round press take: the effect below is what loads, seeks and
   * plays, and a ref changing re-runs nothing. It is also the honest dependency
   * — a boolean beside a ref says the same thing twice and only one of them is
   * in the list.
   */
  /**
   * The host's last word on the revealed clip that this screen has acted on.
   * A pause or a replay is a change to it, never its value: arriving at a
   * reveal already marked paused, there is nothing to pause.
   */
  const steeredRef = useRef<{ playback: ClipPlayback; roundId: string } | null>(
    null
  )
  /**
   * Whether the last run silenced the clip for a room the host paused. A
   * reveal only plays on a change of the host's word, so letting go of the
   * pause has to be that change.
   */
  const heldRef = useRef(false)
  const [decks, setDecks] = useState<Decks | null>(null)
  const [refusal, setRefusal] = useState<ClipRefusal | null>(null)
  const [clipFault, setClipFault] = useState<{
    cause: ClipFault
    clip: string
  } | null>(null)

  // `useCallback` for the one reason that survives the compiler: it is a
  // dependency of the effect below, and a fresh identity there would tear the
  // clip down and start it again on every render.
  const disarm = useCallback((refused: ClipRefusal): void => {
    loadedRef.current = null
    setDecks(null)
    setRefusal(refused)
  }, [])

  // Every pong moves the clock estimate, and a dependency on it would re-arm
  // the clip — restarting a running one — several times a second.
  const millisecondsUntilStart = useEffectEvent((target: number): number =>
    millisecondsUntil(clock, target, nowMs())
  )

  useEffect(() => {
    for (const deck of decks ?? []) {
      setVolume(deck, volume)
    }
  }, [decks, volume])

  // On the way out, and on the way to a disarmed screen: an element nobody is
  // going to reach again must not go on sounding.
  useEffect(
    () => () => {
      for (const deck of decks ?? []) {
        deck.pause()
      }
    },
    [decks]
  )

  const phase = view?.phase ?? null
  const round = view?.round ?? null
  const blindtest = blindtestHostContent(view)
  const previewUrl = blindtest?.audioUrl ?? null
  const isPaused = blindtest?.playback.isPaused ?? false
  const restarts = blindtest?.playback.restarts ?? 0
  const startsAt = round?.startsAt ?? null
  const roundId = round?.id ?? null
  const elapsedMs = view?.roundElapsedMs ?? 0
  const isRoomPaused = view?.isPaused ?? false
  const currentClip =
    roundId === null || previewUrl === null
      ? null
      : clipKeyOf({ roundId, url: previewUrl })

  // Reloads only the element, never the page: the press that armed it would
  // be lost with a reload, and the screen would have nothing to show for it.
  const failClip = useEffectEvent(
    (cause: ClipFault, loaded: LoadedClip): void => {
      const clip = clipKeyOf(loaded)

      if (clipFault?.clip === clip) {
        return
      }

      if (
        clipRecoveryFor({ clip, retriedClip: retriedRef.current }) === 'report'
      ) {
        setClipFault({ cause, clip })

        return
      }

      retriedRef.current = clip
      loadClip(loaded.deck, loaded.url)

      // A countdown's clip is started by its own schedule, which still holds.
      if (phase !== 'playing' || isRoomPaused || loadedRef.current !== loaded) {
        return
      }

      moveTo(loaded.deck, elapsedMs + nowMs() - elapsedSeenAtRef.current)
      play(loaded.deck, (refused) => {
        if (refused === 'unsupported') {
          setClipFault({ cause, clip })
        } else {
          disarm(refused)
        }
      })
    }
  )

  // An element that cannot fetch its file says so here, often before `play()`
  // is even called — a countdown is long enough for a refused URL to fail.
  useEffect(() => {
    if (decks === null) {
      return
    }

    const onError = (event: Event): void => {
      const loaded = loadedRef.current

      if (loaded !== null && event.target === loaded.deck) {
        failClip('unreachable', loaded)
      }
    }

    for (const deck of decks) {
      deck.addEventListener('error', onError)
    }

    return () => {
      for (const deck of decks) {
        deck.removeEventListener('error', onError)
      }
    }
  }, [decks])

  // `play()` resolving says nothing about sound: a clip can be "playing" on a
  // second that never moves while it waits for bytes that never come. Its
  // position moving is the one thing that proves it plays.
  useEffect(() => {
    if (
      decks === null ||
      phase !== 'playing' ||
      isRoomPaused ||
      currentClip === null
    ) {
      return
    }

    let position = Number.NaN
    let stillSinceMs = nowMs()

    const timer = window.setInterval(() => {
      const loaded = loadedRef.current

      if (loaded === null || clipKeyOf(loaded) !== currentClip) {
        return
      }

      const now = nowMs()

      if (loaded.deck.currentTime !== position) {
        const hasMoved = !Number.isNaN(position)

        position = loaded.deck.currentTime
        stillSinceMs = now

        if (hasMoved) {
          setClipFault((fault) => (fault?.clip === currentClip ? null : fault))
        }

        return
      }

      if (
        isClipStalled({ hasEnded: loaded.deck.ended, nowMs: now, stillSinceMs })
      ) {
        stillSinceMs = now
        failClip('stalled', loaded)
      }
    }, STALL_CHECK_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [currentClip, decks, isRoomPaused, phase])

  useEffect(() => {
    elapsedSeenAtRef.current = nowMs()

    if (decks === null) {
      return
    }

    // Refused on a clip this element was already allowed to play silence on,
    // `NotSupportedError` is the file — a refused or expired URL, a dropped
    // connection — and never this screen, which stays armed for the next one.
    const refuse = (refused: ClipRefusal): void => {
      const loaded = loadedRef.current

      if (refused === 'unsupported' && loaded !== null) {
        failClip('unreachable', loaded)
      } else {
        disarm(refused)
      }
    }

    if (phase === 'lobby' || phase === 'finished') {
      for (const deck of decks) {
        deck.pause()
      }

      return
    }

    // Every clock stops with the room, the clip first; it picks up from
    // `roundElapsedMs` below once the room is let go.
    if (isRoomPaused) {
      heldRef.current = true

      for (const deck of decks) {
        deck.pause()
      }

      return
    }

    const wasHeld = heldRef.current

    heldRef.current = false

    // The reveal is not silence: the clip goes on under the answer, which is
    // most of what makes the answer land — until the host pauses or replays it.
    if (phase === 'revealed') {
      const loaded = loadedRef.current
      const steered = steeredRef.current
      const playback = { isPaused, restarts }

      steeredRef.current = roundId === null ? null : { playback, roundId }

      if (loaded === null || loaded.roundId !== roundId) {
        return
      }

      if (steered?.roundId !== roundId) {
        return
      }

      if (wasHeld && !isPaused) {
        play(loaded.deck, refuse)

        return
      }

      if (restarts !== steered.playback.restarts) {
        moveTo(loaded.deck, 0)
        play(loaded.deck, refuse)
      } else if (isPaused !== steered.playback.isPaused) {
        if (isPaused) {
          loaded.deck.pause()
        } else {
          play(loaded.deck, refuse)
        }
      }

      return
    }

    // Past its reveal, a round's clip has had its moment: the next countdown,
    // or a game with no clip at all, must not play under it.
    for (const deck of decks) {
      if (
        deck !== loadedRef.current?.deck ||
        loadedRef.current.roundId !== roundId
      ) {
        deck.pause()
      }
    }

    if (phase === 'buzzed') {
      loadedRef.current?.deck.pause()

      return
    }

    if (previewUrl === null || roundId === null) {
      return
    }

    const previous = loadedRef.current

    if (previous?.roundId !== roundId) {
      const spare = previous?.deck === decks[0] ? decks[1] : decks[0]

      loadedRef.current = { deck: spare, roundId, url: previewUrl }
      loadClip(spare, previewUrl)
    } else if (previous.url !== previewUrl) {
      loadedRef.current = { ...previous, url: previewUrl }
      loadClip(previous.deck, previewUrl)
    }

    const deck = loadedRef.current?.deck ?? decks[0]
    const other = deck === decks[0] ? decks[1] : decks[0]

    if (phase === 'playing') {
      other.pause()

      // Either the clip was paused by a buzz, or this host just reloaded into a
      // round already running — `roundElapsedMs` is what tells the two apart.
      const seekTo = seekTargetMs({
        elapsedMs,
        playedMs: deck.currentTime * 1_000
      })

      if (seekTo !== null) {
        moveTo(deck, seekTo)
      }

      play(deck, refuse)

      return
    }

    if (startsAt === null) {
      return
    }

    moveTo(deck, 0)

    let frame = 0

    const startWhenDue = (): void => {
      if (millisecondsUntilStart(startsAt) <= 0) {
        other.pause()
        play(deck, refuse)

        return
      }

      frame = requestAnimationFrame(startWhenDue)
    }

    const timer = window.setTimeout(
      startWhenDue,
      Math.max(0, millisecondsUntilStart(startsAt) - SPIN_LEAD_MS)
    )

    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
    // The decks are a dependency because arming happens *during* a round now:
    // a console that reloaded mid-clip presses once, and this has to run again
    // or the decks sit blessed and silent until the next round opens.
  }, [
    decks,
    disarm,
    elapsedMs,
    isPaused,
    isRoomPaused,
    phase,
    previewUrl,
    restarts,
    roundId,
    startsAt
  ])

  const isUnarmed = isClipUnheard({
    canPlay: decks !== null,
    hasClip: previewUrl !== null,
    phase
  })

  return {
    canPlay: decks !== null,
    fault: isUnarmed
      ? 'blocked'
      : clipFault !== null && clipFault.clip === currentClip
        ? clipFault.cause
        : null,
    refusal,
    unlock: () => {
      if (decks !== null) {
        return
      }

      const blessed: Decks = [new Audio(SILENCE), new Audio(SILENCE)]

      for (const deck of blessed) {
        deck.preload = 'auto'
        deck.volume = volume
      }

      // Kept only once the browser has actually let both play. Storing them
      // either way is what made a refused first press permanent: the guard
      // above then answered every later press with a silent no-op, and the tab
      // was mute for the rest of the evening.
      void Promise.all(blessed.map((deck) => deck.play())).then(
        () => {
          for (const deck of blessed) {
            deck.pause()
          }

          setDecks(blessed)
          setRefusal(null)
        },
        (refused: unknown) => {
          // The branch that swallowed everything, which is why a console could
          // press all evening and never learn that every press had failed. An
          // abort cannot happen here — nothing else loads this element — so
          // there is no rejection this may drop.
          setRefusal(clipRefusalFor(nameOf(refused)) ?? 'broken')
        }
      )
    }
  }
}
