import { useCallback, useEffect, useState } from 'react'
import PageHeader from './PageHeader.jsx'
import { useAuth } from '../auth.jsx'
import { downloadFile } from '../ics.js'
import { supabase } from '../supabase.js'
import { href } from '../useRoute.js'

const EASE_LABELS = { 1: 'Very hard', 2: 'Hard', 3: 'Okay', 4: 'Easy', 5: 'Very easy' }
const CSV_COLUMNS = ['created_at', 'ease', 'made_sense', 'page', 'role', 'age_group', 'comments']

const when = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

// Quote every cell; a leading ' stops spreadsheet apps from running a comment as a formula.
function toCsv(rows) {
  const cell = (value) => {
    let text = String(value ?? '')
    if (/^[=+\-@]/.test(text)) text = `'${text}`
    return `"${text.replace(/"/g, '""')}"`
  }
  return [CSV_COLUMNS.join(','), ...rows.map((r) => CSV_COLUMNS.map((c) => cell(r[c])).join(','))].join('\r\n')
}

// The Admin tab only shows for admins, but the real protection is in the database
// (supabase/schema.sql): it refuses this data to anyone who is not an admin.
export default function AdminPage() {
  const { user, isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="card">
          <h1>Admins only</h1>
          <p>
            {user ? 'Your account is not an admin.' : 'Please sign in with an admin account.'}{' '}
            <a href={href(user ? '/' : '/account')}>{user ? 'Go to Simplify' : 'Go to sign in'}</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader path="/admin" />
      <FeedbackList />
      <AdminList />
    </div>
  )
}

function FeedbackList() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const { data, error: failed } = await supabase
      .from('feedback')
      .select('id, created_at, ease, made_sense, page, role, age_group, comments')
      .order('created_at', { ascending: false })
      .limit(1000)
    if (failed) setError('Could not load the feedback. Check your internet connection and try again.')
    else setRows(data)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rated = (rows ?? []).filter((r) => r.ease)
  const average = rated.length ? (rated.reduce((sum, r) => sum + r.ease, 0) / rated.length).toFixed(1) : null
  const count = (answer) => (rows ?? []).filter((r) => r.made_sense === answer).length

  return (
    <section className="card table-card" aria-labelledby="h-admin-feedback">
      <h2 id="h-admin-feedback">Feedback</h2>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {rows === null && !error && <p role="status">Loading feedback...</p>}

      {rows && (
        <>
          <dl className="stats">
            <div>
              <dt>Responses</dt>
              <dd>{rows.length}</dd>
            </div>
            <div>
              <dt>Average ease (1 to 5)</dt>
              <dd>{average ?? 'None yet'}</dd>
            </div>
            <div>
              <dt>Made sense</dt>
              <dd>
                {count('yes')} yes, {count('partly')} partly, {count('no')} no
              </dd>
            </div>
          </dl>

          <div className="button-row">
            <button type="button" className="btn btn-ghost" onClick={load}>
              Check for new feedback
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={rows.length === 0}
              onClick={() => downloadFile(toCsv(rows), 'simplymed-feedback.csv', 'text/csv')}
            >
              Download as a spreadsheet (CSV)
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="hint">No feedback yet.</p>
          ) : (
            <table className="med-table admin-table">
              <caption className="visually-hidden">Feedback, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Ease</th>
                  <th scope="col">Made sense</th>
                  <th scope="col">About</th>
                  <th scope="col">Who</th>
                  <th scope="col">Comments</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td data-label="When">{when(r.created_at)}</td>
                    <td data-label="Ease">{r.ease ? `${r.ease} (${EASE_LABELS[r.ease]})` : <Blank />}</td>
                    <td data-label="Made sense">{r.made_sense ?? <Blank />}</td>
                    <td data-label="About">{r.page ?? <Blank />}</td>
                    <td data-label="Who">
                      {[r.role, r.age_group].filter(Boolean).join(', ') || <Blank />}
                    </td>
                    <td data-label="Comments" className="comment-cell">
                      {r.comments ?? <Blank />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  )
}

const Blank = () => <span className="muted">Not answered</span>

function AdminList() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const { data, error: failed } = await supabase
      .from('admins')
      .select('user_id, email, granted_by, created_at')
      .order('created_at')
    if (failed) setError('Could not load the list of admins.')
    else setAdmins(data)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleGrant(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const { data, error: failed } = await supabase.rpc('grant_admin', { target_email: email })
    setBusy(false)
    if (failed) {
      // The database writes these messages in plain words (see schema.sql).
      setError(failed.message || 'Could not make that person an admin. Please try again.')
      return
    }
    setMessage(`${data} is now an admin. They will see the Admin tab the next time they open SimplyMed.`)
    setEmail('')
    load()
  }

  async function handleRevoke(admin) {
    if (!window.confirm(`Remove admin access for ${admin.email}?`)) return
    setError('')
    setMessage('')
    const { error: failed } = await supabase.rpc('revoke_admin', { target_user: admin.user_id })
    if (failed) setError(failed.message || 'Could not remove that admin. Please try again.')
    else {
      setMessage(`${admin.email} is no longer an admin.`)
      load()
    }
  }

  return (
    <section className="card" aria-labelledby="h-admin-people">
      <h2 id="h-admin-people">Admins</h2>
      <p>Admins can read all feedback and make other people admins. Only add people you trust.</p>

      {admins === null && !error && <p role="status">Loading admins...</p>}
      {admins && (
        <ul className="admin-list">
          {admins.map((a) => (
            <li key={a.user_id}>
              <div>
                <strong>{a.email}</strong>
                {a.user_id === user.id && <span className="badge badge-plain">You</span>}
                <span className="hint">
                  Added {when(a.created_at)}
                  {a.granted_by && ` by ${a.granted_by}`}
                </span>
              </div>
              {a.user_id !== user.id && (
                <button
                  type="button"
                  className="btn btn-ghost btn-small btn-danger-outline"
                  onClick={() => handleRevoke(a)}
                >
                  Remove <span className="visually-hidden">{a.email} as admin</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleGrant} className="grant-form">
        <div className="form-field">
          <label htmlFor="admin-email" className="field-label">
            Make someone an admin
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="off"
            placeholder="their-email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby="admin-email-hint"
            required
          />
          <p id="admin-email-hint" className="hint">
            They must already have a SimplyMed account with this email.
          </p>
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || !email.trim()}>
          {busy ? 'Please wait...' : 'Make admin'}
        </button>
      </form>

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
    </section>
  )
}
