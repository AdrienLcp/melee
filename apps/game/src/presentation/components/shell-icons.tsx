import { type LucideIcon, type LucideProps, Menu } from 'lucide-react'
import type React from 'react'

/**
 * The family every glyph is drawn in, so none arrives in someone else's
 * weight: `1.25em`, and 3.5 units of stroke on the 24-unit grid — the stem
 * weight of the display face's heaviest cut. Lucide's 2-unit round hairline
 * read as another product beside lettering this heavy. Butt caps and miter
 * joins because nothing here is round but the buzzer.
 *
 * Decorative: a glyph sits beside the word, or its control carries the name.
 */
export const FAMILY = {
  'aria-hidden': true,
  focusable: false,
  size: '1.25em',
  strokeLinecap: 'butt',
  strokeLinejoin: 'miter',
  strokeWidth: 3.5
} as const satisfies LucideProps

/** A Lucide glyph drawn in the family, `overrides` laid over it. */
export const inFamily =
  (Glyph: LucideIcon, overrides: LucideProps = {}): React.FC<LucideProps> =>
  (props) => <Glyph {...FAMILY} {...overrides} {...props} />

/**
 * The one glyph the shell draws on every page. It lives apart from
 * `icons.tsx` because a module lands whole in the entry chunk once the shell
 * imports it, and every glyph of every game would ride along.
 */
export const MenuIcon = inFamily(Menu, {
  className: 'menu-icon',
  strokeLinecap: 'round',
  strokeWidth: 2.6
})
