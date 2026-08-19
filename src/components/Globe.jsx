import { useCallback, useEffect, useRef, useState } from 'react'
import GlobeGL from 'react-globe.gl'
import { supabase, POSES_TABLE } from '../lib/supabaseClient'
import { findCountry } from '../lib/countries'

const NEW_PIN_WINDOW_MS = 60 * 1000

function toPoint(pose) {
  const country = findCountry(pose.country_code)
  if (!country) return null
  return {
    id: pose.id,
    lat: country.lat,
    lng: country.lng,
    country_name: pose.country_name || country.name_ja,
    country_code: pose.country_code,
    image_url: pose.image_url,
    created_at: pose.created_at,
  }
}

export default function Globe({ onPinClick }) {
  const globeRef = useRef()
  const [points, setPoints] = useState([])
  const [now, setNow] = useState(Date.now())
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data, error } = await supabase
        .from(POSES_TABLE)
        .select('*')
        .order('created_at', { ascending: true })
      if (error) {
        console.error('posesの取得に失敗しました', error)
        return
      }
      if (!mounted) return
      setPoints(data.map(toPoint).filter(Boolean))
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('poses-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: POSES_TABLE },
        (payload) => {
          const point = toPoint(payload.new)
          if (!point) return
          setPoints((prev) => {
            if (prev.some((p) => p.id === point.id)) return prev
            return [...prev, point]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
    globeRef.current.pointOfView({ lat: 20, lng: 20, altitude: 2.2 }, 0)
    const controls = globeRef.current.controls()
    if (controls) {
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.4
    }
  }, [])

  const isNew = useCallback(
    (p) => now - new Date(p.created_at).getTime() < NEW_PIN_WINDOW_MS,
    [now]
  )

  const newPoints = points.filter(isNew)

  return (
    <GlobeGL
      ref={globeRef}
      width={size.width}
      height={size.height}
      backgroundColor="#040b1a"
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      atmosphereColor="#22e6ff"
      atmosphereAltitude={0.22}
      pointsData={points}
      pointLat="lat"
      pointLng="lng"
      pointAltitude={(p) => (isNew(p) ? 0.14 : 0.03)}
      pointRadius={(p) => (isNew(p) ? 0.7 : 0.4)}
      pointColor={(p) => (isNew(p) ? '#ff2d78' : '#22e6ff')}
      pointLabel={(p) => `<div style="color:#fff;font-weight:bold">${p.country_name}</div>`}
      pointsMerge={false}
      onPointClick={(p) => onPinClick && onPinClick(p)}
      ringsData={newPoints}
      ringLat="lat"
      ringLng="lng"
      ringColor={() => '#ff2d78'}
      ringMaxRadius={4}
      ringPropagationSpeed={2.5}
      ringRepeatPeriod={800}
    />
  )
}
