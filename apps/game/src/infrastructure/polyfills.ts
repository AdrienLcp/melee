/**
 * The built-ins this app calls that a browser it supports may lack, defined
 * only where missing. Oxc lowers syntax to `build.target` and nothing else, so
 * a five-year-old TV running our JavaScript still threw on the first
 * `toSorted` and showed the error screen. Each entry names the first Chrome
 * and Safari that ship it; the list is what the built bundle calls, checked
 * against `docs/deploying.md`, _Browser support_.
 */

const defineMissing = (target: object, name: string, value: unknown): void => {
  if (name in target) {
    return
  }

  Object.defineProperty(target, name, {
    configurable: true,
    value,
    writable: true
  })
}

const relativeIndex = (index: number, length: number): number => {
  const whole = Math.trunc(index) || 0

  return whole >= 0 ? whole : length + whole
}

// Chrome 92, Safari 15.4.
const at = function (this: ArrayLike<unknown>, index: number): unknown {
  const position = relativeIndex(index, this.length)

  return position < 0 || position >= this.length ? undefined : this[position]
}

defineMissing(Array.prototype, 'at', at)
defineMissing(String.prototype, 'at', at)

// Chrome 97, Safari 15.4.
defineMissing(
  Array.prototype,
  'findLastIndex',
  function (
    this: unknown[],
    predicate: (value: unknown, index: number, array: unknown[]) => boolean,
    thisArg?: unknown
  ): number {
    for (let index = this.length - 1; index >= 0; index--) {
      if (predicate.call(thisArg, this[index], index, this)) {
        return index
      }
    }

    return -1
  }
)

defineMissing(
  Array.prototype,
  'findLast',
  function (
    this: unknown[],
    predicate: (value: unknown, index: number, array: unknown[]) => boolean,
    thisArg?: unknown
  ): unknown {
    for (let index = this.length - 1; index >= 0; index--) {
      if (predicate.call(thisArg, this[index], index, this)) {
        return this[index]
      }
    }

    return undefined
  }
)

// Chrome 110, Safari 16.
defineMissing(
  Array.prototype,
  'toSorted',
  function (
    this: ArrayLike<unknown>,
    compare?: (left: unknown, right: unknown) => number
  ): unknown[] {
    return Array.from(this).sort(compare)
  }
)

defineMissing(
  Array.prototype,
  'toReversed',
  function (this: ArrayLike<unknown>): unknown[] {
    return Array.from(this).reverse()
  }
)

defineMissing(
  Array.prototype,
  'toSpliced',
  function (
    this: ArrayLike<unknown>,
    ...args: [start?: number, deleteCount?: number, ...items: unknown[]]
  ): unknown[] {
    const copy = Array.from(this)
    const [start = 0, deleteCount = 0, ...items] = args

    // `splice(start)` and `splice(start, undefined)` differ: the first removes
    // everything from `start`, the second nothing.
    if (args.length === 1) {
      copy.splice(start)
    } else if (args.length > 1) {
      copy.splice(start, deleteCount, ...items)
    }

    return copy
  }
)

defineMissing(
  Array.prototype,
  'with',
  function (
    this: ArrayLike<unknown>,
    index: number,
    value: unknown
  ): unknown[] {
    const position = relativeIndex(index, this.length)

    if (position < 0 || position >= this.length) {
      throw new RangeError('Invalid index')
    }

    const copy = Array.from(this)

    copy[position] = value

    return copy
  }
)

// Chrome 93, Safari 15.4.
defineMissing(Object, 'hasOwn', (object: object, key: PropertyKey): boolean =>
  Object.hasOwn(object, key)
)

// Chrome 103, Safari 16.
defineMissing(AbortSignal, 'timeout', (delayMs: number): AbortSignal => {
  const controller = new AbortController()

  setTimeout(() => {
    controller.abort(new DOMException('signal timed out', 'TimeoutError'))
  }, delayMs)

  return controller.signal
})

// Chrome 120, Safari 17.
defineMissing(URL, 'canParse', (url: string, base?: string): boolean => {
  try {
    new URL(url, base)

    return true
  } catch {
    return false
  }
})

// Chrome 105, Safari 17.4.
defineMissing(
  Element.prototype,
  'checkVisibility',
  function (
    this: Element,
    options?: { visibilityProperty?: boolean }
  ): boolean {
    if (this.getClientRects().length === 0) {
      return false
    }

    return (
      options?.visibilityProperty !== true ||
      getComputedStyle(this).visibility === 'visible'
    )
  }
)
