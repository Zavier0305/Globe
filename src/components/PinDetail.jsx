export default function PinDetail({ pose, onClose }) {
  if (!pose) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-full w-full max-w-md overflow-hidden rounded-2xl bg-deepnavy shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xl text-white"
          aria-label="閉じる"
        >
          ×
        </button>
        <img
          src={pose.image_url}
          alt={pose.country_name}
          className="max-h-[70vh] w-full object-contain bg-black"
        />
        <div className="px-4 py-3">
          <p className="text-lg font-bold text-cyanbright">{pose.country_name}</p>
          <p className="text-xs text-gray-400">
            {new Date(pose.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>
    </div>
  )
}
