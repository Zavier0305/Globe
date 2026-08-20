import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { flagEmoji } from '../lib/flag.js'

// スポット運営担当者向けの一言一覧。
// URLの ?key= に入ったスポット別トークンが一致した場合のみ表示される。
// このトークンでは「そのスポットの一言を読む」ことしかできず、削除権限はない。
export default function SpotBoard({ slug, token }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  async function load() {
    setLoading(true)
    setErrorMsg(null)
    const { data, error } = await supabase.rpc('spot_board', {
      p_slug: slug,
      p_token: token,
    })
    setLoading(false)
    if (error) {
      console.error(error)
      // 通信エラーを「権限がない」と誤表示しないよう、DBが返した理由を優先して判定する
      const reason = `${error.code || ''} ${error.message || ''}`
      if (reason.includes('spot_not_found') || reason.includes('P0002')) {
        setErrorMsg('スポットが見つかりません。URLをご確認ください。')
      } else if (reason.includes('unauthorized') || reason.includes('28000')) {
        setErrorMsg(
          'このページを表示する権限がありません。URLの key が正しいかご確認ください。'
        )
      } else {
        setErrorMsg(
          '一覧を読み込めませんでした。通信環境を確認して、ページを再読み込みしてください。'
        )
      }
      return
    }
    setRows(data || [])
  }

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setErrorMsg('URLに key が含まれていません。運営から共有されたURLをそのままお使いください。')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-inkmuted">読み込み中...</p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <p className="max-w-sm text-center text-sm text-inkmuted">{errorMsg}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Spot board
            </p>
            <h1 className="text-lg font-bold text-ink">
              いただいた一言
              <span className="ml-2 text-sm font-normal text-inkmuted">
                {rows.length}件
              </span>
            </h1>
          </div>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-line bg-white px-3 py-1 text-sm text-ink"
          >
            再読み込み
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-line bg-white px-4 py-8 text-center text-sm text-inkmuted">
            まだ一言はありません。
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((r) => (
              <div
                key={r.pose_id}
                className="flex gap-3 rounded-xl border border-line bg-white p-3 shadow-sm"
              >
                <img
                  src={r.thumbnail_url || r.image_url}
                  alt={r.country_name}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm text-ink">{r.message}</p>
                  <p className="mt-1 text-xs text-inkmuted">
                    {r.country_name} ・{' '}
                    {new Date(r.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-inkmuted">
          不適切な投稿を見つけた場合は、運営者までご連絡ください。
        </p>
      </div>
    </div>
  )
}
