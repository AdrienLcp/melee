/// <reference types="vite/client" />

/**
 * Passing a CSS custom property through `style` is the one legitimate use of
 * that prop here — see `.claude/rules/react-components.md`. React's own
 * `CSSProperties` has no room for arbitrary names, and widening it is what keeps
 * the alternative from being a cast.
 */
declare module 'react' {
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined
  }
}

declare global {
  /** Chromium's install prompt, fired before the browser offers its own. */
  interface BeforeInstallPromptEvent extends Event {
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    prompt: () => Promise<void>
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }

  interface Navigator {
    /** Safari on iOS, opened from the home screen. */
    readonly standalone?: boolean
  }
}

export {}
