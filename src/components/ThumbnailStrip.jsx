export default function ThumbnailStrip({ points, onSelect }) {
  if (points.length === 0) return null

  const latest = [...points]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 15)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 px-3">
      <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1">
        {latest.map((pose) => (
          <button
            key={pose.id}
            type="button"
            onClick={() => onSelect(pose)}
            className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-black/40 shadow-lg"
            title={pose.country_name}
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
  )
}
