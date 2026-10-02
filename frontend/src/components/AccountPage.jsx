import { useState } from 'react'
import PageHeader from './PageHeader.jsx'
import { useAuth } from '../auth.jsx'
import { useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'

const MODES = {
  signIn: { title: 'Sign in', button: 'Sign in' },
  signUp: { title: 'Create a free account', button: 'Create my account' },
  reset: { title: 'Forgot your password?', button: 'Email me a reset link' },
}

export default function AccountPage() {
  const auth = useAuth()
  const { medicines, events } = useCareStore()

  if (!auth.configured) {
    return (
      <div className="page">
        <PageHeader path="/account" />
        <div className="card">
          <h2>Accounts are not turned on yet</h2>
          <p>
            You can still use everything. Your medicines and calendar are kept until you close this tab.
          </p>
          <p className="hint">
            For the person running SimplyMed: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see the README).
          </p>
        </div>
      </div>
    )
  }

  if (auth.recovering) return <NewPasswordForm />

  if (auth.user) {
    return (
      <div className="page">
        <PageHeader path="/account" />
        <section className="card" aria-labelledby="h-signed-in">
          <h2 id="h-signed-in">You are signed in</h2>
          <p>
            Email: <strong>{auth.user.email}</strong>
          </p>
          <p>
            Your {medicines.length} {medicines.length === 1 ? 'medicine' : 'medicines'} and {events.length} calendar{' '}
            {events.length === 1 ? 'event' : 'events'} are saved to your account. Sign in on any device to
            see them.
          </p>
          <SignOutButton />
        </section>
      </div>
    )
  }

  return <SignInForms />
}

function SignInForms() {
  const auth = useAuth()
  const [mode, setMode] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function switchTo(next) {
    setMode(next)
    setError('')
    setMessage('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'signIn') {
        await auth.signIn(email.trim(), password)
        window.location.hash = '#/medicines'
      } else if (mode === 'signUp') {
        const { needsConfirmation } = await auth.signUp(email.trim(), password)
        if (needsConfirmation) {
          setMessage('Almost done! We sent you an email. Tap the link in it, then come back and sign in.')
          setMode('signIn')
        } else {
          window.location.hash = '#/medicines'
        }
      } else {
        await auth.sendReset(email.trim())
        setMessage('If there is an account for that email, we sent a link to reset your password. Check your email.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const { title, button } = MODES[mode]

  return (
    <div className="page">
      <PageHeader path="/account" />

      <div className="segmented" role="group" aria-label="Choose what to do">
        <button type="button" aria-pressed={mode !== 'signUp'} onClick={() => switchTo('signIn')}>
          I have an account
        </button>
        <button type="button" aria-pressed={mode === 'signUp'} onClick={() => switchTo('signUp')}>
          I'm new here
        </button>
      </div>

      <form className="card account-form" onSubmit={handleSubmit} aria-labelledby="h-account">
        <h2 id="h-account">{title}</h2>
        {mode === 'signUp' && (
          <p className="hint">
            Use a made-up test email if you are trying SimplyMed for the study. Never store real patient
            information.
          </p>
        )}
        <div className="form-field">
          <label htmlFor="account-email" className="field-label">
            Email
          </label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {mode !== 'reset' && (
          <div className="form-field">
            <label htmlFor="account-password" className="field-label">
              Password {mode === 'signUp' && '(at least 6 characters)'}
            </label>
            <input
              id="account-password"
              type="password"
              autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="note" role="status">
            {message}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-large" disabled={busy} aria-busy={busy}>
          {busy ? 'Please wait...' : button}
        </button>

        <div className="button-row">
          {mode === 'reset' ? (
            <button type="button" className="link-button" onClick={() => switchTo('signIn')}>
              Back to sign in
            </button>
          ) : (
            <button type="button" className="link-button" onClick={() => switchTo('reset')}>
              Forgot your password?
            </button>
          )}
        </div>
      </form>

      <p>
        <a href={href('/')}>Continue without an account</a>. Your list is kept only until you close this tab.
      </p>
    </div>
  )
}

function NewPasswordForm() {
  const auth = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await auth.setNewPassword(password)
      window.location.hash = '#/medicines'
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHeader path="/account" />
      <form className="card account-form" onSubmit={handleSubmit} aria-labelledby="h-new-password">
        <h2 id="h-new-password">Choose a new password</h2>
        <div className="form-field">
          <label htmlFor="new-password" className="field-label">
            New password (at least 6 characters)
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-large" disabled={busy}>
          Save my new password
        </button>
      </form>
    </div>
  )
}

function SignOutButton() {
  const auth = useAuth()
  const [error, setError] = useState('')
  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => auth.signOut().catch((err) => setError(err.message))}
      >
        Sign out
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
