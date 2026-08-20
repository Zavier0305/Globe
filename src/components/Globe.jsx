import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GlobeGL from 'react-globe.gl'
import { useTranslation } from '../lib/i18n/LanguageContext.jsx'

const NEW_PIN_WINDOW_MS = 60 * 1000
const DEFAULT_VIEW = { lat: 20, lng: 20, altitude: 2.2 }
const IDLE_RETURN_MS = 20 * 1000
const OVERVIEW_HOLD_MS = 8 * 1000
const TOUR_HOLD_MS = 4 * 1000

function aggregateByCountry(points) {
  const map = new Map()
  for (const p of points) {
    const existing = map.get(p.country_code)
    if (existing) {
      existing.poses.push(p)
      if (p.created_at > existing.latest_created_at) {
        existing.latest_created_at = p.created_at
        existing.image_url = p.image_url
      }
    } else {
      map.set(p.country_code, {
        country_code: p.country_code,
        country_name: p.country_name,
        lat: p.lat,
        lng: p.lng,
        poses: [p],
        image_url: p.image_url,
        latest_created_at: p.created_at,
      })
    }
  }
  return Array.from(map.values())
}

// 地球儀に直接浮かべる写真パネル(DOM要素なのでCSSでホバー演出できる)
function createPhotoPanel(d, onClick) {
  const el = document.createElement('div')
  el.className = 'globe-photo'
  el.title = `${d.country_name}(${d.poses.length}件)`

  const img = document.createElement('img')
  img.src = d.image_url
  img.alt = d.country_name
  img.loading = 'lazy'
  el.appendChild(img)

  if (d.poses.length > 1) {
    const badge = document.createElement('span')
    badge.className = 'globe-photo-badge'
    badge.textContent = d.poses.length
    el.appendChild(badge)
  }

  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onClick(d)
  })
  return el
}

// スポットの位置ピン(タップするとそのスポットへの投稿を開始できる)
function createSpotPin(d, onClick, title) {
  const el = document.createElement('div')
  el.className = 'globe-spot-pin'
  el.title = title || d.name

  const dot = document.createElement('span')
  dot.className = 'globe-spot-pin-dot'
  dot.textContent = '📍'
  el.appendChild(dot)

  const label = document.createElement('span')
  label.className = 'globe-spot-pin-label'
  label.textContent = d.name
  el.appendChild(label)

  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onClick(d)
  })
  return el
}

// 現在地ピン(タップ不可、国名ラベルを常に表示する)
function createGeoPin(d) {
  const el = document.createElement('div')
  el.className = 'globe-geo-pin'
  el.title = d.label

  const dot = document.createElement('span')
  dot.className = 'globe-geo-pin-dot'
  el.appendChild(dot)

  const label = document.createElement('span')
  label.className = 'globe-geo-pin-label'
  label.textContent = d.label
  el.appendChild(label)

  return el
}

export default function Globe({
  points,
  loading,
  errorMsg,
  onCountryClick,
  spotPoints = [],
  onSpotClick,
  myLocationPoint = null,
  focusRequest,
  showOverlays = true,
}) {
  const { t } = useTranslation()
  const globeRef = useRef()
  const containerRef = useRef(null)
  const [now, setNow] = useState(Date.now())
  const [size, setSize] = useState({ width: 0, height: 0 })
  const lastInteractionRef = useRef(Date.now())
  const idleReturnedRef = useRef(true)
  const tourStateRef = useRef({
    phase: 'overview',
    phaseStartedAt: Date.now(),
    tourIndex: 0,
  })
  const countryPointsRef = useRef([])
  const onCountryClickRef = useRef(onCountryClick)

  useEffect(() => {
    onCountryClickRef.current = onCountryClick
  }, [onCountryClick])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // 親要素のサイズに追従する(メイン画面では全画面、スポットページでは一部だけ使う)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    globeRef.current.pointOfView(DEFAULT_VIEW, 0)
    const controls = globeRef.current.controls()
    if (!controls) return
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4
    // 慣性を効かせて、指を離したあとにすっと止まる操作感にする
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.6
    controls.zoomSpeed = 0.8
    controls.minDistance = 160
    controls.maxDistance = 600

    const markInteraction = () => {
      lastInteractionRef.current = Date.now()
      idleReturnedRef.current = false
      controls.autoRotate = false
    }
    controls.addEventListener('start', markInteraction)
    return () => controls.removeEventListener('start', markInteraction)
  }, [])

  // 一定時間操作がなければ、全体ビュー(自動回転)と各国の自動巡回を交互に行う
  useEffect(() => {
    const id = setInterval(() => {
      if (!globeRef.current) return
      const controls = globeRef.current.controls()
      const idleFor = Date.now() - lastInteractionRef.current
      if (idleFor <= IDLE_RETURN_MS) return

      if (!idleReturnedRef.current) {
        idleReturnedRef.current = true
        globeRef.current.pointOfView(DEFAULT_VIEW, 1500)
        if (controls) controls.autoRotate = true
        tourStateRef.current = {
          phase: 'overview',
          phaseStartedAt: Date.now(),
          tourIndex: 0,
        }
        return
      }

      const state = tourStateRef.current
      const elapsed = Date.now() - state.phaseStartedAt
      const targets = countryPointsRef.current

      if (state.phase === 'overview') {
        if (elapsed > OVERVIEW_HOLD_MS && targets.length > 0) {
          if (controls) controls.autoRotate = false
          const target = targets[0]
          globeRef.current.pointOfView(
            { lat: target.lat, lng: target.lng, altitude: 1.3 },
            1800
          )
          tourStateRef.current = {
            phase: 'touring',
            phaseStartedAt: Date.now(),
            tourIndex: 0,
          }
        }
      } else if (state.phase === 'touring' && elapsed > TOUR_HOLD_MS) {
        const next = state.tourIndex + 1
        if (next >= targets.length) {
          if (controls) controls.autoRotate = true
          globeRef.current.pointOfView(DEFAULT_VIEW, 1800)
          tourStateRef.current = {
            phase: 'overview',
            phaseStartedAt: Date.now(),
            tourIndex: 0,
          }
        } else {
          const target = targets[next]
          globeRef.current.pointOfView(
            { lat: target.lat, lng: target.lng, altitude: 1.3 },
            1800
          )
          tourStateRef.current = {
            phase: 'touring',
            phaseStartedAt: Date.now(),
            tourIndex: next,
          }
        }
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
    countryPointsRef.current = countryPoints
  }, [countryPoints])

  useEffect(() => {
    if (!globeRef.current || !focusRequest) return
    globeRef.current.pointOfView(
      { lat: focusRequest.lat, lng: focusRequest.lng, altitude: 1.3 },
      1400
    )
    lastInteractionRef.current = Date.now()
    idleReturnedRef.current = false
    const controls = globeRef.current.controls()
    if (controls) controls.autoRotate = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest])

  const handlePanelClick = useCallback((d) => {
    onCountryClickRef.current && onCountryClickRef.current(d)
  }, [])

  const onSpotClickRef = useRef(onSpotClick)
  useEffect(() => {
    onSpotClickRef.current = onSpotClick
  }, [onSpotClick])
  const handleSpotClick = useCallback((d) => {
    onSpotClickRef.current && onSpotClickRef.current(d)
  }, [])

  // 写真パネル・スポットピン・現在地ピンを1つのHTMLレイヤーにまとめる
  // (react-globe.glのhtmlElementsDataは1系統しか持てないため、__typeで振り分ける)
  const htmlPoints = useMemo(() => {
    const photo = countryPoints.map((p) => ({ ...p, __type: 'photo' }))
    const spots = (spotPoints || []).map((s) => ({ ...s, __type: 'spot' }))
    const geo = myLocationPoint
      ? [{ ...myLocationPoint, __type: 'geo' }]
      : []
    return [...photo, ...spots, ...geo]
  }, [countryPoints, spotPoints, myLocationPoint])

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {size.width > 0 && (
        <GlobeGL
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/textures/earth-blue-marble.jpg"
          bumpImageUrl="/textures/earth-topology.png"
          atmosphereColor="#2563eb"
          atmosphereAltitude={0.22}
          /* 国ごとの写真パネル・スポットピン・現在地ピン */
          htmlElementsData={htmlPoints}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={(d) =>
            d.__type === 'spot' ? 0.1 : d.__type === 'geo' ? 0.12 : isNew(d) ? 0.14 : 0.06
          }
          htmlElement={(d) => {
            if (d.__type === 'spot') return createSpotPin(d, handleSpotClick, t('globe.spotPinTitle'))
            if (d.__type === 'geo') return createGeoPin(d)
            return createPhotoPanel(d, handlePanelClick)
          }}
          /* 足元の点で位置を明確にする */
          pointsData={countryPoints}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={0.005}
          pointRadius={(d) => Math.min(0.22 + d.poses.length * 0.05, 0.7)}
          pointColor={(d) => (isNew(d) ? '#1d4ed8' : '#2563eb')}
          pointsMerge={false}
          /* 新着国から広がる波紋 */
          ringsData={newCountryPoints}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (frac) => `rgba(29,78,216,${1 - frac})`}
          ringMaxRadius={5}
          ringPropagationSpeed={2.5}
          ringRepeatPeriod={700}
        />
      )}

      {showOverlays && loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-line bg-white/90 px-4 py-2 text-sm text-accent shadow-sm backdrop-blur">
            {t('app.loading')}
          </div>
        </div>
      )}

      {showOverlays && !loading && !errorMsg && points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8">
          <p className="rounded-xl border border-line bg-white/90 px-4 py-3 text-center text-sm text-inkmuted shadow-sm backdrop-blur">
            {t('app.emptyLine1')}
            <br />
            {t('app.emptyLine2')}
          </p>
        </div>
      )}

      {showOverlays && errorMsg && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-4">
          <p className="rounded-full bg-accent px-4 py-2 text-center text-xs font-semibold text-white shadow-lg">
            {t(`error.${errorMsg}`)}
          </p>
        </div>
      )}
    </div>
  )
}
