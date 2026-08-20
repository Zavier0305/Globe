import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../lib/i18n/LanguageContext.jsx'
import { LANGUAGES } from '../lib/i18n/translations.js'

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  useEffect(() => {
    function handleOutsideClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-line bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur"
        aria-label={t('language.label')}
        title={t('language.label')}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
      </button>
      {open && (
        <ul className="absolute left-1/2 top-full z-10 mt-1 w-36 -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surfacemuted ${
                  l.code === lang ? 'font-bold text-accent' : 'text-ink'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
