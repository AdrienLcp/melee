import type React from 'react'
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue
} from 'react-aria-components'

import { ChevronIcon } from '@/presentation/components/icons'

const ANY = '__any'

/**
 * A filter picked from a closed list — a report's kind, a browser — where a
 * strip would run past a narrow screen. react-aria's `Select` used bare here:
 * this page is the only one that needs it, and the design system wraps a
 * primitive on its second consumer.
 */
export const AdminSelect: React.FC<{
  /** What the empty choice says. */
  anyLabel: string
  label: string
  /** `undefined` is no filter. */
  onChange: (value: string | undefined) => void
  options: readonly string[]
  value: string | undefined
}> = ({ anyLabel, label, onChange, options, value }) => (
  <Select
    className='admin-select'
    onSelectionChange={(key) => {
      onChange(key === ANY || key === null ? undefined : String(key))
    }}
    selectedKey={value ?? ANY}
  >
    <Label>{label}</Label>
    <Button className='admin-select-button'>
      <SelectValue />
      <ChevronIcon aria-hidden />
    </Button>
    <Popover className='admin-select-popover'>
      <ListBox>
        <ListBoxItem id={ANY}>{anyLabel}</ListBoxItem>
        {options.map((option) => (
          <ListBoxItem id={option} key={option}>
            {option}
          </ListBoxItem>
        ))}
      </ListBox>
    </Popover>
  </Select>
)
