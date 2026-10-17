import { createThemePreferenceStore } from '@adrienlcp/theme-preference'

export const THEME_STORAGE_KEY = 'melee:theme'

/** Shared by the menu and by the Vite plugin that inlines the pre-paint script. */
export const themeStore = createThemePreferenceStore({
  storageKey: THEME_STORAGE_KEY
})
