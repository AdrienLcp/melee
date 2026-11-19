import type React from 'react'

import { useIsCrashRehearsalAsked } from '@/infrastructure/router/navigation'

/**
 * Throws on `?crash` outside production, so the error screen can be looked at
 * on staging without waiting for a real bug.
 */
export const CrashRehearsal: React.FC = () => {
  if (useIsCrashRehearsalAsked()) {
    throw new Error('Crash rehearsed with ?crash')
  }

  return null
}
