import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getDeleteToken, removeDeleteToken } from '../lib/localDeleteTokens'
import { deleteOwnPose } from '../lib/deletePose'
import { useTranslation } from '../lib/i18n/LanguageContext.jsx'

export default function PinDetail({ pose, onClose, onDeleted }) {
  const { t } = useTranslation()
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
    const confirmed = window.confirm(t('pin.deleteConfirm'))
    if (!confirmed) return

    setDeleting(true)
    try {
      const { success } = await deleteOwnPose(pose.id, token)
      if (!success) {
        setActionMsg(t('pin.deleteFail'))
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
        setActionMsg(t('pin.reportFail'))
        return
      }
      setReported(true)
      setActionMsg(t('pin.reportThanks'))
    } finally {
      setReporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-full w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-xl text-white"
          aria-label={t('app.close')}
        >
          ×
        </button>
        {imageFailed ? (
          <div className="flex h-64 w-full items-center justify-center bg-surfacemuted text-sm text-inkmuted">
            {t('pin.imageLoadFail')}
          </div>
        ) : (
          <img
            src={pose.image_url}
            alt={pose.country_name}
            className="max-h-[70vh] w-full object-contain bg-surfacemuted"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="px-4 py-3">
          <p className="text-lg font-bold text-ink">{pose.country_name}</p>
          <p className="mt-1 text-xs text-inkmuted">
            {new Date(pose.created_at).toLocaleString('ja-JP')}
          </p>

          {actionMsg && (
            <p className="mt-2 text-xs text-accent">{actionMsg}</p>
          )}

          <div className="mt-3 flex gap-2">
            {canDelete && (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-surfacemuted py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                {deleting ? t('pin.deleting') : t('pin.delete')}
              </button>
            )}
            <button
              type="button"
              disabled={reporting || reported}
              onClick={handleReport}
              className="flex-1 rounded-lg bg-surfacemuted py-2 text-sm font-semibold text-inkmuted disabled:opacity-50"
            >
              {reported ? t('pin.reported') : reporting ? t('pin.reporting') : t('pin.report')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
