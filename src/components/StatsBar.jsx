export default function StatsBar({ postCount, countryCount }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-4">
      <div className="pointer-events-auto flex gap-3 rounded-full bg-black/40 px-4 py-1 text-xs text-gray-200 backdrop-blur">
        <span>
          投稿数 <span className="font-bold text-pinkbright">{postCount}</span>
        </span>
        <span className="text-gray-500">|</span>
        <span>
          国数 <span className="font-bold text-cyanbright">{countryCount}</span>
        </span>
      </div>
    </div>
  )
}
