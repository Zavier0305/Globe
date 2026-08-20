import { useEffect, useRef, useState } from 'react'
import { supabase, POSES_TABLE, POSE_IMAGES_BUCKET } from '../lib/supabaseClient'
import { adminDeletePose } from '../lib/deletePose'
import { COUNTRIES } from '../lib/countries'
import { resizeImageFile } from '../lib/resizeImage'

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

  const [showAddForm, setShowAddForm] = useState(false)
  const [newFile, setNewFile] = useState(null)
  const [newPreviewUrl, setNewPreviewUrl] = useState(null)
  const [newCountryCode, setNewCountryCode] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState(null)
  const [addProcessingFile, setAddProcessingFile] = useState(false)
  const addFileInputRef = useRef(null)

  const [spots, setSpots] = useState([])
  const [newSpotName, setNewSpotName] = useState('')
  const [spotSubmitting, setSpotSubmitting] = useState(false)
  const [spotError, setSpotError] = useState(null)

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
    if (authed && tab === 'spots' && spots.length === 0) loadSpots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab])

  async function loadSpots() {
    const { data, error } = await supabase.rpc('admin_list_spots', {
      p_password: password,
    })
    if (!error) setSpots(data || [])
  }

  // 名前からURL用のslugを作る(英数字以外はハイフンに寄せる)
  function slugify(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function handleCreateSpot(e) {
    e.preventDefault()
    setSpotError(null)
    const name = newSpotName.trim()
    if (!name) {
      setSpotError('スポット名を入力してください。')
      return
    }
    const slug = slugify(name)
    if (!slug) {
      setSpotError('URLに使える文字(英数字)を含む名前にしてください。')
      return
    }

    setSpotSubmitting(true)
    const { error } = await supabase.rpc('admin_create_spot', {
      p_password: password,
      p_name: name,
      p_slug: slug,
    })
    setSpotSubmitting(false)
    if (error) {
      console.error(error)
      setSpotError(
        error.message?.includes('duplicate')
          ? 'そのURL(slug)はすでに使われています。別の名前をお試しください。'
          : 'スポットの作成に失敗しました。'
      )
      return
    }
    setNewSpotName('')
    setActionMsg('スポットを作成しました。')
    await loadSpots()
  }

  function copyToClipboard(text, label) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => setActionMsg(`${label}をコピーしました。`))
      .catch(() => setActionMsg('コピーに失敗しました。手動で選択してください。'))
  }

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

  async function handleAddFileChange(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setAddError(null)
    setAddProcessingFile(true)
    try {
      // HEIC等ブラウザで表示できない形式のまま保存されないよう、選択直後にJPEGへ正規化する
      const normalized = await resizeImageFile(f)
      if (normalized.type !== 'image/jpeg') {
        setAddError(
          'この形式の画像は読み込めませんでした。別のファイルをお試しください。'
        )
        return
      }
      setNewFile(normalized)
      setNewPreviewUrl(URL.createObjectURL(normalized))
    } finally {
      setAddProcessingFile(false)
    }
  }

  function resetAddForm() {
    setNewFile(null)
    setNewPreviewUrl(null)
    setNewCountryCode('')
    setAddError(null)
    if (addFileInputRef.current) addFileInputRef.current.value = ''
  }

  async function handleAddSubmit(e) {
    e.preventDefault()
    setAddError(null)
    if (!newFile) {
      setAddError('画像ファイルを選択してください。')
      return
    }
    const country = COUNTRIES.find((c) => c.code === newCountryCode)
    if (!country) {
      setAddError('国を選択してください。')
      return
    }

    setAddSubmitting(true)
    try {
      const path = `${country.code}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

      const { error: uploadError } = await supabase.storage
        .from(POSE_IMAGES_BUCKET)
        .upload(path, newFile, { cacheControl: '3600', upsert: false })
      if (uploadError) {
        console.error(uploadError)
        setAddError('画像のアップロードに失敗しました。')
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from(POSE_IMAGES_BUCKET)
        .getPublicUrl(path)

      const { error: insertError } = await supabase.rpc('create_pose', {
        p_country_code: country.code,
        p_country_name: country.name_ja,
        p_image_url: publicUrlData.publicUrl,
        p_storage_path: path,
      })
      if (insertError) {
        console.error(insertError)
        setAddError('投稿の登録に失敗しました。')
        return
      }

      resetAddForm()
      setShowAddForm(false)
      setActionMsg('投稿を追加しました。')
      setTab('all')
      await loadAllPoses()
    } catch (err) {
      console.error(err)
      setAddError('追加に失敗しました。もう一度お試しください。')
    } finally {
      setAddSubmitting(false)
    }
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-white"
            >
              ＋ 投稿を追加
            </button>
            <button
              type="button"
              onClick={() => (tab === 'reported' ? loadReported(password) : loadAllPoses())}
              className="rounded-lg border border-line bg-white px-3 py-1 text-sm text-ink"
            >
              再読み込み
            </button>
          </div>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm"
          >
            <h2 className="font-bold text-ink">投稿を手動で追加</h2>

            {newPreviewUrl ? (
              <img
                src={newPreviewUrl}
                alt="プレビュー"
                className="h-40 w-full rounded-lg object-cover"
              />
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-accent/40 bg-accentsoft/30 py-8 text-accent">
                <span className="text-2xl">{addProcessingFile ? '⏳' : '📷'}</span>
                <span className="text-sm font-semibold">
                  {addProcessingFile ? '画像を処理中...' : '画像ファイルを選択'}
                </span>
                <input
                  ref={addFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAddFileChange}
                />
              </label>
            )}

            <select
              value={newCountryCode}
              onChange={(e) => setNewCountryCode(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
            >
              <option value="">国を選択してください</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name_ja}({c.name_en})
                </option>
              ))}
            </select>

            {addError && <p className="text-sm text-red-600">{addError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addSubmitting}
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {addSubmitting ? '追加中...' : '追加する'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAddForm()
                  setShowAddForm(false)
                }}
                className="rounded-lg border border-line bg-white px-4 py-2 text-sm text-ink"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

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
          <button
            type="button"
            onClick={() => setTab('spots')}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              tab === 'spots' ? 'bg-accent text-white' : 'border border-line bg-white text-inkmuted'
            }`}
          >
            スポット
          </button>
        </div>

        {actionMsg && <p className="mb-3 text-sm text-accent">{actionMsg}</p>}

        {tab === 'spots' && (
          <div className="flex flex-col gap-4">
            <form
              onSubmit={handleCreateSpot}
              className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4 shadow-sm"
            >
              <h2 className="font-bold text-ink">スポットを作成</h2>
              <input
                type="text"
                value={newSpotName}
                onChange={(e) => setNewSpotName(e.target.value)}
                placeholder="例: Stanford Shopping Center"
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink placeholder:text-inkmuted"
              />
              {newSpotName.trim() && (
                <p className="text-xs text-inkmuted">
                  URL: /spot/{slugify(newSpotName)}
                </p>
              )}
              {spotError && <p className="text-sm text-red-600">{spotError}</p>}
              <button
                type="submit"
                disabled={spotSubmitting}
                className="rounded-lg bg-accent py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {spotSubmitting ? '作成中...' : '作成する'}
              </button>
            </form>

            {spots.length === 0 ? (
              <p className="text-sm text-inkmuted">スポットはまだありません。</p>
            ) : (
              spots.map((c) => {
                const postUrl = `${window.location.origin}/spot/${c.slug}`
                const boardUrl = `${postUrl}/board?key=${c.board_token}`
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-ink">{c.name}</p>
                      <p className="text-xs text-inkmuted">投稿 {c.post_count}件</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-inkmuted">
                        参加者に配るURL(QRコードにする用)
                      </p>
                      <p className="break-all text-xs text-ink">{postUrl}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(postUrl, '投稿URL')}
                        className="mt-1 rounded-lg border border-line px-2 py-1 text-xs text-accent"
                      >
                        コピー
                      </button>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-inkmuted">
                        運営担当者に渡すURL(一言の閲覧のみ・取扱注意)
                      </p>
                      <p className="break-all text-xs text-ink">{boardUrl}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(boardUrl, '運営者URL')}
                        className="mt-1 rounded-lg border border-line px-2 py-1 text-xs text-accent"
                      >
                        コピー
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab !== 'spots' && list.length === 0 && (
          <p className="text-sm text-inkmuted">
            {tab === 'reported' ? '通報された投稿はありません。' : '投稿がありません。'}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {(tab === 'spots' ? [] : list).map((p) => {
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
