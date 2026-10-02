import { useEffect, useState } from 'react'
import InputView from './components/InputView.jsx'
import CarePlan from './components/CarePlan.jsx'
import MedicinesPage from './components/MedicinesPage.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import HelpPage from './components/HelpPage.jsx'
import FeedbackPage from './components/FeedbackPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import AccountPage from './components/AccountPage.jsx'
import Icon from './components/Icon.jsx'
import { AuthProvider, useAuth } from './auth.jsx'
import { CareStoreProvider, useCareStore } from './store.jsx'
import { ROUTES, href, useRoute } from './useRoute.js'
import { usePersistentState, useSessionState } from './usePersistentState.js'

export default function App() {
  return (
    <AuthProvider>
      <CareStoreProvider>
        <Shell />
      </CareStoreProvider>
    </AuthProvider>
  )
}

function Shell() {
  const route = useRoute()
  const { user } = useAuth()
  const { profile, updateProfile, syncError, imported, dismissImported } = useCareStore()
  const [result, setResult] = useSessionState('simplymed-result', null)
  const [logoFailed, setLogoFailed] = useState(false)
  const [textScale, setTextScale] = usePersistentState('simplymed-text-scale', 1)

  // A signed-in person's text size follows them to any device.
  useEffect(() => {
    if (profile.textScale) setTextScale(Number(profile.textScale))
  }, [profile.textScale, setTextScale])

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', textScale)
  }, [textScale])

  const changeTextScale = (scale) => {
    setTextScale(scale)
    updateProfile({ textScale: scale })
  }

  const showResult = (data) => {
    setResult(data)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      {/* Pages use the URL hash, so the skip link moves focus itself instead of changing it. */}
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Skip to main content
      </a>

      <div className="app-shell">
        <aside className="sidebar no-print">
          <a className="brand" href={href('/')} aria-label="SimplyMed home">
            {logoFailed ? (
              <span className="brand-name">Simply Med</span>
            ) : (
              <img className="brand-logo" src="/logo.png" alt="SimplyMed" onError={() => setLogoFailed(true)} />
            )}
          </a>
          <nav aria-label="Main">
            <ul className="tabs">
              {ROUTES.map((r) => (
                <li key={r.path}>
                  <a
                    className={`tab tint-${r.tint}`}
                    href={href(r.path)}
                    aria-current={route === r.path ? 'page' : undefined}
                  >
                    <span className="tab-icon">
                      <Icon name={r.icon} />
                    </span>
                    <span className="tab-label">
                      {r.path === '/account' && !user ? 'Sign in' : r.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="account-status">
            {user ? (
              <>
                Signed in as <strong>{user.email}</strong>
              </>
            ) : (
              'Not signed in. Your list is kept until you close this tab.'
            )}
          </p>
        </aside>

        <div className="content">
          {syncError && (
            <p className="error container" role="alert">
              {syncError}
            </p>
          )}
          {imported > 0 && (
            <p className="note container" role="status">
              We moved {imported} {imported === 1 ? 'item' : 'items'} you saved before signing in into your account.{' '}
              <button type="button" className="link-button" onClick={dismissImported}>
                OK
              </button>
            </p>
          )}

          <main id="main" className="container" tabIndex={-1}>
            {route === '/medicines' && <MedicinesPage />}
            {route === '/calendar' && <CalendarPage />}
            {route === '/help' && <HelpPage carePlan={result?.plan ?? null} />}
            {route === '/feedback' && <FeedbackPage />}
            {route === '/settings' && <SettingsPage textScale={textScale} onTextScaleChange={changeTextScale} />}
            {route === '/account' && <AccountPage />}
            {route === '/' &&
              (result ? (
                <CarePlan result={result} onStartOver={() => setResult(null)} />
              ) : (
                <InputView onResult={showResult} />
              ))}
          </main>

          <footer className="site-footer">
            <div className="container">
              <p>
                <strong>SimplyMed is a student research prototype.</strong> It rewrites instructions so
                they are easier to read. It is not medical advice and does not replace your doctor,
                nurse, or pharmacist. Always follow the original instructions from your care team.
                In an emergency, call 911.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
