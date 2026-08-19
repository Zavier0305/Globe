export default function CountryGallery({ countryPoint, onClose, onSelectPose }) {
  if (!countryPoint) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-deepnavy shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-lg font-bold text-white">
            {countryPoint.country_name}
            <span className="ml-2 text-sm font-normal text-cyanbright">
              {countryPoint.poses.length}件の投稿
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white"
            aria-label="閉じる"
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
              className="aspect-square overflow-hidden rounded-lg bg-black/40"
            >
              <img
                src={pose.image_url}
                alt={pose.country_name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
