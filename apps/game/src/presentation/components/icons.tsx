import {
  ArrowLeftRight,
  ArrowRight,
  ArrowRightLeft,
  BellRing,
  Bookmark,
  CaseSensitive,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleQuestionMark,
  Copy,
  Dice5,
  Download,
  Earth,
  Ellipsis,
  Flame,
  Grid3x3,
  GripVertical,
  History,
  Hourglass,
  Lock,
  type LucideIcon,
  type LucideProps,
  Megaphone,
  Menu,
  Minus,
  MonitorPlay,
  Music,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  PanelsTopLeft,
  Pencil,
  PencilLine,
  PenLine,
  Plus,
  QrCode,
  Share,
  SlidersHorizontal,
  SquarePlus,
  Trophy,
  Tv,
  Upload,
  Users,
  X,
  Zap
} from 'lucide-react'
import type React from 'react'

import type { GameKind } from '@melee/protocol/game'

/**
 * The family every glyph is drawn in, so none arrives in someone else's
 * weight: `1.25em`, and 3.5 units of stroke on the 24-unit grid — the stem
 * weight of the display face's heaviest cut. Lucide's 2-unit round hairline
 * read as another product beside lettering this heavy. Butt caps and miter
 * joins because nothing here is round but the buzzer.
 *
 * Decorative: a glyph sits beside the word, or its control carries the name.
 */
const FAMILY = {
  'aria-hidden': true,
  focusable: false,
  size: '1.25em',
  strokeLinecap: 'butt',
  strokeLinejoin: 'miter',
  strokeWidth: 3.5
} as const satisfies LucideProps

const inFamily =
  (Glyph: LucideIcon, overrides: LucideProps = {}): React.FC<LucideProps> =>
  (props) => <Glyph {...FAMILY} {...overrides} {...props} />

export const AnnounceIcon = inFamily(Megaphone)
export const ArrowIcon = inFamily(ArrowRight)
export const CheckIcon = inFamily(Check)
export const ChevronIcon = inFamily(ChevronDown)
export const ChevronLeftIcon = inFamily(ChevronLeft)
export const ChevronRightIcon = inFamily(ChevronRight)
export const ChevronUpIcon = inFamily(ChevronUp)
export const ControlsIcon = inFamily(SlidersHorizontal)
export const CopyIcon = inFamily(Copy)
export const CrossIcon = inFamily(X)
export const LockIcon = inFamily(Lock)
export const MenuIcon = inFamily(Menu, {
  className: 'menu-icon',
  strokeLinecap: 'round',
  strokeWidth: 2.6
})
// Its pips are near-zero-length strokes, which a butt cap draws as nothing.
export const ExportIcon = inFamily(Download)
export const ImportIcon = inFamily(Upload)
export const DiceIcon = inFamily(Dice5, { strokeLinecap: 'square' })
export const GripIcon = inFamily(GripVertical)
export const InstallIcon = inFamily(SquarePlus)
export const MinusIcon = inFamily(Minus)
export const MoreIcon = inFamily(Ellipsis)
export const MoveIcon = inFamily(ArrowRightLeft)
export const PanelFoldIcon = inFamily(PanelRightClose)
export const PanelOpenIcon = inFamily(PanelRightOpen)
export const PanelSideIcon = inFamily(ArrowLeftRight)
export const PlayersIcon = inFamily(Users)
export const RenameIcon = inFamily(Pencil)
export const SavedIcon = inFamily(Bookmark)
export const PenIcon = inFamily(PenLine)
export const PlusIcon = inFamily(Plus)
export const QrCodeIcon = inFamily(QrCode)
export const ScreenIcon = inFamily(Tv)
export const StageIcon = inFamily(MonitorPlay)
export const TableIcon = inFamily(PanelsTopLeft)
export const ShareIcon = inFamily(Share)
export const WorldIcon = inFamily(Earth)

const GAME_GLYPHS = {
  atlas: Earth,
  blacksquare: Grid3x3,
  blindtest: Music,
  buzzer: BellRing,
  challenge: Trophy,
  innerclock: Hourglass,
  matchsticks: Flame,
  petitbac: CaseSensitive,
  quiz: CircleQuestionMark,
  reflex: Zap,
  slate: PencilLine,
  swatch: Palette,
  timeline: History
} as const satisfies Record<GameKind, LucideIcon>

type GameIconProps = {
  game: GameKind
}

/**
 * What a game is, in one glyph: the same one on its spine and on its box. It
 * stands beside display lettering at 0.8em, where the family's 3.5 units close
 * up the question mark's counter.
 */
export const GameIcon: React.FC<GameIconProps> = ({ game }) => {
  const Glyph = GAME_GLYPHS[game]

  return <Glyph {...FAMILY} className='game-icon' strokeWidth={2.75} />
}
