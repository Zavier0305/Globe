import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translations, LANGUAGES, DEFAULT_LANG } from './translations.js'

const STORAGE_KEY = 'pose-app-lang'
const SUPPORTED = LANGUAGES.map((l) => l.code)

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED.includes(saved)) return saved
  } catch {
    // localStorageが使えない環境では無視してブラウザ言語判定に進む
  }
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('ja')) return 'ja'
  if (nav.startsWith('zh')) return 'zh-Hans'
  if (nav.startsWith('ko')) return 'ko'
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('en')) return 'en'
  return DEFAULT_LANG
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang)

  useEffect(() => {
    const dict = translations[lang]
    if (dict && dict['app.title']) document.title = dict['app.title']
  }, [lang])

  const setLang = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // 保存できなくても表示言語自体は切り替わるので無視する
    }
  }, [])

  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || translations[DEFAULT_LANG]
      let str = dict[key] ?? translations[DEFAULT_LANG][key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{{${k}}}`, v)
        }
      }
      return str
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useTranslation は LanguageProvider の内側で使ってください')
  }
  return ctx
}
