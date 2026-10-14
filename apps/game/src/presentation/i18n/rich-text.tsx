import type React from 'react'
import { createElement, Fragment } from 'react'

type RichTextProps = {
  /** What `translate.rich` returned. */
  parts: readonly React.ReactNode[]
}

/** Spreads the parts as children, so React asks none of them for a key. */
export const RichText: React.FC<RichTextProps> = ({ parts }) =>
  createElement(Fragment, null, ...parts)
