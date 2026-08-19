import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const SESSION_KEY = 'pose-admin-password'

export default function AdminPanel() {
  const [password, setPassword] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || ''
  )
  const [authed, setAuthed] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [poses, setPoses] = useState([])
  const [actionMsg, setActionMsg] = useState(null)

  async function loadReported(pw) {
    setLoading(true)
    setLoginError(null)
    const { data, error } = await supabase.rpc('admin_list_reported_poses', {
      p_password: pw,
    })
    setLoading(false)
    if (error) {
      setAuthed(false)
      sessionStorage.removeItem(SESSION_KEY)
      setLoginError('パスワードが違います。')
      return
    }
    setAuthed(true)
    sessionStorage.setItem(SESSION_KEY, pw)
    setPoses(data || [])
  }

  useEffect(() => {
    if (password) loadReported(password)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete(poseId) {
    const confirmed = window.confirm('この投稿を削除しますか?元に戻せません。')
    if (!confirmed) return
    const { error } = await supabase.rpc('admin_delete_pose', {
      p_password: password,
      p_id: poseId,
    })
    if (error) {
      setActionMsg('削除に失敗しました。')
      return
    }
    setPoses((prev) => prev.filter((p) => p.pose_id !== poseId))
    setActionMsg('削除しました。')
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deepnavy px-4">
        <form
          className="w-full max-w-sm rounded-2xl bg-white/5 p-6"
          onSubmit={(e) => {
            e.preventDefault()
            loadReported(password)
          }}
        >
          <h1 className="mb-4 text-lg font-bold text-white">管理者ログイン</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理者パスワード"
            className="mb-3 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
            autoFocus
          />
          {loginError && (
            <p className="mb-3 text-sm text-pinkbright">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pinkbright py-2 font-bold text-white disabled:opacity-50"
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-deepnavy px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">
            通報された投稿({poses.length}件)
          </h1>
          <button
            type="button"
            onClick={() => loadReported(password)}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white"
          >
            再読み込み
          </button>
        </div>

        {actionMsg && (
          <p className="mb-3 text-sm text-cyanbright">{actionMsg}</p>
        )}

        {poses.length === 0 && (
          <p className="text-sm text-gray-400">通報された投稿はありません。</p>
        )}

        <div className="flex flex-col gap-3">
          {poses.map((p) => (
            <div
              key={p.pose_id}
              className="flex gap-3 rounded-xl bg-white/5 p-3"
            >
              <img
                src={p.image_url}
                alt={p.country_name}
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-bold text-cyanbright">{p.country_name}</p>
                {p.message && <p className="text-sm text-white">{p.message}</p>}
                <p className="text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleString('ja-JP')}
                </p>
                <p className="text-xs font-semibold text-pinkbright">
                  通報 {p.report_count}件
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(p.pose_id)}
                className="h-fit shrink-0 rounded-lg bg-pinkbright px-3 py-1 text-sm font-semibold text-white"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
