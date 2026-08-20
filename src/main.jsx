import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'))
const TermsPage = lazy(() => import('./components/TermsPage.jsx'))
const ColonyPage = lazy(() => import('./components/ColonyPage.jsx'))
const ColonyBoard = lazy(() => import('./components/ColonyBoard.jsx'))

const params = new URLSearchParams(window.location.search)
const isAdmin = params.get('admin') === '1'
const isTerms = params.get('terms') === '1'

// /colony/<slug> と /colony/<slug>/board を解釈する
// (SPAなので vercel.json のリライトで全パスが index.html に流れてくる)
const segments = window.location.pathname.split('/').filter(Boolean)
const colonySlug = segments[0] === 'colony' ? segments[1] : null
const isColonyBoard = Boolean(colonySlug) && segments[2] === 'board'

function withSuspense(node) {
  return <Suspense fallback={null}>{node}</Suspense>
}

function Root() {
  if (isAdmin) return withSuspense(<AdminPanel />)
  if (isTerms) return withSuspense(<TermsPage />)
  if (colonySlug && isColonyBoard) {
    return withSuspense(
      <ColonyBoard slug={colonySlug} token={params.get('key')} />
    )
  }
  if (colonySlug) return withSuspense(<ColonyPage slug={colonySlug} />)
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
