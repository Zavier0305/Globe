import { useEffect, useState } from 'react'
import { supabase, POSES_TABLE } from '../lib/supabaseClient'
import { adminDeletePose } from '../lib/deletePose'

const SESSION_KEY = 'pose-admin-password'
const ALL_POSES_LIMIT = 200

export default function AdminPanel() {
  const [password, setPassword] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || ''
  )
  const [authed, setAuthed] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('reported')
  const [reportedPoses, setReportedPoses] = useState([])
  const [allPoses, setAllPoses] = useState([])
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
    setReportedPoses(data || [])
  }

  async function loadAllPoses() {
    const { data, error } = await supabase
      .from(POSES_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(ALL_POSES_LIMIT)
    if (!error) setAllPoses(data || [])
  }

  useEffect(() => {
    if (password) loadReported(password)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (authed && tab === 'all' && allPoses.length === 0) loadAllPoses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab])

  async function handleDelete(poseId, fromTab) {
    const confirmed = window.confirm('この投稿を削除しますか?元に戻せません。')
    if (!confirmed) return
    const { success } = await adminDeletePose(password, poseId)
    if (!success) {
      setActionMsg('削除に失敗しました。')
      return
    }
    if (fromTab === 'reported') {
      setReportedPoses((prev) => prev.filter((p) => p.pose_id !== poseId))
    }
    setAllPoses((prev) => prev.filter((p) => p.id !== poseId))
    setActionMsg('削除しました。')
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <form
          className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault()
            loadReported(password)
          }}
        >
          <h1 className="mb-4 text-lg font-bold text-ink">管理者ログイン</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理者パスワード"
            className="mb-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
            autoFocus
          />
          {loginError && (
            <p className="mb-3 text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2 font-bold text-white disabled:opacity-50"
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>
        </form>
      </div>
    )
  }

  const list = tab === 'reported' ? reportedPoses : allPoses

  return (
    <div className="min-h-screen bg-surface px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-ink">管理者パネル</h1>
          <button
            type="button"
            onClick={() => (tab === 'reported' ? loadReported(password) : loadAllPoses())}
            className="rounded-lg border border-line bg-white px-3 py-1 text-sm text-ink"
          >
            再読み込み
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('reported')}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              tab === 'reported' ? 'bg-accent text-white' : 'border border-line bg-white text-inkmuted'
            }`}
          >
            通報された投稿({reportedPoses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              tab === 'all' ? 'bg-accent text-white' : 'border border-line bg-white text-inkmuted'
            }`}
          >
            全投稿(最新{ALL_POSES_LIMIT}件)
          </button>
        </div>

        {actionMsg && <p className="mb-3 text-sm text-accent">{actionMsg}</p>}

        {list.length === 0 && (
          <p className="text-sm text-inkmuted">
            {tab === 'reported' ? '通報された投稿はありません。' : '投稿がありません。'}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {list.map((p) => {
            const id = tab === 'reported' ? p.pose_id : p.id
            return (
              <div key={id} className="flex gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
                <img
                  src={p.image_url}
                  alt={p.country_name}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-bold text-ink">{p.country_name}</p>
                  <p className="text-xs text-inkmuted">
                    {new Date(p.created_at).toLocaleString('ja-JP')}
                  </p>
                  {tab === 'reported' ? (
                    <p className="text-xs font-semibold text-red-600">
                      通報 {p.report_count}件
                    </p>
                  ) : (
                    p.report_count > 0 && (
                      <p className="text-xs font-semibold text-red-600">
                        通報 {p.report_count}件
                      </p>
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(id, tab)}
                  className="h-fit shrink-0 rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white"
                >
                  削除
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
