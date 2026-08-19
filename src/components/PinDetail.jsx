import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getDeleteToken, removeDeleteToken } from '../lib/localDeleteTokens'
import { deleteOwnPose } from '../lib/deletePose'

export default function PinDetail({ pose, onClose, onDeleted }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)

  if (!pose) return null

  const canDelete = Boolean(getDeleteToken(pose.id))

  async function handleDelete() {
    const token = getDeleteToken(pose.id)
    if (!token) return
    const confirmed = window.confirm('この投稿を取り消しますか?元に戻せません。')
    if (!confirmed) return

    setDeleting(true)
    try {
      const { success } = await deleteOwnPose(pose.id, token)
      if (!success) {
        setActionMsg('取り消しに失敗しました。もう一度お試しください。')
        return
      }
      removeDeleteToken(pose.id)
      onDeleted && onDeleted(pose.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  async function handleReport() {
    setReporting(true)
    try {
      const { error } = await supabase.rpc('report_pose', { p_id: pose.id })
      if (error) {
        console.error(error)
        setActionMsg('通報に失敗しました。')
        return
      }
      setReported(true)
      setActionMsg('通報しました。ご協力ありがとうございます。')
    } finally {
      setReporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-full w-full max-w-md overflow-hidden rounded-2xl bg-deepnavy shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xl text-white"
          aria-label="閉じる"
        >
          ×
        </button>
        {imageFailed ? (
          <div className="flex h-64 w-full items-center justify-center bg-black text-sm text-gray-400">
            画像を読み込めませんでした
          </div>
        ) : (
          <img
            src={pose.image_url}
            alt={pose.country_name}
            className="max-h-[70vh] w-full object-contain bg-black"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="px-4 py-3">
          <p className="text-lg font-bold text-cyanbright">{pose.country_name}</p>
          <p className="mt-1 text-xs text-gray-400">
            {new Date(pose.created_at).toLocaleString('ja-JP')}
          </p>

          {actionMsg && (
            <p className="mt-2 text-xs text-cyanbright">{actionMsg}</p>
          )}

          <div className="mt-3 flex gap-2">
            {canDelete && (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-white/10 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? '取り消し中...' : 'この投稿を取り消す'}
              </button>
            )}
            <button
              type="button"
              disabled={reporting || reported}
              onClick={handleReport}
              className="flex-1 rounded-lg bg-white/10 py-2 text-sm font-semibold text-gray-300 disabled:opacity-50"
            >
              {reported ? '通報済み' : reporting ? '通報中...' : '不適切と通報する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
