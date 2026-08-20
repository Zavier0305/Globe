import { useTranslation } from '../lib/i18n/LanguageContext.jsx'

export default function StatsBar({ postCount, countryCount, onOpenFlags }) {
  const { t } = useTranslation()
  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-4">
      <button
        type="button"
        onClick={onOpenFlags}
        className="pointer-events-auto flex gap-3 rounded-full border border-line bg-white/90 px-4 py-1 text-xs text-inkmuted shadow-sm backdrop-blur"
      >
        <span>
          {t('app.postCount')} <span className="font-bold text-accent">{postCount}</span>
        </span>
        <span className="text-line">|</span>
        <span>
          {t('app.countryCount')} <span className="font-bold text-accent">{countryCount}</span>
        </span>
      </button>
    </div>
  )
}
