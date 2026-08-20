import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, POSE_IMAGES_BUCKET } from '../lib/supabaseClient'
import { COUNTRIES, findNearestCountry, countryDisplayName } from '../lib/countries'
import { fetchAllSpotsWithLocation } from '../lib/spots'
import { saveDeleteToken } from '../lib/localDeleteTokens'
import { playPostSuccessSound } from '../lib/sound'
import { getDeviceId } from '../lib/deviceId'
import { resizeImageFile } from '../lib/resizeImage'
import { useTranslation } from '../lib/i18n/LanguageContext.jsx'

const MESSAGE_MAX_LENGTH = 80

// spot を渡すとスポット投稿モードになり、「この場所への一言」欄が表示される。
// メインの地球儀からの投稿(spot なし)は従来通り言葉なしのまま。
// allowSpotChange=true のときは、投稿中でも別のスポットを選び直せるドロップダウンを表示する
// (地球儀上のピンをタップして開いた場合も、通常のボタンから開いた場合も同じ画面を使うため)。
export default function CaptureModal({ onClose, onPosted, spot = null, allowSpotChange = false }) {
  const { t, lang } = useTranslation()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [cameraError, setCameraError] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [showList, setShowList] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState(spot)
  const [spotOptions, setSpotOptions] = useState([])
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
    const f = e.target.files && e.target.files[0]
    if (!f) {
      setCameraError(true)
      return
    }
    const MAX_SIZE_BYTES = 15 * 1024 * 1024
    if (f.size > MAX_SIZE_BYTES) {
      setErrorMsg(t('capture.errImageTooLarge'))
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
        setErrorMsg(t('capture.errUnsupportedFormat'))
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
      const path = `${selectedCountry.code}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.jpg`

      const { error: uploadError } = await supabase.storage
        .from(POSE_IMAGES_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) {
        console.error(uploadError)
        setErrorMsg(t('capture.errUploadFail'))
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
          p_message: selectedSpot ? message.trim() || null : null,
          p_device_id: getDeviceId(),
          p_storage_path: path,
          p_spot_id: selectedSpot?.id || null,
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
          message: selectedSpot ? message.trim() || null : null,
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
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-accentsoft/30 px-4 py-10 text-center text-accent">
              <span className="text-3xl">{processingFile ? '⏳' : '📷'}</span>
              <span className="font-semibold">
                {processingFile ? t('capture.processing') : t('capture.tapToShoot')}
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
                <p className="mb-2">{t('capture.cameraDenied')}</p>
                <label className="inline-block cursor-pointer rounded-lg bg-accent px-3 py-2 text-white">
                  {t('capture.pickFromGallery')}
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
            <label className="mb-1 block text-sm text-inkmuted">
              {t('capture.spotMessageLabel', { spot: selectedSpot.name })}
            </label>
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
