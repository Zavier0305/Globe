import { useState } from 'react'
import Globe from './components/Globe.jsx'
import CaptureModal from './components/CaptureModal.jsx'
import PinDetail from './components/PinDetail.jsx'

export default function App() {
  const [showCapture, setShowCapture] = useState(false)
  const [selectedPose, setSelectedPose] = useState(null)

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-deepnavy">
      <Globe onPinClick={setSelectedPose} />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-4 pt-4">
        <h1 className="pointer-events-auto rounded-full bg-black/40 px-4 py-1 text-sm font-bold tracking-wide text-cyanbright backdrop-blur">
          世界のポーズ地球儀
        </h1>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6 pt-10 bg-gradient-to-t from-black/80 to-transparent">
        <button
          type="button"
          onClick={() => setShowCapture(true)}
          className="w-full max-w-md rounded-full bg-pinkbright py-4 text-lg font-bold text-white shadow-lg shadow-pinkbright/40 active:scale-95"
        >
          📸 ポーズを投稿する
        </button>
      </div>

      {showCapture && (
        <CaptureModal
          onClose={() => setShowCapture(false)}
          onPosted={() => setShowCapture(false)}
        />
      )}

      {selectedPose && (
        <PinDetail pose={selectedPose} onClose={() => setSelectedPose(null)} />
      )}
    </div>
  )
}
