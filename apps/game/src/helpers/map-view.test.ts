import { describe, expect, it } from 'vitest'

import {
  clampedView,
  fittedView,
  framedOn,
  MAX_ZOOM,
  pannedBy,
  pinched,
  toMap,
  toScreen,
  zoomedAround
} from './map-view'

const map = { height: 500, width: 1000 }
const portrait = { height: 800, width: 400 }

describe('map view', () => {
  it('[map] fits the whole world across a portrait frame, centred on its height', () => {
    expect(fittedView({ frame: portrait, map })).toEqual({
      scale: 0.4,
      x: 0,
      y: 300
    })
  })

  it('[map] keeps the map point under the finger while zooming', () => {
    const view = fittedView({ frame: portrait, map })
    const focus = [200, 400] as const
    const zoomed = zoomedAround({
      factor: 4,
      focus,
      frame: portrait,
      map,
      view
    })

    expect(toScreen(zoomed, toMap(view, focus))).toEqual(focus)
    expect(zoomed.scale).toBe(1.6)
  })

  it('[map] never zooms out past the whole world, nor in past the deepest zoom', () => {
    const view = fittedView({ frame: portrait, map })
    const focus = [200, 400] as const

    expect(
      zoomedAround({ factor: 0.1, focus, frame: portrait, map, view }).scale
    ).toBe(0.4)
    expect(
      zoomedAround({ factor: 1000, focus, frame: portrait, map, view }).scale
    ).toBe(0.4 * MAX_ZOOM)
  })

  it('[map] stops a pan where the map edge meets the frame edge', () => {
    const view = clampedView({
      frame: portrait,
      map,
      view: { scale: 2, x: -100, y: -100 }
    })

    expect(pannedBy({ by: [500, -5000], frame: portrait, map, view })).toEqual({
      scale: 2,
      x: 0,
      y: 800 - 1000
    })
  })

  it('[map] keeps a map shorter than the frame inside it, wherever it is panned', () => {
    const view = fittedView({ frame: portrait, map })

    expect(pannedBy({ by: [0, 120], frame: portrait, map, view }).y).toBe(420)
    expect(pannedBy({ by: [0, 5000], frame: portrait, map, view }).y).toBe(600)
    expect(pannedBy({ by: [0, -5000], frame: portrait, map, view }).y).toBe(0)
  })

  it('[map] keeps the point under the finger off the middle of a portrait frame', () => {
    const view = fittedView({ frame: portrait, map })
    const focus = [200, 330] as const
    const zoomed = zoomedAround({
      factor: 1.5,
      focus,
      frame: portrait,
      map,
      view
    })

    expect(toScreen(zoomed, toMap(view, focus))).toEqual(focus)
  })

  it('[map] keeps the point under the finger when the zoom hits its ceiling', () => {
    const view = { scale: 0.4 * (MAX_ZOOM - 1), x: -2000, y: -1000 }
    const focus = [120, 500] as const
    const zoomed = zoomedAround({
      factor: 4,
      focus,
      frame: portrait,
      map,
      view
    })

    expect(zoomed.scale).toBe(0.4 * MAX_ZOOM)
    const [x, y] = toScreen(zoomed, toMap(view, focus))
    expect(x).toBeCloseTo(focus[0])
    expect(y).toBeCloseTo(focus[1])
  })

  it('[map] follows two fingers spreading apart around their midpoint', () => {
    const view = fittedView({ frame: portrait, map })
    const from = [
      [150, 400],
      [250, 400]
    ] as const
    const to = [
      [100, 400],
      [300, 400]
    ] as const
    const result = pinched({ frame: portrait, from, map, to, view })

    expect(result.scale).toBe(0.8)
    expect(toScreen(result, toMap(view, [200, 400]))).toEqual([200, 400])
  })

  it('[map] frames a box in the middle of the frame, with room around it', () => {
    const box = { max: [600, 300], min: [500, 250] } as const
    const view = framedOn({ box, frame: portrait, map })
    const [left, top] = toScreen(view, box.min)
    const [right, bottom] = toScreen(view, box.max)

    expect((left + right) / 2).toBeCloseTo(portrait.width / 2)
    expect((top + bottom) / 2).toBeCloseTo(portrait.height / 2)
    expect(right - left).toBeCloseTo(portrait.width * 0.7)
  })

  it('[map] frames a point no deeper than the zoom allows', () => {
    const view = framedOn({
      box: { max: [500, 250], min: [500, 250] },
      frame: portrait,
      map
    })

    expect(view.scale).toBe(
      fittedView({ frame: portrait, map }).scale * MAX_ZOOM
    )
  })
})
