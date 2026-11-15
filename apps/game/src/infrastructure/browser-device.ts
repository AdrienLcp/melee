import {
  prefersReducedMotion,
  visualViewportNow
} from '@/infrastructure/browser'

type UserAgentData = {
  brands: { brand: string; version: string }[]
  mobile: boolean
  platform: string
}

const isBrand = (value: unknown): value is UserAgentData['brands'][number] =>
  typeof value === 'object' &&
  value !== null &&
  'brand' in value &&
  typeof value.brand === 'string' &&
  'version' in value &&
  typeof value.version === 'string'

/** User-Agent Client Hints, which only Chromium engines expose, and only in a secure context. */
const userAgentDataNow = (): UserAgentData | null => {
  if (!('userAgentData' in navigator)) {
    return null
  }

  const data: unknown = navigator.userAgentData

  if (
    typeof data !== 'object' ||
    data === null ||
    !('brands' in data) ||
    !Array.isArray(data.brands) ||
    !('mobile' in data) ||
    !('platform' in data)
  ) {
    return null
  }

  return {
    brands: data.brands.filter(isBrand),
    mobile: data.mobile === true,
    platform: typeof data.platform === 'string' ? data.platform : ''
  }
}

/** `env(safe-area-inset-*)` as this page resolves it, read off a probe the layout never sees. */
const safeAreaNow = (): {
  bottom: number
  left: number
  right: number
  top: number
} | null => {
  if (document.body === null) {
    return null
  }

  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'
  document.body.append(probe)
  const style = getComputedStyle(probe)
  const insets = {
    bottom: Number.parseFloat(style.paddingBottom) || 0,
    left: Number.parseFloat(style.paddingLeft) || 0,
    right: Number.parseFloat(style.paddingRight) || 0,
    top: Number.parseFloat(style.paddingTop) || 0
  }
  probe.remove()

  return insets
}

/** What a report somebody sends says about the device, read at the press. */
export const describeDevice = () => ({
  colorScheme: matchMedia('(prefers-color-scheme: dark)').matches
    ? ('dark' as const)
    : ('light' as const),
  reducedMotion: prefersReducedMotion(),
  safeArea: safeAreaNow(),
  screen: {
    devicePixelRatio: window.devicePixelRatio || 1,
    height: screen.height,
    orientation: screen.orientation?.type ?? null,
    width: screen.width
  },
  userAgentData: userAgentDataNow(),
  visualViewport: visualViewportNow()
})
