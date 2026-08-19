import { useState } from 'react'
import Globe from './components/Globe.jsx'
import CaptureModal from './components/CaptureModal.jsx'
import PinDetail from './components/PinDetail.jsx'
import CountryGallery from './components/CountryGallery.jsx'
import StatsBar from './components/StatsBar.jsx'
import ThumbnailStrip from './components/ThumbnailStrip.jsx'
import QRCorner from './components/QRCorner.jsx'
import usePoses from './lib/usePoses.js'
import { getDeleteToken, removeDeleteToken } from './lib/localDeleteTokens.js'
import { deleteOwnPose } from './lib/deletePose.js'

const UNDO_TOAST_MS = 8000

export default function App() {
  const { points, loading, errorMsg, addOwnPose, removePose } = usePoses()
  const [showCapture, setShowCapture] = useState(false)
  const [selectedPose, setSelectedPose] = useState(null)
  const [selectedCountryPoint, setSelectedCountryPoint] = useState(null)
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

  function handlePosted(newPose) {
    addOwnPose(newPose)
    setUndoToast(newPose)
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-deepnavy">
      <Globe
        points={points}
        loading={loading}
        errorMsg={errorMsg}
        onCountryClick={handleCountryClick}
        focusRequest={focusRequest}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-4 pt-4">
        <h1 className="pointer-events-auto rounded-full bg-black/40 px-4 py-1 text-sm font-bold tracking-wide text-cyanbright backdrop-blur">
          世界のポーズ地球儀
        </h1>
      </div>

      <StatsBar postCount={points.length} countryCount={countryCount} />

      <QRCorner />

      <ThumbnailStrip points={points} onSelect={handleThumbnailSelect} />

      {undoToast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm text-deepnavy shadow-lg">
            <span>投稿しました!</span>
            <button
              type="button"
              onClick={handleUndoFromToast}
              className="font-bold text-pinkbright underline"
            >
              取り消す
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-4 pb-3 pt-10 bg-gradient-to-t from-black/80 to-transparent">
        <button
          type="button"
          onClick={() => setShowCapture(true)}
          className="w-full max-w-md rounded-full bg-pinkbright py-4 text-lg font-bold text-white shadow-lg shadow-pinkbright/40 active:scale-95"
        >
          📸 ポーズを投稿する
        </button>
        <a href="/?terms=1" target="_blank" rel="noreferrer" className="text-xs text-gray-400 underline">
          利用規約・プライバシーポリシー
        </a>
      </div>

      {showCapture && (
        <CaptureModal
          onClose={() => setShowCapture(false)}
          onPosted={handlePosted}
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
