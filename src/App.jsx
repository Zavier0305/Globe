import { useEffect, useMemo, useState } from 'react'
import Globe from './components/Globe.jsx'
import CaptureModal from './components/CaptureModal.jsx'
import PinDetail from './components/PinDetail.jsx'
import CountryGallery from './components/CountryGallery.jsx'
import StatsBar from './components/StatsBar.jsx'
import ThumbnailStrip from './components/ThumbnailStrip.jsx'
import QRCorner from './components/QRCorner.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'
import FlagBoard from './components/FlagBoard.jsx'
import usePoses from './lib/usePoses.js'
import { getDeleteToken, removeDeleteToken } from './lib/localDeleteTokens.js'
import { deleteOwnPose } from './lib/deletePose.js'
import { fetchAllSpotsWithLocation } from './lib/spots.js'
import { findNearestCountry, countryDisplayName } from './lib/countries.js'
import { useTranslation } from './lib/i18n/LanguageContext.jsx'

const UNDO_TOAST_MS = 10000

export default function App() {
  const { t, lang } = useTranslation()
  const { points, loading, errorMsg, addOwnPose, removePose } = usePoses()
  const [showCapture, setShowCapture] = useState(false)
  const [captureSpot, setCaptureSpot] = useState(null)
  const [selectedPose, setSelectedPose] = useState(null)
  const [selectedCountryPoint, setSelectedCountryPoint] = useState(null)
  const [showFlagBoard, setShowFlagBoard] = useState(false)
  const [focusRequest, setFocusRequest] = useState(null)
  const [undoToast, setUndoToast] = useState(null)
  const [spots, setSpots] = useState([])
  const [myGeo, setMyGeo] = useState(null)

  const countryCount = new Set(points.map((p) => p.country_code)).size

  // 地球儀に表示するスポットの一覧(座標が設定済みのもの)
  useEffect(() => {
    let mounted = true
    fetchAllSpotsWithLocation().then((data) => {
      if (mounted) setSpots(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  // 現在地から国を判定し、地球儀にピン表示する(取得できなくても無視してよい)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestCountry(pos.coords.latitude, pos.coords.longitude)
        if (nearest) {
          setMyGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, country: nearest })
        }
      },
      () => {
        // 拒否/失敗時は何もしない
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    )
  }, [])

  const myLocationPoint = useMemo(() => {
    if (!myGeo) return null
    const name = countryDisplayName(myGeo.country, lang, myGeo.country.name_ja)
    return {
      lat: myGeo.lat,
      lng: myGeo.lng,
      label: `${t('globe.currentLocation')}: ${name}`,
    }
  }, [myGeo, lang, t])

  function handleCountryClick(countryPoint) {
    if (countryPoint.poses.length === 1) {
      setSelectedPose(countryPoint.poses[0])
    } else {
      setSelectedCountryPoint(countryPoint)
    }
  }

  function handleSpotClick(spot) {
    setCaptureSpot(spot)
    setShowCapture(true)
  }

  function handleOpenCapture() {
    setCaptureSpot(null)
    setShowCapture(true)
  }

  function handleThumbnailSelect(pose) {
    setFocusRequest({ lat: pose.lat, lng: pose.lng, nonce: Date.now() })
    setSelectedPose(pose)
  }

  function handleFlagSelect(country) {
    const posesForCountry = points.filter((p) => p.country_code === country.code)
    if (posesForCountry.length === 0) return
    setShowFlagBoard(false)
    setFocusRequest({ lat: country.lat, lng: country.lng, nonce: Date.now() })
    if (posesForCountry.length === 1) {
      setSelectedPose(posesForCountry[0])
    } else {
      setSelectedCountryPoint({
        country_code: country.code,
        country_name: posesForCountry[0].country_name,
        lat: country.lat,
        lng: country.lng,
        poses: posesForCountry,
      })
    }
  }

  function handlePosted(newPose) {
    const isNewCountry = !points.some((p) => p.country_code === newPose.country_code)
    const rank = points.length + 1
    addOwnPose(newPose)
    setUndoToast({ ...newPose, rank, isNewCountry })
    setTimeout(() => {
      setUndoToast((current) => (current?.id === newPose.id ? null : current))
    }, UNDO_TOAST_MS)
  }

  async function handleUndoFromToast() {
    if (!undoToast) return
    const token = getDeleteToken(undoToast.id)
    if (!token) {
      setUndoToast(null)
      return
    }
    const { success } = await deleteOwnPose(undoToast.id, token)
    if (success) {
      removeDeleteToken(undoToast.id)
      removePose(undoToast.id)
    }
    setUndoToast(null)
  }

  async function handleShare() {
    if (!undoToast) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('app.title'),
          text: t('app.shareText', { country: undoToast.country_name }),
          url: window.location.origin,
        })
      } catch {
        // ユーザーがシェアをキャンセルした場合などは何もしない
      }
    } else {
      window.open(undoToast.image_url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="app-shell relative w-screen overflow-hidden bg-surface">
      <div className="absolute inset-0">
        <Globe
          points={points}
          loading={loading}
          errorMsg={errorMsg}
          onCountryClick={handleCountryClick}
          spotPoints={spots}
          onSpotClick={handleSpotClick}
          myLocationPoint={myLocationPoint}
          focusRequest={focusRequest}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-4 pt-4">
        <h1 className="pointer-events-auto rounded-full border border-line bg-white/90 px-4 py-1 text-sm font-bold tracking-wide text-ink shadow-sm backdrop-blur">
          {t('app.title')}
        </h1>
      </div>

      <StatsBar
        postCount={points.length}
        countryCount={countryCount}
        onOpenFlags={() => setShowFlagBoard(true)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center px-4">
        <div className="pointer-events-auto">
          <LanguageSwitcher />
        </div>
      </div>

      <SoundToggle />
      <QRCorner />

      <div className="bottom-stack pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8 bg-gradient-to-t from-white via-white/90 to-transparent">
        {undoToast && (
          <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-lg">
            <span className="font-semibold">
              {t('app.postedToast', { rank: undoToast.rank })}
              {undoToast.isNewCountry && (
                <span className="ml-1 text-accent">
                  {t('app.newCountryToast', { country: undoToast.country_name })}
                </span>
              )}
            </span>
            <div className="flex gap-3 text-xs">
              <button type="button" onClick={handleShare} className="font-bold text-accent underline">
                {t('app.share')}
              </button>
              <a
                href={undoToast.image_url}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-accent underline"
              >
                {t('app.savePhoto')}
              </a>
              <button
                type="button"
                onClick={handleUndoFromToast}
                className="font-bold text-inkmuted underline"
              >
                {t('app.undo')}
              </button>
            </div>
          </div>
        )}

        {points.length > 0 && (
          <div className="pointer-events-auto flex w-full max-w-md justify-center">
            <ThumbnailStrip points={points} onSelect={handleThumbnailSelect} />
          </div>
        )}

        <button
          type="button"
          onClick={handleOpenCapture}
          className="pointer-events-auto w-full max-w-md rounded-full bg-accent py-4 text-lg font-bold text-white shadow-lg shadow-accent/30 active:scale-95"
        >
          {t('app.postButton')}
        </button>
        <a
          href="/?terms=1"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto text-xs text-inkmuted underline"
        >
          {t('app.termsLink')}
        </a>
      </div>

      {showCapture && (
        <CaptureModal
          spot={captureSpot}
          allowSpotChange
          onClose={() => {
            setShowCapture(false)
            setCaptureSpot(null)
          }}
          onPosted={handlePosted}
        />
      )}

      {showFlagBoard && (
        <FlagBoard
          points={points}
          onClose={() => setShowFlagBoard(false)}
          onSelectCountry={handleFlagSelect}
        />
      )}

      {selectedCountryPoint && (
        <CountryGallery
          countryPoint={selectedCountryPoint}
          onClose={() => setSelectedCountryPoint(null)}
          onSelectPose={(pose) => {
            setSelectedCountryPoint(null)
            setSelectedPose(pose)
          }}
        />
      )}

      {selectedPose && (
        <PinDetail
          pose={selectedPose}
          onClose={() => setSelectedPose(null)}
          onDeleted={(id) => removePose(id)}
        />
      )}
    </div>
  )
}
