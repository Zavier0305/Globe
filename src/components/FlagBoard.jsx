import { COUNTRIES, countryDisplayName } from '../lib/countries'
import { flagEmoji } from '../lib/flag'
import { useTranslation } from '../lib/i18n/LanguageContext.jsx'

export default function FlagBoard({ points, onClose, onSelectCountry }) {
  const { t, lang } = useTranslation()
  const activeCodes = new Set(points.map((p) => p.country_code))
  const activeCount = COUNTRIES.filter((c) => activeCodes.has(c.code)).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-lg font-bold text-ink">
            {t('flagBoard.title')}
            <span className="ml-2 text-sm font-normal text-accent">
              {activeCount} / {COUNTRIES.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surfacemuted text-xl text-ink"
            aria-label={t('app.close')}
          >
            ×
          </button>
        </div>
        <div className="grid max-h-[65vh] grid-cols-5 gap-2 overflow-y-auto p-4">
          {COUNTRIES.map((c) => {
            const active = activeCodes.has(c.code)
            const name = countryDisplayName(c, lang, c.name_ja)
            return (
              <button
                key={c.code}
                type="button"
                disabled={!active}
                onClick={() => onSelectCountry(c)}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-opacity ${
                  active ? 'bg-accentsoft' : 'opacity-30 grayscale'
                }`}
                title={name}
              >
                <span className="text-2xl">{flagEmoji(c.code)}</span>
                <span className="text-[10px] leading-tight text-inkmuted">
                  {name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
