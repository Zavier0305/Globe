import { useEffect, useState } from 'react'
import CaptureModal from './CaptureModal.jsx'
import Globe from './Globe.jsx'
import PinDetail from './PinDetail.jsx'
import CountryGallery from './CountryGallery.jsx'
import usePoses from '../lib/usePoses.js'
import { fetchSpotBySlug, fetchSpotPoses } from '../lib/spots.js'
import { flagEmoji } from '../lib/flag.js'
import { useTranslation } from '../lib/i18n/LanguageContext.jsx'

export default function SpotPage({ slug }) {
  const { t } = useTranslation()
  const [spot, setSpot] = useState(null)
  const [poses, setPoses] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [justPosted, setJustPosted] = useState(false)

  // メインと同じ地球儀(全投稿)をこのページでも表示する
  const { points, loading: globeLoading, addOwnPose } = usePoses()
  const [selectedPose, setSelectedPose] = useState(null)
  const [selectedCountryPoint, setSelectedCountryPoint] = useState(null)

  function handleCountryClick(countryPoint) {
    if (countryPoint.poses.length === 1) {
      setSelectedPose(countryPoint.poses[0])
    } else {
      setSelectedCountryPoint(countryPoint)
    }
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      const c = await fetchSpotBySlug(slug)
      if (!mounted) return
      if (!c) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setSpot(c)
      setPoses(await fetchSpotPoses(c.id))
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [slug])

  function handlePosted(newPose) {
    setPoses((prev) => [newPose, ...prev])
    addOwnPose(newPose) // 同じページ内の地球儀にも即座に反映する
    setJustPosted(true)
    setTimeout(() => setJustPosted(false), 6000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-inkmuted">{t('app.loading')}</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
        <p className="text-lg font-bold text-ink">{t('spotPage.notFoundTitle')}</p>
        <p className="text-sm text-inkmuted">{t('spotPage.notFoundBody')}</p>
        <a href="/" className="text-sm text-accent underline">
          {t('spotPage.openGlobe')}
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      <header className="border-b border-line bg-white px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Spot
          </p>
          <h1 className="mt-1 text-xl font-bold text-ink">{spot.name}</h1>
          <p className="mt-2 text-sm text-inkmuted">{t('spotPage.intro')}</p>
        </div>
      </header>

      <section className="relative h-[52vh] min-h-[300px] w-full border-b border-line bg-surface">
        <Globe
          points={points}
          loading={globeLoading}
          errorMsg={null}
          onCountryClick={handleCountryClick}
        />
        <a
          href="/"
          className="absolute bottom-3 right-3 rounded-full border border-line bg-white/90 px-3 py-1 text-xs font-semibold text-accent shadow-sm backdrop-blur"
        >
          {t('spotPage.viewFullscreen')}
        </a>
      </section>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {justPosted && (
          <p className="mb-4 rounded-xl bg-accentsoft px-4 py-3 text-sm font-semibold text-accentdark">
            {t('spotPage.postedThanks')}
          </p>
        )}

        <h2 className="mb-3 text-sm font-bold text-ink">
          {t('spotPage.postsFromHere')}
          <span className="ml-2 font-normal text-inkmuted">
            {poses.length}{t('spotPage.postsSuffix')}
          </span>
        </h2>

        {poses.length === 0 ? (
          <p className="rounded-xl border border-line bg-white px-4 py-8 text-center text-sm text-inkmuted">
            {t('spotPage.emptyLine1')}
            <br />
            {t('spotPage.emptyLine2')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {poses.map((p) => (
              <div
                key={p.id}
                className="flex gap-3 rounded-xl border border-line bg-white p-3 shadow-sm"
              >
                <img
                  src={p.image_url}
                  alt={p.country_name}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {flagEmoji(p.country_code)} {p.country_name}
                  </p>
                  {p.message && (
                    <p className="mt-1 break-words text-sm text-ink">{p.message}</p>
                  )}
                  <p className="mt-1 text-xs text-inkmuted">
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 bg-gradient-to-t from-white via-white/90 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10">
        <button
          type="button"
          onClick={() => setShowCapture(true)}
          className="w-full max-w-md rounded-full bg-accent py-4 text-lg font-bold text-white shadow-lg shadow-accent/30 active:scale-95"
        >
          {t('spotPage.postButton')}
        </button>
        <a
          href="/?terms=1"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-inkmuted underline"
        >
          {t('app.termsLink')}
        </a>
      </div>

      {showCapture && (
        <CaptureModal
          spot={spot}
          allowSpotChange={false}
          onClose={() => setShowCapture(false)}
          onPosted={handlePosted}
        />
      )}

      {selectedCountryPoint && (
        <CountryGallery
          countryPoint={selectedCountryPoint}
          onClose={() => setSelectedCountryPoint(null)}
          onSelectPose={(pose) => {
            setSelectedCountryPoint(null)
            setSelectedPose(pose)
          }}
        />
      )}

      {selectedPose && (
        <PinDetail pose={selectedPose} onClose={() => setSelectedPose(null)} />
      )}
    </div>
  )
}
