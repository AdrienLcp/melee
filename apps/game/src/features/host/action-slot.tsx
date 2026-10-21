import type React from 'react'
import { createContext, useContext } from 'react'

/**
 * Which of a phase's presses a place draws. The console draws them all in its
 * footer; the room's own screen splits them, the one the room is waiting on
 * bottom right and the rest in the drawer, from the same components.
 */
export type ActionSlot = 'all' | 'primary' | 'secondary'

const ActionSlotContext = createContext<ActionSlot>('all')

export const ActionSlotProvider = ActionSlotContext.Provider

export const useActionSlot = (): ActionSlot => useContext(ActionSlotContext)

/** The press the room is waiting on, and whatever says why it refuses. */
export const PrimaryPress: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (useActionSlot() === 'secondary' ? null : children)

/** Everything a phase offers besides the press the room is waiting on. */
export const SecondaryPresses: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (useActionSlot() === 'primary' ? null : children)
