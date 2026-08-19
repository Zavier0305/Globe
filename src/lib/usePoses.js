import { useEffect, useRef, useState } from 'react'
import { supabase, POSES_TABLE } from './supabaseClient'
import { findCountry } from './countries'
import { playNewPinSound } from './sound'

// この件数以上の通報が入った投稿は、管理者が対応するまで地球儀から一時的に隠す
export const REPORT_HIDE_THRESHOLD = 3

function toPoint(pose) {
  const country = findCountry(pose.country_code)
  if (!country) return null
  return {
    id: pose.id,
    lat: country.lat,
    lng: country.lng,
    country_code: pose.country_code,
    country_name: pose.country_name || country.name_ja,
    image_url: pose.image_url,
    message: pose.message || null,
    created_at: pose.created_at,
    report_count: pose.report_count || 0,
  }
}

function isVisible(point) {
  return point.report_count < REPORT_HIDE_THRESHOLD
}

export default function usePoses() {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const ownPostIds = useRef(new Set())

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from(POSES_TABLE)
        .select('*')
        .order('created_at', { ascending: true })
      if (!mounted) return
      if (error) {
        console.error('posesの取得に失敗しました', error)
        setErrorMsg('投稿の読み込みに失敗しました。通信環境を確認してください。')
        setLoading(false)
        return
      }
      setPoints(data.map(toPoint).filter(Boolean).filter(isVisible))
      setErrorMsg(null)
      setLoading(false)
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
          if (!ownPostIds.current.has(point.id)) {
            playNewPinSound()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: POSES_TABLE },
        (payload) => {
          setPoints((prev) => prev.filter((p) => p.id !== payload.old.id))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: POSES_TABLE },
        (payload) => {
          const point = toPoint(payload.new)
          if (!point) return
          setPoints((prev) => {
            if (!isVisible(point)) {
              return prev.filter((p) => p.id !== point.id)
            }
            return prev.map((p) => (p.id === point.id ? point : p))
          })
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setErrorMsg('リアルタイム更新に接続できませんでした。再読み込みしてください。')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function addOwnPose(pose) {
    const point = toPoint(pose)
    if (!point) return
    ownPostIds.current.add(point.id)
    setPoints((prev) => {
      if (prev.some((p) => p.id === point.id)) return prev
      return [...prev, point]
    })
  }

  function removePose(id) {
    setPoints((prev) => prev.filter((p) => p.id !== id))
  }

  return { points, loading, errorMsg, addOwnPose, removePose }
}
