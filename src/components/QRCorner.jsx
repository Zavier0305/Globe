import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QRCorner() {
  const [dataUrl, setDataUrl] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const url = window.location.origin + window.location.pathname
    QRCode.toDataURL(url, {
      width: 256,
      margin: 1,
      color: { dark: '#040b1a', light: '#ffffff' },
    })
      .then(setDataUrl)
      .catch((err) => console.error('QRコード生成に失敗しました', err))
  }, [])

  if (!dataUrl) return null

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="fixed right-3 top-3 z-30 overflow-hidden rounded-lg border border-line bg-white shadow-md transition-all"
      style={expanded ? { width: 200, height: 200 } : { width: 56, height: 56 }}
      aria-label="QRコードでこのページを開く"
    >
      <img src={dataUrl} alt="このページのQRコード" className="h-full w-full" />
      {expanded && (
        <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-[10px] text-white">
          スマホでスキャン
        </span>
      )}
    </button>
  )
}
