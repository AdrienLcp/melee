import type React from 'react'
import {
  composeRenderProps,
  Button as ReactAriaButton,
  type ButtonProps as ReactAriaButtonProps
} from 'react-aria-components'

import { type ControlAppearance, controlClassName } from './control-appearance'
import { wrapLabelText } from './control-label'
import { Spinner } from './spinner'

import './button.sass'

type ButtonProps = ReactAriaButtonProps &
  ControlAppearance & {
    /**
     * A glyph after the label, in a slot the pending spinner takes over at the
     * same size: the label stays readable and nothing moves when the press
     * lands. Without one, a pending button blanks its label under the spinner.
     */
    icon?: React.ReactNode
  }

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  icon,
  size,
  variant,
  ...props
}) => (
  <ReactAriaButton
    {...props}
    className={controlClassName({
      className,
      rootClassName: 'button',
      size,
      variant
    })}
  >
    {composeRenderProps(children, (resolved, { isPending }) => (
      <>
        {wrapLabelText(resolved)}
        {icon === undefined ? (
          isPending && <Spinner />
        ) : (
          <span className='control-icon'>{isPending ? <Spinner /> : icon}</span>
        )}
      </>
    ))}
  </ReactAriaButton>
)
