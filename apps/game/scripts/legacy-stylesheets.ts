import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { transform } from 'lightningcss'
import postcss, {
  AtRule,
  type Declaration,
  type Node,
  type Root,
  type Rule
} from 'postcss'

/**
 * Writes `name.legacy.css` beside every stylesheet the build emitted, for the
 * browsers `index.html` sends to it: a copy with no cascade layer, no
 * `oklch()` and no `color-mix()` over a token, none of which a Chrome before
 * 111 or a Safari before 16.2 can read. A browser before Chrome 99 drops every
 * `@layer` block whole, and every rule here sits in one — that was a TV
 * showing the error screen in Times on white.
 *
 * The modern stylesheets are not touched, so a current browser renders exactly
 * what it did.
 */

const GAME_ROOT = resolve(import.meta.dirname, '..')
const CLIENT_DIR = join(GAME_ROOT, 'dist')
const ASSETS_DIR = join(CLIENT_DIR, 'assets')
const LEGACY_SUFFIX = '.legacy.css'

const LEGACY_TARGETS = {
  chrome: 87 << 16,
  firefox: 78 << 16,
  safari: (14 << 16) | (1 << 8)
}

/** An id no element carries: each one lifts a selector by one id's weight. */
const LIFT = ':not(#\\#)'

const UNLAYERED = '<unlayered>'

/** The order `index.html` declares, read from the shell so it has one author. */
const readLayerOrder = async (): Promise<string[]> => {
  const shell = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8')
  const statement = /@layer\s+([\w\s,-]+);/.exec(shell)

  if (statement?.[1] === undefined) {
    throw new Error('index.html declares no `@layer` order')
  }

  return [...statement[1].split(',').map((name) => name.trim()), UNLAYERED]
}

/** Splits on what sits outside every bracket, parenthesis and string. */
const splitTopLevel = (text: string, separator: string): string[] => {
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''

  for (const character of text) {
    if (quote !== null) {
      quote = character === quote ? null : quote
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === '(' || character === '[') {
      depth++
    } else if (character === ')' || character === ']') {
      depth--
    } else if (character === separator && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  return [...parts, current.trim()]
}

const idsIn = (selector: string): number =>
  selector.replace(/\[[^\]]*\]/g, '').match(/#[\w\\-]/g)?.length ?? 0

const PSEUDO_ELEMENT = /::|:(?:before|after|first-line|first-letter)\b/

/** Before a pseudo-element, which has to end its selector. */
const lifted = (selector: string, times: number): string => {
  const lifts = LIFT.repeat(times)
  const pseudoElement = PSEUDO_ELEMENT.exec(selector)

  return pseudoElement === null
    ? `${selector}${lifts}`
    : `${selector.slice(0, pseudoElement.index)}${lifts}${selector.slice(pseudoElement.index)}`
}

const layerAbove = (node: Node['parent']): string => {
  if (node === undefined) {
    return UNLAYERED
  }

  if (node instanceof AtRule && node.name === 'layer') {
    return node.params.trim()
  }

  return layerAbove(node.parent)
}

const layerOf = (rule: Rule): string => layerAbove(rule.parent)

const isInsideKeyframes = (rule: Rule): boolean =>
  rule.parent instanceof AtRule && rule.parent.name.endsWith('keyframes')

const styleRules = (root: Root): Rule[] => {
  const rules: Rule[] = []

  root.walkRules((rule) => {
    foldIndividualTransforms(rule)

    if (!isInsideKeyframes(rule)) {
      rules.push(rule)
    }
  })

  return rules
}

/** The blocks unwrapped in place, their order kept; the statements dropped. */
const unwrapLayers = (root: Root): void => {
  root.walkAtRules('layer', (atRule) => {
    if (atRule.nodes === undefined) {
      atRule.remove()
    } else {
      atRule.replaceWith(atRule.nodes)
    }
  })
}

const INDIVIDUAL_TRANSFORMS = ['translate', 'rotate', 'scale'] as const

const transformFunctionFor = (
  property: (typeof INDIVIDUAL_TRANSFORMS)[number],
  value: string
): string => {
  const parts = splitTopLevel(value.trim(), ' ').filter(Boolean)

  if (property === 'rotate') {
    return `rotate(${value.trim()})`
  }

  return `${property}${parts.length === 3 ? '3d' : ''}(${parts.join(', ')})`
}

/**
 * Folds `translate`, `rotate` and `scale` into `transform`, in the order the
 * browser applies them, for a Chrome before 104: the skip link sat in view
 * over the wordmark on every page, its `translate` off screen ignored.
 */
const foldIndividualTransforms = (rule: Rule): void => {
  const individual = rule.nodes.filter(
    (node): node is Declaration =>
      node.type === 'decl' &&
      INDIVIDUAL_TRANSFORMS.some((property) => property === node.prop)
  )

  if (individual.length === 0) {
    return
  }

  const functions = INDIVIDUAL_TRANSFORMS.flatMap((property) => {
    const declaration = individual.findLast((node) => node.prop === property)

    return declaration === undefined || declaration.value.trim() === 'none'
      ? []
      : [transformFunctionFor(property, declaration.value)]
  })
  const existing = rule.nodes.findLast(
    (node): node is Declaration =>
      node.type === 'decl' && node.prop === 'transform'
  )
  const rest =
    existing === undefined || existing.value.trim() === 'none'
      ? []
      : [existing.value]
  const value = [...functions, ...rest].join(' ') || 'none'

  for (const declaration of individual) {
    declaration.remove()
  }

  if (existing === undefined) {
    rule.append({ prop: 'transform', value })
  } else {
    existing.value = value
  }
}

/**
 * Picks the larger share of a `color-mix()` over a token, which no legacy
 * browser computes and no build can: a rule mixed at 14% ink reads as the
 * card it sits on, a fill at 60% as the ink.
 */
const collapseTokenMixes = (css: string): string => {
  const opening = 'color-mix('
  const start = css.indexOf(opening)

  if (start === -1) {
    return css
  }

  let depth = 0
  let end = start

  for (; end < css.length; end++) {
    if (css[end] === '(') depth++
    if (css[end] === ')' && --depth === 0) break
  }

  const inner = css.slice(start + opening.length, end)
  const replacement = inner.includes('var(')
    ? dominantColour(inner)
    : css.slice(start, end + 1)

  return `${css.slice(0, start)}${replacement}${collapseTokenMixes(css.slice(end + 1))}`
}

const SHARE = /\s+(\d+(?:\.\d+)?)%$/

const dominantColour = (inner: string): string => {
  const [, first = '', second = ''] = splitTopLevel(inner, ',')
  const firstShare = SHARE.exec(first)?.[1]
  const secondShare = SHARE.exec(second)?.[1]
  const firstPercent =
    firstShare !== undefined
      ? Number(firstShare)
      : secondShare !== undefined
        ? 100 - Number(secondShare)
        : 50

  return (firstPercent >= 50 ? first : second).replace(SHARE, '')
}

const stylesheets = (await readdir(ASSETS_DIR)).filter(
  (file) => file.endsWith('.css') && !file.endsWith(LEGACY_SUFFIX)
)
const layerOrder = await readLayerOrder()

const sheets = await Promise.all(
  stylesheets.map(async (file) => ({
    file,
    root: postcss.parse(await readFile(join(ASSETS_DIR, file), 'utf8'))
  }))
)

const mostIdsByLayer = new Map<string, number>()

for (const { root } of sheets) {
  for (const rule of styleRules(root)) {
    const layer = layerOf(rule)

    if (!layerOrder.includes(layer)) {
      throw new Error(`Layer \`${layer}\` is missing from index.html's order`)
    }

    const most = Math.max(
      mostIdsByLayer.get(layer) ?? 0,
      ...splitTopLevel(rule.selector, ',').map(idsIn)
    )

    mostIdsByLayer.set(layer, most)
  }
}

/** Each layer clears the most ids any selector of the layer below carries. */
const liftByLayer = new Map<string, number>()

layerOrder.reduce((lift, layer) => {
  liftByLayer.set(layer, lift)

  return lift + (mostIdsByLayer.get(layer) ?? 0) + 1
}, 0)

for (const { file, root } of sheets) {
  for (const rule of styleRules(root)) {
    const lift = liftByLayer.get(layerOf(rule)) ?? 0

    if (lift > 0) {
      rule.selector = splitTopLevel(rule.selector, ',')
        .map((selector) => lifted(selector, lift))
        .join(',')
    }
  }

  unwrapLayers(root)

  const { code } = transform({
    code: Buffer.from(collapseTokenMixes(root.toString())),
    filename: file,
    minify: true,
    targets: LEGACY_TARGETS
  })

  await writeFile(join(ASSETS_DIR, file.replace(/\.css$/, LEGACY_SUFFIX)), code)
}

console.info(
  `wrote ${stylesheets.length} legacy stylesheets, layers lifted by ${JSON.stringify(Object.fromEntries(liftByLayer))}`
)
