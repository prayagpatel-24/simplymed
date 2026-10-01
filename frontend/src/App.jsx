import { useEffect, useState } from 'react'
import InputView from './components/InputView.jsx'
import CarePlan from './components/CarePlan.jsx'
import MedicinesPage from './components/MedicinesPage.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import { CareStoreProvider } from './store.jsx'
import { ROUTES, href, useRoute } from './useRoute.js'
import { usePersistentState, useSessionState } from './usePersistentState.js'

export default function App() {
  const route = useRoute()
  const [result, setResult] = useSessionState('simplymed-result', null)
  const [logoFailed, setLogoFailed] = useState(false)
  const [textScale, setTextScale] = usePersistentState('simplymed-text-scale', 1)

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', textScale)
  }, [textScale])

  const showResult = (data) => {
    setResult(data)
    window.scrollTo({ top: 0 })
  }

  return (
    <CareStoreProvider>
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
      <header className="site-header no-print">
        <div className="site-header-inner">
          <a className="brand" href={href('/')} aria-label="SimplyMed home">
            {/* The logo lives at public/logo.png. Until it's added, the text version shows. */}
            {logoFailed ? (
              <span className="brand-name">Simply Med</span>
            ) : (
              <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="SimplyMed" onError={() => setLogoFailed(true)} />
            )}
          </a>
          <nav className="site-nav" aria-label="Main">
            <ul>
              {ROUTES.map((r) => (
                <li key={r.path}>
                  <a href={href(r.path)} aria-current={route === r.path ? 'page' : undefined}>
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="container" tabIndex={-1}>
        {route === '/medicines' && <MedicinesPage />}
        {route === '/calendar' && <CalendarPage />}
        {route === '/settings' && <SettingsPage textScale={textScale} onTextScaleChange={setTextScale} />}
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
    </CareStoreProvider>
  )
}
