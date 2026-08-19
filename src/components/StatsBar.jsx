export default function StatsBar({ postCount, countryCount, onOpenFlags }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-4">
      <button
        type="button"
        onClick={onOpenFlags}
        className="pointer-events-auto flex gap-3 rounded-full border border-line bg-white/90 px-4 py-1 text-xs text-inkmuted shadow-sm backdrop-blur"
      >
        <span>
          投稿数 <span className="font-bold text-accent">{postCount}</span>
        </span>
        <span className="text-line">|</span>
        <span>
          国数 <span className="font-bold text-accent">{countryCount}</span>
        </span>
      </button>
    </div>
  )
}
