import { readFileSync } from 'node:fs'

type AffixRule = {
  add: string
  condition: RegExp
  strip: string
}

type AffixClass = {
  /** Whether a prefix and a suffix of classes both marked so combine on one stem. */
  combines: boolean
  kind: 'PFX' | 'SFX'
  rules: AffixRule[]
}

/** One line of a Hunspell `.dic`: the stem as written, its flags, and the morphology in brackets after it. */
export type HunspellEntry = {
  flags: string
  morphology: string
  stem: string
}

const EMPTY_AFFIX = '0'

const affixClassesOf = (affPath: string): Map<string, AffixClass> => {
  const classes = new Map<string, AffixClass>()

  for (const line of readFileSync(affPath, 'utf8').split(/\r?\n/)) {
    const [kind, flag, first = '', second = '', third = ''] = line
      .trim()
      .split(/\s+/)

    if ((kind !== 'PFX' && kind !== 'SFX') || flag === undefined) {
      continue
    }

    const held = classes.get(flag)

    if (held === undefined) {
      classes.set(flag, { combines: first === 'Y', kind, rules: [] })
      continue
    }

    const condition = third === '.' ? '' : third

    held.rules.push({
      add: second === EMPTY_AFFIX ? '' : second,
      condition: new RegExp(
        kind === 'SFX' ? `${condition}$` : `^${condition}`,
        'u'
      ),
      strip: first === EMPTY_AFFIX ? '' : first
    })
  }

  return classes
}

const suffixed = (stem: string, rule: AffixRule): string | null =>
  stem.endsWith(rule.strip) && rule.condition.test(stem)
    ? stem.slice(0, stem.length - rule.strip.length) + rule.add
    : null

const prefixed = (stem: string, rule: AffixRule): string | null =>
  stem.startsWith(rule.strip) && rule.condition.test(stem)
    ? rule.add + stem.slice(rule.strip.length)
    : null

/** Every line of a `.dic` after its count, split into stem, flags and morphology. */
export const hunspellEntriesOf = (dicPath: string): HunspellEntry[] =>
  readFileSync(dicPath, 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [word = '', morphology = ''] = line.split('\t')
      const slash = word.indexOf('/')

      return slash === -1
        ? { flags: '', morphology, stem: word }
        : {
            flags: word.slice(slash + 1),
            morphology,
            stem: word.slice(0, slash)
          }
    })

/**
 * A Hunspell dictionary unfolded into every form it accepts: each stem, each
 * suffix and prefix its flags allow, and a prefix on a suffixed form where
 * both classes say they combine. Single-character flags and one affix deep,
 * which is all the Portuguese dictionary uses.
 */
export const hunspellFormsOf = ({
  affPath,
  entries
}: {
  affPath: string
  entries: readonly HunspellEntry[]
}): Set<string> => {
  const classes = affixClassesOf(affPath)
  const forms = new Set<string>()

  for (const { flags, stem } of entries) {
    const owned = [...flags].flatMap((flag) => {
      const affixClass = classes.get(flag)

      return affixClass === undefined ? [] : [affixClass]
    })
    const suffixes = owned.filter(({ kind }) => kind === 'SFX')
    const prefixes = owned.filter(({ kind }) => kind === 'PFX')
    const withSuffix: { combines: boolean; form: string }[] = [
      { combines: true, form: stem }
    ]

    for (const suffix of suffixes) {
      for (const rule of suffix.rules) {
        const form = suffixed(stem, rule)

        if (form !== null) {
          withSuffix.push({ combines: suffix.combines, form })
        }
      }
    }

    for (const { form } of withSuffix) {
      forms.add(form)
    }

    for (const prefix of prefixes) {
      for (const rule of prefix.rules) {
        for (const { combines, form } of withSuffix) {
          const isStem = form === stem

          if (!isStem && !(combines && prefix.combines)) {
            continue
          }

          const withPrefix = prefixed(form, rule)

          if (withPrefix !== null) {
            forms.add(withPrefix)
          }
        }
      }
    }
  }

  return forms
}
