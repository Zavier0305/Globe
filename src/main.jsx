import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LanguageProvider } from './lib/i18n/LanguageContext.jsx'
import './index.css'

const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'))
const TermsPage = lazy(() => import('./components/TermsPage.jsx'))
const SpotPage = lazy(() => import('./components/SpotPage.jsx'))
const SpotBoard = lazy(() => import('./components/SpotBoard.jsx'))

const params = new URLSearchParams(window.location.search)
const isAdmin = params.get('admin') === '1'
const isTerms = params.get('terms') === '1'

// /spot/<slug> と /spot/<slug>/board を解釈する
// (SPAなので vercel.json のリライトで全パスが index.html に流れてくる)
const segments = window.location.pathname.split('/').filter(Boolean)
const spotSlug = segments[0] === 'spot' ? segments[1] : null
const isSpotBoard = Boolean(spotSlug) && segments[2] === 'board'

function withSuspense(node) {
  return <Suspense fallback={null}>{node}</Suspense>
}

function Root() {
  if (isAdmin) return withSuspense(<AdminPanel />)
  if (isTerms) return withSuspense(<TermsPage />)
  if (spotSlug && isSpotBoard) {
    return withSuspense(
      <SpotBoard slug={spotSlug} token={params.get('key')} />
    )
  }
  if (spotSlug) return withSuspense(<SpotPage slug={spotSlug} />)
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <Root />
    </LanguageProvider>
  </React.StrictMode>
)
