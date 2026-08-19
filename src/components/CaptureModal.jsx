import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, POSES_TABLE, POSE_IMAGES_BUCKET } from '../lib/supabaseClient'
import { COUNTRIES } from '../lib/countries'

export default function CaptureModal({ onClose, onPosted }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [cameraError, setCameraError] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [showList, setShowList] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
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

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) {
      setCameraError(true)
      return
    }
    setCameraError(false)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
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

    const confirmed = window.confirm(
      'あなたの顔やポーズが世界中に公開されます。よろしいですか?'
    )
    if (!confirmed) return

    setSubmitting(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${selectedCountry.code}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(POSE_IMAGES_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from(POSE_IMAGES_BUCKET)
        .getPublicUrl(path)
      const imageUrl = publicUrlData.publicUrl

      const { error: insertError } = await supabase.from(POSES_TABLE).insert({
        country_code: selectedCountry.code,
        country_name: selectedCountry.name_ja,
        image_url: imageUrl,
      })
      if (insertError) throw insertError

      onPosted && onPosted()
      onClose()
    } catch (err) {
      console.error(err)
      setErrorMsg('投稿に失敗しました。通信環境を確認して再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-deepnavy p-4 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">ポーズを投稿</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {!previewUrl && (
          <div className="mb-4">
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cyanbright/50 bg-white/5 px-4 py-10 text-center text-cyanbright">
              <span className="text-3xl">📷</span>
              <span className="font-semibold">タップして撮影</span>
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
              <div className="mt-3 rounded-lg bg-pinkbright/10 p-3 text-sm text-pinkbright">
                <p className="mb-2">カメラを許可してください。</p>
                <label className="inline-block cursor-pointer rounded-lg bg-pinkbright px-3 py-2 text-white">
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
              className="mt-2 w-full rounded-lg bg-white/10 py-2 text-sm text-white"
            >
              撮り直す
            </button>
          </div>
        )}

        <div className="relative mb-4" ref={countryFieldRef}>
          <label className="mb-1 block text-sm text-gray-300">国を選択</label>
          <input
            type="text"
            value={search}
            onFocus={() => setShowList(true)}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedCountry(null)
              setShowList(true)
            }}
            placeholder="国名で検索(例: 日本, Japan, JP)"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500"
          />
          {showList && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#0a1730] shadow-xl">
              {filteredCountries.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">該当する国がありません</li>
              )}
              {filteredCountries.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => selectCountry(c)}
                    className="block w-full px-3 py-2 text-left text-white hover:bg-white/10"
                  >
                    {c.name_ja} <span className="text-xs text-gray-400">({c.name_en})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errorMsg && <p className="mb-3 text-sm text-pinkbright">{errorMsg}</p>}

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-pinkbright py-3 text-lg font-bold text-white disabled:opacity-50"
        >
          {submitting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </div>
  )
}
