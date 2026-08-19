import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'))

const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminPanel />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
)
