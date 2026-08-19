import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'))
const TermsPage = lazy(() => import('./components/TermsPage.jsx'))

const params = new URLSearchParams(window.location.search)
const isAdmin = params.get('admin') === '1'
const isTerms = params.get('terms') === '1'

function Root() {
  if (isAdmin) {
    return (
      <Suspense fallback={null}>
        <AdminPanel />
      </Suspense>
    )
  }
  if (isTerms) {
    return (
      <Suspense fallback={null}>
        <TermsPage />
      </Suspense>
    )
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
