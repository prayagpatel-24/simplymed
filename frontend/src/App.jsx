import { useEffect, useRef, useState } from 'react'
import InputView from './components/InputView.jsx'
import CarePlan from './components/CarePlan.jsx'
import MedicinesPage from './components/MedicinesPage.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import HelpPage from './components/HelpPage.jsx'
import FeedbackPage from './components/FeedbackPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import AccountPage from './components/AccountPage.jsx'
import AdminPage from './components/AdminPage.jsx'
import Icon from './components/Icon.jsx'
import { simplify } from './api.js'
import { AuthProvider, useAuth } from './auth.jsx'
import { celebrate } from './confetti.js'
import { LanguageProvider, LanguageSelect, languageLabel, useI18n } from './i18n/index.jsx'
import { CareStoreProvider, useCareStore } from './store.jsx'
import { ROUTES, href, useRoute } from './useRoute.js'
import { usePersistentState, useSessionState } from './usePersistentState.js'

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CareStoreProvider>
          <Shell />
        </CareStoreProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

function Shell() {
  const route = useRoute()
  const { user, isAdmin } = useAuth()
  const { t, language } = useI18n()
  const { profile, updateProfile, syncError, imported, dismissImported } = useCareStore()
  const [result, setResult] = useSessionState('simplymed-result', null)
  const [justFinished, setJustFinished] = useState(false)
  const [rewrite, setRewrite] = useState(null) // { language, error? } while a plan is rewritten in a new language
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
    setJustFinished(true)
    window.scrollTo({ top: 0 })
    celebrate()
  }

  // Changing the language also rewrites the care plan on screen, from the same original
  // text (already scrubbed of personal details), so the whole app matches.
  // Only the newest request may update the screen, in case the language changes twice quickly.
  const latestRewrite = useRef(0)

  async function rewriteIn(target) {
    if (!result) return
    const id = ++latestRewrite.current
    setRewrite({ language: target })
    try {
      const data = await simplify({ text: result.original_text, language: target, age: profile.age ?? null })
      if (id !== latestRewrite.current) return
      setResult(data)
      setRewrite(null)
    } catch (err) {
      if (id === latestRewrite.current) setRewrite({ language: target, error: err.message })
    }
  }

  // Not on page load: a plan from earlier offers a "Rewrite it" button instead of calling the AI by itself.
  const firstLanguage = useRef(true)
  useEffect(() => {
    if (firstLanguage.current) {
      firstLanguage.current = false
      return
    }
    if (result && result.language !== language) rewriteIn(language)
    else if (result) {
      latestRewrite.current++ // Switched back to the plan's own language: drop any rewrite in progress.
      setRewrite(null)
    }
    // Only when the chosen language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  const startOver = () => {
    latestRewrite.current++
    setResult(null)
    setRewrite(null)
    setJustFinished(false)
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
        {t('skip')}
      </a>

      <div className="app-shell">
        <aside className="sidebar no-print">
          <a className="brand" href={href('/')} aria-label={t('nav.home')}>
            {logoFailed ? (
              <span className="brand-name">Simply Med</span>
            ) : (
              <img className="brand-logo" src="/logo.png" alt="SimplyMed" onError={() => setLogoFailed(true)} />
            )}
          </a>
          <nav aria-label={t('nav.main')}>
            <ul className="tabs">
              {ROUTES.filter((r) => !r.adminOnly || isAdmin).map((r) => (
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
                      {r.path === '/account' && !user ? t('nav.signIn') : t(`nav.${r.path}`)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="sidebar-language">
            <LanguageSelect id="sidebar-language" />
          </div>
          <p className="account-status">
            {user ? (
              <>
                {t('status.signedIn')} <strong>{user.email}</strong>
              </>
            ) : (
              t('status.guest')
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
              {t('imported', { n: imported })}{' '}
              <button type="button" className="link-button" onClick={dismissImported}>
                {t('ok')}
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
            {route === '/admin' && <AdminPage />}
            {route === '/' &&
              (result ? (
                <>
                  {rewrite && (
                    <div className={rewrite.error ? 'error rewrite-status' : 'note rewrite-status'} role={rewrite.error ? 'alert' : 'status'}>
                      <p>
                        {rewrite.error
                          ? t('plan.relanguageError', { language: languageLabel(rewrite.language), error: rewrite.error })
                          : t('plan.relanguage', { language: languageLabel(rewrite.language) })}
                      </p>
                      {rewrite.error && (
                        <button type="button" className="btn btn-primary" onClick={() => rewriteIn(rewrite.language)}>
                          {t('plan.tryAgain')}
                        </button>
                      )}
                    </div>
                  )}
                  {!rewrite && result.language !== language && (
                    <div className="note rewrite-status">
                      <p>{t('plan.otherLanguage', { language: languageLabel(result.language) })}</p>
                      <button type="button" className="btn btn-primary" onClick={() => rewriteIn(language)}>
                        {t('plan.rewriteIn', { language: languageLabel(language) })}
                      </button>
                    </div>
                  )}
                  <CarePlan
                    result={result}
                    justFinished={justFinished}
                    onDismissFinished={() => setJustFinished(false)}
                    onStartOver={startOver}
                  />
                </>
              ) : (
                <InputView onResult={showResult} />
              ))}
          </main>

          <footer className="site-footer">
            <div className="container">
              <p>
                <strong>{t('footer.title')}</strong> {t('footer.body')}
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
