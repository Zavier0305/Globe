import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GlobeGL from 'react-globe.gl'

const NEW_PIN_WINDOW_MS = 60 * 1000
const DEFAULT_VIEW = { lat: 20, lng: 20, altitude: 2.2 }
const IDLE_RETURN_MS = 20 * 1000

function aggregateByCountry(points) {
  const map = new Map()
  for (const p of points) {
    const existing = map.get(p.country_code)
    if (existing) {
      existing.poses.push(p)
      if (p.created_at > existing.latest_created_at) {
        existing.latest_created_at = p.created_at
      }
    } else {
      map.set(p.country_code, {
        country_code: p.country_code,
        country_name: p.country_name,
        lat: p.lat,
        lng: p.lng,
        poses: [p],
        latest_created_at: p.created_at,
      })
    }
  }
  return Array.from(map.values())
}

export default function Globe({
  points,
  loading,
  errorMsg,
  onCountryClick,
  focusRequest,
}) {
  const globeRef = useRef()
  const [now, setNow] = useState(Date.now())
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const lastInteractionRef = useRef(Date.now())
  const idleReturnedRef = useRef(true)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    globeRef.current.pointOfView(DEFAULT_VIEW, 0)
    const controls = globeRef.current.controls()
    if (!controls) return
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4

    const markInteraction = () => {
      lastInteractionRef.current = Date.now()
      idleReturnedRef.current = false
      controls.autoRotate = false
    }
    controls.addEventListener('start', markInteraction)
    return () => controls.removeEventListener('start', markInteraction)
  }, [])

  // 一定時間操作がなければ自動回転と全体ビューに戻す(プロジェクター展示向け)
  useEffect(() => {
    const id = setInterval(() => {
      if (!globeRef.current) return
      const idleFor = Date.now() - lastInteractionRef.current
      if (idleFor > IDLE_RETURN_MS && !idleReturnedRef.current) {
        idleReturnedRef.current = true
        globeRef.current.pointOfView(DEFAULT_VIEW, 1500)
        const controls = globeRef.current.controls()
        if (controls) controls.autoRotate = true
      }
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const isNew = useCallback(
    (p) => now - new Date(p.latest_created_at).getTime() < NEW_PIN_WINDOW_MS,
    [now]
  )

  const countryPoints = useMemo(() => aggregateByCountry(points), [points])
  const newCountryPoints = countryPoints.filter(isNew)

  useEffect(() => {
    if (!globeRef.current || !focusRequest) return
    globeRef.current.pointOfView(
      { lat: focusRequest.lat, lng: focusRequest.lng, altitude: 1.4 },
      1200
    )
    lastInteractionRef.current = Date.now()
    idleReturnedRef.current = false
    const controls = globeRef.current.controls()
    if (controls) controls.autoRotate = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest])

  return (
    <>
      <GlobeGL
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="#040b1a"
        globeImageUrl="/textures/earth-night.jpg"
        bumpImageUrl="/textures/earth-topology.png"
        atmosphereColor="#22e6ff"
        atmosphereAltitude={0.22}
        pointsData={countryPoints}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(p) => (isNew(p) ? 0.14 : 0.03)}
        pointRadius={(p) => Math.min(0.35 + p.poses.length * 0.08, 1.1)}
        pointColor={(p) => (isNew(p) ? '#ff2d78' : '#22e6ff')}
        pointLabel={(p) =>
          `<div style="color:#fff;font-weight:bold">${p.country_name}(${p.poses.length}件)</div>`
        }
        pointsMerge={false}
        onPointClick={(p) => onCountryClick && onCountryClick(p)}
        ringsData={newCountryPoints}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => '#ff2d78'}
        ringMaxRadius={4}
        ringPropagationSpeed={2.5}
        ringRepeatPeriod={800}
      />

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 px-4 py-2 text-sm text-cyanbright backdrop-blur">
            読み込み中...
          </div>
        </div>
      )}

      {!loading && !errorMsg && points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8">
          <p className="rounded-xl bg-black/50 px-4 py-3 text-center text-sm text-gray-300 backdrop-blur">
            まだ投稿がありません。
            <br />
            下のボタンから最初のポーズを投稿しよう!
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-4">
          <p className="rounded-full bg-pinkbright/90 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg">
            {errorMsg}
          </p>
        </div>
      )}
    </>
  )
}
