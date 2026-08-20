import { useState } from 'react'
import Globe from './components/Globe.jsx'
import CaptureModal from './components/CaptureModal.jsx'
import PinDetail from './components/PinDetail.jsx'
import CountryGallery from './components/CountryGallery.jsx'
import StatsBar from './components/StatsBar.jsx'
import ThumbnailStrip from './components/ThumbnailStrip.jsx'
import QRCorner from './components/QRCorner.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import FlagBoard from './components/FlagBoard.jsx'
import usePoses from './lib/usePoses.js'
import { getDeleteToken, removeDeleteToken } from './lib/localDeleteTokens.js'
import { deleteOwnPose } from './lib/deletePose.js'

const UNDO_TOAST_MS = 10000

export default function App() {
  const { points, loading, errorMsg, addOwnPose, removePose } = usePoses()
  const [showCapture, setShowCapture] = useState(false)
  const [selectedPose, setSelectedPose] = useState(null)
  const [selectedCountryPoint, setSelectedCountryPoint] = useState(null)
  const [showFlagBoard, setShowFlagBoard] = useState(false)
  const [focusRequest, setFocusRequest] = useState(null)
  const [undoToast, setUndoToast] = useState(null)

  const countryCount = new Set(points.map((p) => p.country_code)).size

  function handleCountryClick(countryPoint) {
    if (countryPoint.poses.length === 1) {
      setSelectedPose(countryPoint.poses[0])
    } else {
      setSelectedCountryPoint(countryPoint)
    }
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
          title: '世界のポーズ地球儀',
          text: `${undoToast.country_name}から参加しました!`,
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
    <div className="relative h-screen w-screen overflow-hidden bg-surface">
      <div className="absolute inset-0">
        <Globe
          points={points}
          loading={loading}
          errorMsg={errorMsg}
          onCountryClick={handleCountryClick}
          focusRequest={focusRequest}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-4 pt-4">
        <h1 className="pointer-events-auto rounded-full border border-line bg-white/90 px-4 py-1 text-sm font-bold tracking-wide text-ink shadow-sm backdrop-blur">
          世界のポーズ地球儀
        </h1>
      </div>

      <StatsBar
        postCount={points.length}
        countryCount={countryCount}
        onOpenFlags={() => setShowFlagBoard(true)}
      />

      <SoundToggle />
      <QRCorner />

      <ThumbnailStrip points={points} onSelect={handleThumbnailSelect} />

      {undoToast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-40 flex justify-center px-4">
          <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-lg">
            <span className="font-semibold">
              投稿しました!あなたは{undoToast.rank}人目の参加者です
              {undoToast.isNewCountry && (
                <span className="ml-1 text-accent">
                  🎉 {undoToast.country_name}は新登場の国です!
                </span>
              )}
            </span>
            <div className="flex gap-3 text-xs">
              <button type="button" onClick={handleShare} className="font-bold text-accent underline">
                シェアする
              </button>
              <a
                href={undoToast.image_url}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-accent underline"
              >
                写真を保存
              </a>
              <button
                type="button"
                onClick={handleUndoFromToast}
                className="font-bold text-inkmuted underline"
              >
                取り消す
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-4 pb-3 pt-10 bg-gradient-to-t from-white via-white/90 to-transparent">
        <button
          type="button"
          onClick={() => setShowCapture(true)}
          className="w-full max-w-md rounded-full bg-accent py-4 text-lg font-bold text-white shadow-lg shadow-accent/30 active:scale-95"
        >
          📸 ポーズを投稿する
        </button>
        <a href="/?terms=1" target="_blank" rel="noreferrer" className="text-xs text-inkmuted underline">
          利用規約・プライバシーポリシー
        </a>
      </div>

      {showCapture && (
        <CaptureModal
          onClose={() => setShowCapture(false)}
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
