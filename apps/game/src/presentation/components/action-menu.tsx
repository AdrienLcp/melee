import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Button,
  Menu,
  MenuItem,
  type MenuItemProps,
  type MenuProps,
  MenuTrigger,
  Popover,
  Separator
} from 'react-aria-components'

import { MoreIcon } from './icons'

import './action-menu.sass'

type ActionMenuProps = Omit<MenuProps<object>, 'aria-label' | 'children'> & {
  /** Names the trigger and the menu it opens; the trigger shows only a glyph. */
  'aria-label': string
  /** `ActionMenuItem`s, split into groups by `ActionMenuSeparator`. */
  children: React.ReactNode
  isDisabled?: boolean
}

/**
 * What can be done to one thing in a list, behind a `⋯` beside it, so the
 * press on the thing itself stays free to open it.
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  'aria-label': label,
  children,
  className,
  isDisabled,
  ...props
}) => (
  <MenuTrigger>
    <Button
      aria-label={label}
      className='action-menu-trigger'
      isDisabled={isDisabled}
    >
      <MoreIcon />
    </Button>
    <Popover className='action-menu-popover' placement='bottom end'>
      <Menu
        {...props}
        aria-label={label}
        className={composeClassName(className, 'action-menu')}
      >
        {children}
      </Menu>
    </Popover>
  </MenuTrigger>
)

type ActionMenuItemProps = Omit<MenuItemProps, 'children' | 'textValue'> & {
  children: string
  icon: React.ReactNode
  /** Takes something away: the item lights in the danger stamp when reached. */
  isDestructive?: boolean
}

export const ActionMenuItem: React.FC<ActionMenuItemProps> = ({
  children,
  className,
  icon,
  isDestructive,
  ...props
}) => (
  <MenuItem
    {...props}
    className={composeClassName(className, 'action-menu-item')}
    data-destructive={isDestructive || undefined}
    textValue={children}
  >
    {icon}
    <span>{children}</span>
  </MenuItem>
)

export const ActionMenuSeparator: React.FC = () => (
  <Separator className='action-menu-separator' />
)
