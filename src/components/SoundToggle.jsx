import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '../lib/soundPref'

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(isSoundEnabled)

  function toggle() {
    const next = !enabled
    setEnabled(next)
    setSoundEnabled(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white shadow-md"
      aria-label={enabled ? '効果音をオフにする' : '効果音をオンにする'}
      title={enabled ? '効果音: オン' : '効果音: オフ'}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  )
}
