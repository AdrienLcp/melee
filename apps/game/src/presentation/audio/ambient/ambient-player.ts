import { seededUnits } from '@melee/core/helpers/random'
import type { AmbientMood } from '@melee/core/room/ambient-music'

import { MOOD_ENERGY, type Piece, type Style } from './piece'
import { levelOf, type Random } from './theory'

/**
 * How far ahead bars are written into the context. Generous, because a tab in
 * the background ticks once a second at best; the bus fades whatever is
 * already written, so a long lead never delays giving way.
 */
const LEAD_S = 2.5
const TICK_MS = 250

/**
 * Time constants of the bus's approach to its level: going under a clip is
 * quicker than coming back, so the clip never starts over a tail of music, and
 * the music returns as a swell rather than a switch.
 */
export const DOWN_TIME_CONSTANT_S = 0.45
export const UP_TIME_CONSTANT_S = 1.4

/** Below this the bus is silent, and the pieces under it are let go. */
const SILENT_LEVEL = 0.002

/** A piece fades in over this, under the outro of the one before. */
const PIECE_FADE_IN_S = 3

/** The part of a `GainNode` the player moves. */
export type Fader = {
  disconnect: () => void
  gain: {
    cancelScheduledValues: (at: number) => unknown
    linearRampToValueAtTime: (value: number, at: number) => unknown
    setTargetAtTime: (value: number, at: number, constant: number) => unknown
    setValueAtTime: (value: number, at: number) => unknown
    value: number
  }
}

type Playing = {
  ends: number
  fader: Fader
  nextBar: number
  piece: Piece
  startsAt: number
  successorStarted: boolean
}

export type AmbientPlayer = {
  /**
   * Fades what plays out now and the next piece in under it, rather than
   * waiting minutes for the outro — what a change of style asks for.
   */
  crossfadeNow: () => void
  dispose: () => void
  /** 0 to 1, the level a mood plays at, approached smoothly. */
  setLevel: (level: number) => void
  /** `null` fades the music out — never a cut — and a mood fades it back. */
  setMood: (mood: AmbientMood | null) => void
}

/**
 * Plays piece after piece, each a fresh draw of key, tempo and progression,
 * the next fading in over the last's outro — so the evening hears hours of one
 * band and never the same song twice. The audio graph is the caller's:
 * `beginPiece` hands back a piece written into a fader that feeds `bus`.
 */
export const startAmbient = ({
  beginPiece,
  bus,
  now
}: {
  beginPiece: (args: { random: Random; startAt: number }) => {
    fader: Fader
    piece: Piece
  }
  bus: Fader
  now: () => number
}): AmbientPlayer => {
  let mood: AmbientMood = 'calm'
  let isGivingWay = true
  let level = 0
  let target = 0
  let playing: Playing[] = []

  bus.gain.value = 0

  const begin = (startAt: number): void => {
    const { fader, piece } = beginPiece({
      random: seededUnits(Math.floor(Math.random() * 2 ** 32)),
      startAt
    })

    fader.gain.setValueAtTime(0, startAt)
    fader.gain.linearRampToValueAtTime(1, startAt + PIECE_FADE_IN_S)
    playing.push({
      ends: startAt + piece.bars * piece.secondsPerBar,
      fader,
      nextBar: 0,
      piece,
      startsAt: startAt,
      successorStarted: false
    })
  }

  const write = (horizon: number): void => {
    for (const entry of [...playing]) {
      const { piece, startsAt } = entry

      while (
        entry.nextBar < piece.bars &&
        startsAt + entry.nextBar * piece.secondsPerBar < horizon &&
        startsAt + entry.nextBar * piece.secondsPerBar < entry.ends
      ) {
        const section = piece.sections[entry.nextBar] ?? 'body'

        piece.playBar({
          at: startsAt + entry.nextBar * piece.secondsPerBar,
          bar: entry.nextBar,
          energy: MOOD_ENERGY[mood] * levelOf(section),
          section
        })
        entry.nextBar++
      }

      const outroAt = entry.ends - piece.secondsPerBar * 2

      if (!entry.successorStarted && outroAt < horizon) {
        entry.successorStarted = true
        entry.fader.gain.setValueAtTime(1, outroAt)
        entry.fader.gain.linearRampToValueAtTime(0, entry.ends)
        begin(outroAt + piece.secondsPerBar)
      }
    }
  }

  const letGo = (entry: Playing): void => {
    entry.fader.disconnect()
  }

  const tick = (): void => {
    const time = now()

    if (target === 0 && bus.gain.value < SILENT_LEVEL) {
      playing.forEach(letGo)
      playing = []

      return
    }

    if (playing.length === 0) {
      begin(time + 0.05)
    }

    write(time + LEAD_S)
    playing.filter((entry) => entry.ends + 3 < time).forEach(letGo)
    playing = playing.filter((entry) => entry.ends + 3 >= time)
  }

  const approach = (): void => {
    const next = isGivingWay ? 0 : level

    if (next === target) {
      return
    }

    const time = now()

    bus.gain.cancelScheduledValues(time)
    bus.gain.setValueAtTime(bus.gain.value, time)
    bus.gain.setTargetAtTime(
      next,
      time,
      next < target ? DOWN_TIME_CONSTANT_S : UP_TIME_CONSTANT_S
    )
    target = next
    tick()
  }

  const crossfadeNow = (): void => {
    if (playing.length === 0) {
      return
    }

    const time = now()
    const fadedAt = time + PIECE_FADE_IN_S

    for (const entry of playing) {
      entry.successorStarted = true
      entry.fader.gain.cancelScheduledValues(time)
      entry.fader.gain.setValueAtTime(entry.fader.gain.value, time)
      entry.fader.gain.linearRampToValueAtTime(0, fadedAt)
      entry.ends = Math.min(entry.ends, fadedAt)
    }

    begin(time + 0.05)
  }

  const timer = setInterval(tick, TICK_MS)

  return {
    crossfadeNow,
    dispose: () => {
      clearInterval(timer)
      playing.forEach(letGo)
      playing = []
      bus.disconnect()
    },
    setLevel: (next) => {
      level = next
      approach()
    },
    setMood: (next) => {
      isGivingWay = next === null

      if (next !== null) {
        mood = next
      }

      approach()
    }
  }
}

/**
 * Pieces played through `context`, each in the style `styleOfNextPiece`
 * answers as it begins: a bus behind a gentle limiter, and a fader per piece
 * so one fades into the next.
 */
export const startStyles = ({
  context,
  destination,
  styleOfNextPiece
}: {
  context: BaseAudioContext
  destination: AudioNode
  styleOfNextPiece: () => Style
}): AmbientPlayer => {
  const bus = context.createGain()
  const limiter = context.createDynamicsCompressor()

  limiter.threshold.value = -14
  limiter.ratio.value = 6
  bus.connect(limiter).connect(destination)

  const player = startAmbient({
    beginPiece: ({ random, startAt }) => {
      const fader = context.createGain()

      fader.connect(bus)

      return {
        fader,
        piece: styleOfNextPiece().createPiece({
          context,
          destination: fader,
          random,
          startAt
        })
      }
    },
    bus,
    now: () => context.currentTime
  })

  return {
    ...player,
    dispose: () => {
      player.dispose()
      limiter.disconnect()
    }
  }
}

/** Writes `seconds` of a style into an offline context: the ear's stand-in. */
export const writeOffline = ({
  context,
  destination,
  mood,
  seconds,
  style,
  seed
}: {
  context: BaseAudioContext
  destination: AudioNode
  mood: AmbientMood
  seconds: number
  seed: number
  style: Style
}): void => {
  const piece = style.createPiece({
    context,
    destination,
    random: seededUnits(seed),
    startAt: 0
  })

  for (
    let bar = 0;
    bar * piece.secondsPerBar < seconds && bar < piece.bars;
    bar++
  ) {
    const section = piece.sections[bar] ?? 'body'

    piece.playBar({
      at: bar * piece.secondsPerBar,
      bar,
      energy: MOOD_ENERGY[mood] * levelOf(section),
      section
    })
  }
}
