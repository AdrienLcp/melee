import { hertzOf, type Random } from './theory'

/**
 * Every voice the soundtrack plays, synthesised on the cue context: no file to
 * fetch, no licence to keep, and a piece is as long as the evening wants.
 */
export type Note = {
  at: number
  context: BaseAudioContext
  length: number
  midi: number
  out: AudioNode
  velocity: number
}

/** `exponentialRampToValueAtTime` refuses zero; this is inaudible. */
const FLOOR = 0.0001

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()
const roomImpulses = new WeakMap<BaseAudioContext, AudioBuffer>()

const noiseOf = (context: BaseAudioContext): AudioBuffer => {
  const held = noiseBuffers.get(context)

  if (held !== undefined) {
    return held
  }

  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
  const samples = buffer.getChannelData(0)

  for (let index = 0; index < samples.length; index++) {
    samples[index] = Math.random() * 2 - 1
  }

  noiseBuffers.set(context, buffer)

  return buffer
}

/** A decaying burst of stereo noise: a room, without shipping a recorded one. */
const impulseOf = (context: BaseAudioContext): AudioBuffer => {
  const held = roomImpulses.get(context)

  if (held !== undefined) {
    return held
  }

  const length = Math.round(context.sampleRate * 2.8)
  const buffer = context.createBuffer(2, length, context.sampleRate)

  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel)

    for (let index = 0; index < length; index++) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 3.2
    }
  }

  roomImpulses.set(context, buffer)

  return buffer
}

export type Mix = {
  /** A voice's own fader, sent dry and into the room at `reverb` of its level. */
  channel: (args: { level: number; reverb: number; pan?: number }) => AudioNode
}

export const mixInto = (
  context: BaseAudioContext,
  destination: AudioNode
): Mix => {
  const room = context.createConvolver()
  const roomReturn = context.createGain()

  room.buffer = impulseOf(context)
  roomReturn.gain.value = 0.9
  room.connect(roomReturn).connect(destination)

  return {
    channel: ({ level, pan = 0, reverb }) => {
      const fader = context.createGain()
      const send = context.createGain()
      const panner = context.createStereoPanner()

      fader.gain.value = level
      send.gain.value = reverb
      panner.pan.value = pan
      fader.connect(panner).connect(destination)
      fader.connect(send).connect(room)

      return fader
    }
  }
}

const envelope = ({
  attack,
  at,
  context,
  decay,
  peak,
  release,
  sustain,
  length
}: {
  attack: number
  at: number
  context: BaseAudioContext
  decay: number
  length: number
  peak: number
  release: number
  sustain: number
}): GainNode => {
  const gain = context.createGain()
  const held = Math.max(at + attack, at + length)

  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(peak, at + attack)
  gain.gain.setTargetAtTime(Math.max(peak * sustain, FLOOR), at + attack, decay)
  gain.gain.setTargetAtTime(0, held, release / 4)

  return gain
}

const endOf = (note: Note, release: number): number =>
  note.at + Math.max(note.length, 0.01) + release

const tone = ({
  context,
  detuneCents = 0,
  hertz,
  type
}: {
  context: BaseAudioContext
  detuneCents?: number
  hertz: number
  type: OscillatorType
}): OscillatorNode => {
  const oscillator = context.createOscillator()

  oscillator.type = type
  oscillator.frequency.value = hertz
  oscillator.detune.value = detuneCents

  return oscillator
}

/** A tine piano: two FM pairs, the bell of the tine fading into a round body. */
export const electricPiano = (note: Note): void => {
  const { at, context, midi, out, velocity } = note
  const hertz = hertzOf(midi)
  const release = 0.6
  const amp = envelope({
    at,
    attack: 0.006,
    context,
    decay: 0.9,
    length: note.length,
    peak: 0.22 * velocity,
    release,
    sustain: 0.25
  })
  const carrier = tone({ context, hertz, type: 'sine' })
  const modulator = tone({ context, hertz, type: 'sine' })
  const depth = context.createGain()
  const tine = tone({ context, hertz: hertz * 14, type: 'sine' })
  const tineDepth = context.createGain()

  depth.gain.setValueAtTime(hertz * 1.6 * velocity, at)
  depth.gain.setTargetAtTime(hertz * 0.25, at, 0.35)
  tineDepth.gain.setValueAtTime(hertz * 0.9, at)
  tineDepth.gain.setTargetAtTime(0, at, 0.03)
  modulator.connect(depth).connect(carrier.frequency)
  tine.connect(tineDepth).connect(carrier.frequency)
  carrier.connect(amp).connect(out)

  const end = endOf(note, release)

  for (const oscillator of [carrier, modulator, tine]) {
    oscillator.start(at)
    oscillator.stop(end)
  }
}

/** Two detuned saws behind a soft filter, swelling in and out slowly. */
export const warmPad = (note: Note & { brightness?: number }): void => {
  const { at, context, midi, out, velocity } = note
  const release = 2.2
  const amp = envelope({
    at,
    attack: 1.4,
    context,
    decay: 2,
    length: note.length,
    peak: 0.07 * velocity,
    release,
    sustain: 0.8
  })
  const filter = context.createBiquadFilter()
  const cutoff = 500 + 1_400 * (note.brightness ?? 0.5)

  filter.type = 'lowpass'
  filter.Q.value = 0.6
  filter.frequency.setValueAtTime(cutoff * 0.6, at)
  filter.frequency.linearRampToValueAtTime(cutoff, at + note.length * 0.6 + 0.5)
  filter.connect(amp).connect(out)

  const end = endOf(note, release)

  for (const detuneCents of [-9, 7]) {
    const oscillator = tone({
      context,
      detuneCents,
      hertz: hertzOf(midi),
      type: 'sawtooth'
    })

    oscillator.connect(filter)
    oscillator.start(at)
    oscillator.stop(end)
  }
}

/** A round upright-ish bass: a sine for the weight, a filtered triangle for the pluck. */
export const softBass = (note: Note): void => {
  const { at, context, midi, out, velocity } = note
  const release = 0.18
  const amp = envelope({
    at,
    attack: 0.01,
    context,
    decay: 0.5,
    length: note.length,
    peak: 0.32 * velocity,
    release,
    sustain: 0.45
  })
  const filter = context.createBiquadFilter()

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(900, at)
  filter.frequency.setTargetAtTime(280, at, 0.12)
  filter.connect(amp).connect(out)

  const end = endOf(note, release)

  for (const type of ['sine', 'triangle'] as const) {
    const oscillator = tone({ context, hertz: hertzOf(midi), type })

    oscillator.connect(filter)
    oscillator.start(at)
    oscillator.stop(end)
  }
}

/** A plucked synth string: a saw whose filter snaps shut. */
export const pluck = (note: Note & { brightness?: number }): void => {
  const { at, context, midi, out, velocity } = note
  const release = 0.25
  const amp = envelope({
    at,
    attack: 0.004,
    context,
    decay: 0.22,
    length: note.length,
    peak: 0.13 * velocity,
    release,
    sustain: 0.15
  })
  const filter = context.createBiquadFilter()
  const top = 1_800 + 3_200 * (note.brightness ?? 0.5)

  filter.type = 'lowpass'
  filter.Q.value = 3
  filter.frequency.setValueAtTime(top, at)
  filter.frequency.setTargetAtTime(350, at, 0.09)
  filter.connect(amp).connect(out)

  const oscillator = tone({ context, hertz: hertzOf(midi), type: 'sawtooth' })

  oscillator.connect(filter)
  oscillator.start(at)
  oscillator.stop(endOf(note, release))
}

/** Wooden bars: the fundamental and the bright fourth partial that dies first. */
export const marimba = (note: Note): void => {
  const { at, context, midi, out, velocity } = note
  const hertz = hertzOf(midi)
  const body = context.createGain()
  const strike = context.createGain()
  const end = at + 1

  body.gain.setValueAtTime(0, at)
  body.gain.linearRampToValueAtTime(0.25 * velocity, at + 0.003)
  body.gain.setTargetAtTime(0, at + 0.003, 0.22)
  strike.gain.setValueAtTime(0, at)
  strike.gain.linearRampToValueAtTime(0.09 * velocity, at + 0.002)
  strike.gain.setTargetAtTime(0, at + 0.002, 0.03)
  body.connect(out)
  strike.connect(out)

  const fundamental = tone({ context, hertz, type: 'sine' })
  const partial = tone({ context, hertz: hertz * 3.93, type: 'sine' })

  fundamental.connect(body)
  partial.connect(strike)

  for (const oscillator of [fundamental, partial]) {
    oscillator.start(at)
    oscillator.stop(end)
  }
}

/** An FM bell with a long tail, for the notes that ring out over a drift. */
export const bell = (note: Note & { ring?: number }): void => {
  const { at, context, midi, out, velocity } = note
  const hertz = hertzOf(midi)
  const ring = note.ring ?? 2.5
  const amp = context.createGain()
  const carrier = tone({ context, hertz, type: 'sine' })
  const modulator = tone({ context, hertz: hertz * 3.5, type: 'sine' })
  const depth = context.createGain()
  const end = at + ring * 2.5

  amp.gain.setValueAtTime(0, at)
  amp.gain.linearRampToValueAtTime(0.11 * velocity, at + 0.005)
  amp.gain.setTargetAtTime(0, at + 0.005, ring / 2.2)
  depth.gain.setValueAtTime(hertz * 2, at)
  depth.gain.setTargetAtTime(hertz * 0.1, at, ring / 4)
  modulator.connect(depth).connect(carrier.frequency)
  carrier.connect(amp).connect(out)

  for (const oscillator of [carrier, modulator]) {
    oscillator.start(at)
    oscillator.stop(end)
  }
}

const burst = ({
  at,
  context,
  decay,
  filterHertz,
  filterType,
  out,
  peak,
  q = 0.8
}: {
  at: number
  context: BaseAudioContext
  decay: number
  filterHertz: number
  filterType: BiquadFilterType
  out: AudioNode
  peak: number
  q?: number
}): void => {
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const amp = context.createGain()

  source.buffer = noiseOf(context)
  source.loop = true
  filter.type = filterType
  filter.frequency.value = filterHertz
  filter.Q.value = q
  amp.gain.setValueAtTime(0, at)
  amp.gain.linearRampToValueAtTime(peak, at + 0.002)
  amp.gain.setTargetAtTime(0, at + 0.002, decay / 3)
  source.connect(filter).connect(amp).connect(out)
  source.start(at, Math.random() * 0.5)
  source.stop(at + decay * 2 + 0.05)
}

export type Hit = {
  at: number
  context: BaseAudioContext
  out: AudioNode
  velocity: number
}

/** A soft kick: a sine dropping into the floor. */
export const kick = ({ at, context, out, velocity }: Hit): void => {
  const oscillator = context.createOscillator()
  const amp = context.createGain()

  oscillator.frequency.setValueAtTime(110, at)
  oscillator.frequency.exponentialRampToValueAtTime(42, at + 0.14)
  amp.gain.setValueAtTime(0, at)
  amp.gain.linearRampToValueAtTime(0.5 * velocity, at + 0.004)
  amp.gain.setTargetAtTime(0, at + 0.004, 0.1)
  oscillator.connect(amp).connect(out)
  oscillator.start(at)
  oscillator.stop(at + 0.6)
}

export const snare = ({ at, context, out, velocity }: Hit): void => {
  burst({
    at,
    context,
    decay: 0.16,
    filterHertz: 1_900,
    filterType: 'bandpass',
    out,
    peak: 0.28 * velocity,
    q: 0.7
  })

  const body = context.createOscillator()
  const amp = context.createGain()

  body.type = 'triangle'
  body.frequency.setValueAtTime(190, at)
  body.frequency.exponentialRampToValueAtTime(140, at + 0.08)
  amp.gain.setValueAtTime(0, at)
  amp.gain.linearRampToValueAtTime(0.14 * velocity, at + 0.002)
  amp.gain.setTargetAtTime(0, at + 0.002, 0.04)
  body.connect(amp).connect(out)
  body.start(at)
  body.stop(at + 0.3)
}

export const hat = ({ at, context, out, velocity }: Hit): void => {
  burst({
    at,
    context,
    decay: 0.045,
    filterHertz: 7_500,
    filterType: 'highpass',
    out,
    peak: 0.12 * velocity
  })
}

/** A brush across a snare: a swish, slow in, rather than a crack. */
export const brush = ({ at, context, out, velocity }: Hit): void => {
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const amp = context.createGain()

  source.buffer = noiseOf(context)
  source.loop = true
  filter.type = 'bandpass'
  filter.frequency.value = 3_200
  filter.Q.value = 0.5
  amp.gain.setValueAtTime(0, at)
  amp.gain.linearRampToValueAtTime(0.07 * velocity, at + 0.05)
  amp.gain.setTargetAtTime(0, at + 0.05, 0.08)
  source.connect(filter).connect(amp).connect(out)
  source.start(at, Math.random() * 0.5)
  source.stop(at + 0.5)
}

export const shaker = ({ at, context, out, velocity }: Hit): void => {
  burst({
    at,
    context,
    decay: 0.07,
    filterHertz: 5_500,
    filterType: 'highpass',
    out,
    peak: 0.07 * velocity
  })
}

export const rim = ({ at, context, out, velocity }: Hit): void => {
  burst({
    at,
    context,
    decay: 0.035,
    filterHertz: 1_700,
    filterType: 'bandpass',
    out,
    peak: 0.3 * velocity,
    q: 6
  })
}

/**
 * A record's surface under a whole piece: the odd click over a faint hiss,
 * started once and stopped with the piece.
 */
export const vinyl = ({
  at,
  context,
  end,
  out,
  random
}: {
  at: number
  context: BaseAudioContext
  end: number
  out: AudioNode
  random: Random
}): void => {
  const seconds = 4
  const buffer = context.createBuffer(
    1,
    context.sampleRate * seconds,
    context.sampleRate
  )
  const samples = buffer.getChannelData(0)

  for (let index = 0; index < samples.length; index++) {
    const isClick = random() < 0.00018

    samples[index] =
      (random() * 2 - 1) * 0.012 + (isClick ? (random() * 2 - 1) * 0.6 : 0)
  }

  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const amp = context.createGain()

  source.buffer = buffer
  source.loop = true
  filter.type = 'bandpass'
  filter.frequency.value = 2_500
  filter.Q.value = 0.4
  amp.gain.setValueAtTime(0, at)
  amp.gain.linearRampToValueAtTime(0.5, at + 2)
  amp.gain.setValueAtTime(0.5, Math.max(at + 2, end - 2))
  amp.gain.linearRampToValueAtTime(0, end)
  source.connect(filter).connect(amp).connect(out)
  source.start(at)
  source.stop(end + 0.1)
}
