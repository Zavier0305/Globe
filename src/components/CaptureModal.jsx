import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, POSE_IMAGES_BUCKET } from '../lib/supabaseClient'
import { COUNTRIES, findNearestCountry } from '../lib/countries'
import { saveDeleteToken } from '../lib/localDeleteTokens'
import { playPostSuccessSound } from '../lib/sound'
import { getDeviceId } from '../lib/deviceId'
import { resizeImageFile } from '../lib/resizeImage'

const MESSAGE_MAX_LENGTH = 80

// spot を渡すとスポット投稿モードになり、「この場所への一言」欄が表示される。
// メインの地球儀からの投稿(spot なし)は従来通り言葉なしのまま。
export default function CaptureModal({ onClose, onPosted, spot = null }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [cameraError, setCameraError] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [showList, setShowList] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [geoHint, setGeoHint] = useState(null)
  const [agreed, setAgreed] = useState(false)
  const [processingFile, setProcessingFile] = useState(false)
  const fileInputRef = useRef(null)
  const countryFieldRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(e) {
      if (countryFieldRef.current && !countryFieldRef.current.contains(e.target)) {
        setShowList(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // 位置情報が使えれば最寄りの国を自動選択する(任意・失敗しても無視)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestCountry(
          pos.coords.latitude,
          pos.coords.longitude
        )
        if (nearest) {
          setSelectedCountry(nearest)
          setSearch(`${nearest.name_ja} (${nearest.name_en})`)
          setGeoHint(`現在地から${nearest.name_ja}を自動選択しました`)
        }
      },
      () => {
        // 拒否/失敗時は何もしない(手動選択にフォールバック)
      },
      { timeout: 5000, maximumAge: 10 * 60 * 1000 }
    )
  }, [])

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(
      (c) =>
        c.name_ja.includes(search.trim()) ||
        c.name_en.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    )
  }, [search])

  async function handleFileChange(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) {
      setCameraError(true)
      return
    }
    const MAX_SIZE_BYTES = 15 * 1024 * 1024
    if (f.size > MAX_SIZE_BYTES) {
      setErrorMsg('画像サイズが大きすぎます(15MBまで)。別の写真を選んでください。')
      return
    }
    setErrorMsg(null)
    setCameraError(false)
    setProcessingFile(true)
    try {
      // 選択直後にJPEGへ正規化しておく(HEIC等ブラウザで表示できない形式の
      // ままプレビュー・投稿されてしまうのを防ぐため、プレビューと投稿を同じ
      // ファイルにする)
      const normalized = await resizeImageFile(f)
      if (normalized.type !== 'image/jpeg') {
        setErrorMsg(
          'この形式の画像は読み込めませんでした。別の写真を選ぶか、スクリーンショットなどJPEG/PNG形式でお試しください。'
        )
        return
      }
      setFile(normalized)
      setPreviewUrl(URL.createObjectURL(normalized))
    } finally {
      setProcessingFile(false)
    }
  }

  function handleRetake() {
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function selectCountry(c) {
    setSelectedCountry(c)
    setSearch(`${c.name_ja} (${c.name_en})`)
    setShowList(false)
    setGeoHint(null)
  }

  async function handleSubmit() {
    setErrorMsg(null)
    if (!file) {
      setErrorMsg('写真を撮影してください。')
      return
    }
    if (!selectedCountry) {
      setErrorMsg('国を選択してください。')
      return
    }
    if (!agreed) {
      setErrorMsg('利用規約・プライバシーポリシーへの同意が必要です。')
      return
    }

    const confirmed = window.confirm(
      'あなたの顔やポーズが世界中に公開されます。よろしいですか?'
    )
    if (!confirmed) return

    setSubmitting(true)
    try {
      const path = `${selectedCountry.code}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.jpg`

      const { error: uploadError } = await supabase.storage
        .from(POSE_IMAGES_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) {
        console.error(uploadError)
        setErrorMsg('画像のアップロードに失敗しました。通信環境を確認して再度お試しください。')
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from(POSE_IMAGES_BUCKET)
        .getPublicUrl(path)
      const imageUrl = publicUrlData.publicUrl

      const { data: rpcData, error: insertError } = await supabase.rpc(
        'create_pose',
        {
          p_country_code: selectedCountry.code,
          p_country_name: selectedCountry.name_ja,
          p_image_url: imageUrl,
          p_message: spot ? message.trim() || null : null,
          p_device_id: getDeviceId(),
          p_storage_path: path,
          p_spot_id: spot?.id || null,
        }
      )
      if (insertError) {
        console.error(insertError)
        if (insertError.message?.includes('rate_limited')) {
          setErrorMsg('投稿が多すぎます。10分ほど時間をおいてから再度お試しください。')
        } else {
          setErrorMsg('投稿の登録に失敗しました。もう一度お試しください。')
        }
        return
      }

      const created = Array.isArray(rpcData) ? rpcData[0] : rpcData
      if (created) {
        saveDeleteToken(created.id, created.delete_token)
      }

      playPostSuccessSound()
      onPosted &&
        onPosted({
          id: created?.id,
          country_code: selectedCountry.code,
          country_name: selectedCountry.name_ja,
          image_url: imageUrl,
          message: spot ? message.trim() || null : null,
          created_at: created?.created_at || new Date().toISOString(),
        })
      onClose()
    } catch (err) {
      console.error(err)
      setErrorMsg('投稿に失敗しました。通信環境を確認して再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">ポーズを投稿</h2>
            {spot && (
              <p className="text-xs text-accent">{spot.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surfacemuted text-xl text-ink"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {!previewUrl && (
          <div className="mb-4">
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-accentsoft/30 px-4 py-10 text-center text-accent">
              <span className="text-3xl">{processingFile ? '⏳' : '📷'}</span>
              <span className="font-semibold">
                {processingFile ? '画像を処理中...' : 'タップして撮影'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {cameraError && (
              <div className="mt-3 rounded-lg bg-accentsoft/50 p-3 text-sm text-accentdark">
                <p className="mb-2">カメラを許可してください。</p>
                <label className="inline-block cursor-pointer rounded-lg bg-accent px-3 py-2 text-white">
                  ギャラリーから選ぶ
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {previewUrl && (
          <div className="mb-4">
            <img
              src={previewUrl}
              alt="プレビュー"
              className="w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={handleRetake}
              className="mt-2 w-full rounded-lg bg-surfacemuted py-2 text-sm text-ink"
            >
              撮り直す
            </button>
          </div>
        )}

        <div className="relative mb-4" ref={countryFieldRef}>
          <label className="mb-1 block text-sm text-inkmuted">国を選択</label>
          <input
            type="text"
            value={search}
            onFocus={() => setShowList(true)}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedCountry(null)
              setShowList(true)
              setGeoHint(null)
            }}
            placeholder="国名で検索(例: 日本, Japan, JP)"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink placeholder:text-inkmuted"
          />
          {geoHint && <p className="mt-1 text-xs text-accent">{geoHint}</p>}
          {showList && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-xl">
              {filteredCountries.length === 0 && (
                <li className="px-3 py-2 text-sm text-inkmuted">該当する国がありません</li>
              )}
              {filteredCountries.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => selectCountry(c)}
                    className="block w-full px-3 py-2 text-left text-ink hover:bg-surfacemuted"
                  >
                    {c.name_ja} <span className="text-xs text-inkmuted">({c.name_en})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {spot && (
          <div className="mb-4">
            <label className="mb-1 block text-sm text-inkmuted">
              {spot.name}への一言(任意)
            </label>
            <input
              type="text"
              value={message}
              maxLength={MESSAGE_MAX_LENGTH}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="例: 最高の一日でした!"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink placeholder:text-inkmuted"
            />
            <p className="mt-1 text-right text-xs text-inkmuted">
              {message.length}/{MESSAGE_MAX_LENGTH}
            </p>
          </div>
        )}

        <label className="mb-3 flex items-start gap-2 text-xs text-inkmuted">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            <a
              href="/?terms=1"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              利用規約・プライバシーポリシー
            </a>
            に同意します(顔写真が世界中に公開されます)
          </span>
        </label>

        {errorMsg && <p className="mb-3 text-sm text-accentdark">{errorMsg}</p>}

        <button
          type="button"
          disabled={submitting || !agreed}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-accent py-3 text-lg font-bold text-white disabled:opacity-50"
        >
          {submitting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </div>
  )
}
