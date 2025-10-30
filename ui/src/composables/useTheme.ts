import { ref, computed } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'
const mode = ref<ThemeMode>('system')
const isDark = ref(false)
let media: MediaQueryList | null = null

function applyHtmlClass(dark: boolean) {
  const el = document.documentElement
  if (!el) return
  if (dark) el.classList.add('dark')
  else el.classList.remove('dark')
}

function computeSystemDark() {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function handleSystemChange() {
  if (mode.value !== 'system') return
  const dark = computeSystemDark()
  isDark.value = dark
  applyHtmlClass(dark)
}

function initTheme() {
  // read saved preference
  const saved = (localStorage.getItem(STORAGE_KEY) || 'system') as ThemeMode
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    mode.value = saved
  } else {
    mode.value = 'system'
  }

  // set initial theme
  if (mode.value === 'system') {
    isDark.value = computeSystemDark()
  } else {
    isDark.value = mode.value === 'dark'
  }
  applyHtmlClass(isDark.value)

  // watch system changes only when following system
  if (typeof window !== 'undefined' && 'matchMedia' in window) {
    media = window.matchMedia('(prefers-color-scheme: dark)')
    // modern browsers
    if ((media as any).addEventListener) media.addEventListener('change', handleSystemChange)
    else if ((media as any).addListener) (media as any).addListener(handleSystemChange)
  }
}

function setMode(next: ThemeMode) {
  mode.value = next
  localStorage.setItem(STORAGE_KEY, next)
  if (next === 'system') {
    handleSystemChange()
  } else {
    isDark.value = next === 'dark'
    applyHtmlClass(isDark.value)
  }
}

const currentMode = computed(() => mode.value)
const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'))

export function useTheme() {
  return {
    currentMode,
    currentTheme,
    isDark,
    setMode,
    initTheme,
  }
}

