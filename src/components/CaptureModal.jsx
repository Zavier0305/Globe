import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, POSE_IMAGES_BUCKET } from '../lib/supabaseClient'
import { COUNTRIES, findNearestCountry, countryDisplayName } from '../lib/countries'
import { fetchAllSpotsWithLocation } from '../lib/spots'
import { saveDeleteToken } from '../lib/localDeleteTokens'
import { playPostSuccessSound } from '../lib/sound'
import { getDeviceId } from '../lib/deviceId'
import { resizeImageFile, createThumbnailFile } from '../lib/resizeImage'
import { useTranslation } from '../lib/i18n/LanguageContext.jsx'

const MESSAGE_MAX_LENGTH = 80
const WISH_CATEGORIES = ['clothes', 'shoes', 'accessories', 'food', 'goods', 'other']
const WISH_ICONS = {
  clothes: '👕',
  shoes: '👟',
  accessories: '💍',
  food: '🍔',
  goods: '🎁',
  other: '✨',
}

// spot を渡すとスポット投稿モードになり、「この場所への一言」欄が表示される。
// メインの地球儀からの投稿(spot なし)は従来通り言葉なしのまま。
// allowSpotChange=true のときは、投稿中でも別のスポットを選び直せるドロップダウンを表示する
// (地球儀上のピンをタップして開いた場合も、通常のボタンから開いた場合も同じ画面を使うため)。
export default function CaptureModal({ onClose, onPosted, spot = null, allowSpotChange = false }) {
  const { t, lang } = useTranslation()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [showList, setShowList] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState(spot)
  const [spotOptions, setSpotOptions] = useState([])
  const [selectedWishes, setSelectedWishes] = useState([])
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

  // スポットが変わったら、前のスポット向けに選んだ「欲しいもの」をリセットする
  useEffect(() => {
    setSelectedWishes([])
    setMessage('')
  }, [selectedSpot?.id])

  // スポットを選び直せる場合のみ、選択肢一覧を取得する
  useEffect(() => {
    if (!allowSpotChange) return
    let mounted = true
    fetchAllSpotsWithLocation().then((data) => {
      if (mounted) setSpotOptions(data)
    })
    return () => {
      mounted = false
    }
  }, [allowSpotChange])

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
          setSearch(`${countryDisplayName(nearest, lang, nearest.name_ja)} (${nearest.name_en})`)
          setGeoHint(t('capture.geoHint', { country: countryDisplayName(nearest, lang, nearest.name_ja) }))
        }
      },
      () => {
        // 拒否/失敗時は何もしない(手動選択にフォールバック)
      },
      { timeout: 5000, maximumAge: 10 * 60 * 1000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(
      (c) =>
        countryDisplayName(c, lang, c.name_ja).toLowerCase().includes(q) ||
        c.name_ja.includes(search.trim()) ||
        c.name_en.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    )
  }, [search, lang])

  async function handleFileChange(e) {
    const inputEl = e.target
    const f = inputEl.files && inputEl.files[0]
    // ユーザーがカメラ/選択をキャンセルしただけの場合は何もしない
    // (「カメラを許可してください」等の紛らわしいエラーは出さない)
    if (!f) return

    setErrorMsg(null)
    const MAX_SIZE_BYTES = 15 * 1024 * 1024
    if (f.size > MAX_SIZE_BYTES) {
      setErrorMsg(t('capture.errImageTooLarge'))
      // inputのvalueをリセットしないと、同じファイルを選び直したときに
      // changeイベントが発火せず「何度やっても反応しない」状態になる
      inputEl.value = ''
      return
    }

    setProcessingFile(true)
    try {
      // 選択直後にJPEGへ正規化しておく(HEIC等ブラウザで表示できない形式の
      // ままプレビュー・投稿されてしまうのを防ぐため、プレビューと投稿を同じ
      // ファイルにする)
      const normalized = await resizeImageFile(f)
      if (normalized.type !== 'image/jpeg') {
        setErrorMsg(t('capture.errUnsupportedFormat'))
        return
      }
      setFile(normalized)
      setPreviewUrl(URL.createObjectURL(normalized))
    } catch (err) {
      console.error(err)
      setErrorMsg(t('capture.errUnsupportedFormat'))
    } finally {
      setProcessingFile(false)
      inputEl.value = ''
    }
  }

  function handleRetake() {
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function toggleWish(key) {
    setSelectedWishes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // 選んだカテゴリと自由記述をまとめて、DBのmessage列に保存する1本の文字列にする
  function composeWishMessage() {
    const labels = selectedWishes.map((key) => t(`capture.wish.${key}`))
    const parts = []
    if (labels.length > 0) parts.push(labels.join(', '))
    const freeText = message.trim()
    if (freeText) parts.push(freeText)
    return parts.join(' / ')
  }

  function selectCountry(c) {
    setSelectedCountry(c)
    setSearch(`${countryDisplayName(c, lang, c.name_ja)} (${c.name_en})`)
    setShowList(false)
    setGeoHint(null)
  }

  async function handleSubmit() {
    setErrorMsg(null)
    if (!file) {
      setErrorMsg(t('capture.errNoPhoto'))
      return
    }
    if (!selectedCountry) {
      setErrorMsg(t('capture.errNoCountry'))
      return
    }
    if (!agreed) {
      setErrorMsg(t('capture.errNoAgree'))
      return
    }

    const confirmed = window.confirm(t('capture.confirmPublish'))
    if (!confirmed) return

    setSubmitting(true)
    try {
      const wishMessage = selectedSpot ? composeWishMessage() || null : null
      const base = `${selectedCountry.code}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`
      const path = `${base}.jpg`
      const thumbPath = `${base}-thumb.jpg`

      const { error: uploadError } = await supabase.storage
        .from(POSE_IMAGES_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) {
        console.error(uploadError)
        setErrorMsg(t('capture.errUploadFail'))
        return
      }

      // 地球儀のピンやサムネイル一覧は、この小さな画像だけを読み込むことで
      // フル解像度の写真をたくさん同時デコードしてメモリを圧迫しないようにする
      const thumbnailFile = await createThumbnailFile(file).catch(() => null)
      let thumbnailUrl = null
      if (thumbnailFile) {
        const { error: thumbUploadError } = await supabase.storage
          .from(POSE_IMAGES_BUCKET)
          .upload(thumbPath, thumbnailFile, { cacheControl: '3600', upsert: false })
        if (!thumbUploadError) {
          thumbnailUrl = supabase.storage.from(POSE_IMAGES_BUCKET).getPublicUrl(thumbPath).data.publicUrl
        } else {
          console.error(thumbUploadError)
        }
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
          p_message: wishMessage,
          p_device_id: getDeviceId(),
          p_storage_path: path,
          p_spot_id: selectedSpot?.id || null,
          p_thumbnail_url: thumbnailUrl,
          p_thumbnail_storage_path: thumbnailUrl ? thumbPath : null,
        }
      )
      if (insertError) {
        console.error(insertError)
        if (insertError.message?.includes('rate_limited')) {
          setErrorMsg(t('capture.errRateLimited'))
        } else {
          setErrorMsg(t('capture.errInsertFail'))
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
          thumbnail_url: thumbnailUrl || imageUrl,
          spot_id: selectedSpot?.id || null,
          message: wishMessage,
          created_at: created?.created_at || new Date().toISOString(),
        })
      onClose()
    } catch (err) {
      console.error(err)
      setErrorMsg(t('capture.errGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">{t('capture.title')}</h2>
            {selectedSpot && !allowSpotChange && (
              <p className="text-xs text-accent">{selectedSpot.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surfacemuted text-xl text-ink"
            aria-label={t('app.close')}
          >
            ×
          </button>
        </div>

        {!previewUrl && (
          <div className="mb-4">
            {/* capture="user"のように前面カメラを固定すると、LINE等のアプリ内
                ブラウザや一部Android端末で起動に失敗しやすいため、値は指定せず
                「カメラのみ・facingModeはOS任せ」にする(アルバムからは選べない) */}
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-accentsoft/30 px-4 py-10 text-center text-accent">
              <span className="text-3xl">{processingFile ? '⏳' : '📷'}</span>
              <span className="font-semibold">
                {processingFile ? t('capture.processing') : t('capture.tapToShoot')}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        {previewUrl && (
          <div className="mb-4">
            <img
              src={previewUrl}
              alt=""
              className="w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={handleRetake}
              className="mt-2 w-full rounded-lg bg-surfacemuted py-2 text-sm text-ink"
            >
              {t('capture.retake')}
            </button>
          </div>
        )}

        <div className="relative mb-4" ref={countryFieldRef}>
          <label className="mb-1 block text-sm text-inkmuted">{t('capture.countryLabel')}</label>
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
            placeholder={t('capture.countrySearchPlaceholder')}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink placeholder:text-inkmuted"
          />
          {geoHint && <p className="mt-1 text-xs text-accent">{geoHint}</p>}
          {showList && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-xl">
              {filteredCountries.length === 0 && (
                <li className="px-3 py-2 text-sm text-inkmuted">{t('capture.countryNoMatch')}</li>
              )}
              {filteredCountries.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => selectCountry(c)}
                    className="block w-full px-3 py-2 text-left text-ink hover:bg-surfacemuted"
                  >
                    {countryDisplayName(c, lang, c.name_ja)}{' '}
                    <span className="text-xs text-inkmuted">({c.name_en})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {allowSpotChange && (
          <div className="mb-4">
            <label className="mb-1 block text-sm text-inkmuted">{t('capture.spotPickerLabel')}</label>
            <select
              value={selectedSpot?.id || ''}
              onChange={(e) => {
                const next = spotOptions.find((s) => s.id === e.target.value)
                setSelectedSpot(next || null)
              }}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
            >
              <option value="">{t('capture.spotPickerNone')}</option>
              {spotOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedSpot && (
          <div className="mb-4">
            <label className="mb-2 block text-sm text-inkmuted">
              {t('capture.spotMessageLabel', { spot: selectedSpot.name })}
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {WISH_CATEGORIES.map((key) => {
                const active = selectedWishes.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleWish(key)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-white text-ink'
                    }`}
                  >
                    {WISH_ICONS[key]} {t(`capture.wish.${key}`)}
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              value={message}
              maxLength={MESSAGE_MAX_LENGTH}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('capture.spotMessagePlaceholder')}
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
            {t('capture.agreePrefix')}
            <a
              href="/?terms=1"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              {t('app.termsLink')}
            </a>
            {t('capture.agreeSuffix')}
          </span>
        </label>

        {errorMsg && <p className="mb-3 text-sm text-accentdark">{errorMsg}</p>}

        <button
          type="button"
          disabled={submitting || !agreed}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-accent py-3 text-lg font-bold text-white disabled:opacity-50"
        >
          {submitting ? t('capture.submitting') : t('capture.submit')}
        </button>
      </div>
    </div>
  )
}
