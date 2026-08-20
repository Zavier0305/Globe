import { useTranslation } from '../lib/i18n/LanguageContext.jsx'

export default function CountryGallery({ countryPoint, onClose, onSelectPose }) {
  const { t } = useTranslation()
  if (!countryPoint) return null

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
            {countryPoint.country_name}
            <span className="ml-2 text-sm font-normal text-accent">
              {countryPoint.poses.length}{t('gallery.postsSuffix')}
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
        <div className="grid max-h-[65vh] grid-cols-3 gap-2 overflow-y-auto p-4">
          {countryPoint.poses.map((pose) => (
            <button
              key={pose.id}
              type="button"
              onClick={() => onSelectPose(pose)}
              className="relative aspect-square overflow-hidden rounded-lg bg-surfacemuted"
            >
              <img
                src={pose.thumbnail_url || pose.image_url}
                alt={pose.country_name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {pose.message && (
                <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs shadow">
                  💬
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
