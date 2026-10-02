import { useState } from 'react'
import PageHeader from './PageHeader.jsx'
import { supabase } from '../supabase.js'
import { ROUTES } from '../useRoute.js'

const EASE = [
  [1, 'Very hard'],
  [2, 'Hard'],
  [3, 'Okay'],
  [4, 'Easy'],
  [5, 'Very easy'],
]
const MADE_SENSE = [
  ['yes', 'Yes'],
  ['partly', 'Partly'],
  ['no', 'No'],
]
const ROLES = ['Patient', 'Family member or caregiver', 'Doctor, nurse, or pharmacist', 'Other']
const AGE_GROUPS = ['Under 18', '18 to 44', '45 to 64', '65 to 74', '75 or older']

const empty = { ease: null, madeSense: '', page: 'Whole app', role: '', ageGroup: '', comments: '' }

export default function FeedbackPage() {
  const [form, setForm] = useState(empty)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.ease) return
    setStatus('sending')
    const { error } = await supabase.from('feedback').insert({
      ease: form.ease,
      made_sense: form.madeSense || null,
      page: form.page,
      role: form.role || null,
      age_group: form.ageGroup || null,
      comments: form.comments.trim().slice(0, 2000) || null,
    })
    setStatus(error ? 'error' : 'sent')
    if (!error) setForm(empty)
  }

  return (
    <div className="page">
      <PageHeader path="/feedback" />

      {!supabase && (
        <p className="notice" role="note">
          Feedback is not connected yet. For the person running SimplyMed: add the Supabase settings
          described in the README.
        </p>
      )}

      {status === 'sent' ? (
        <div className="card success" role="status">
          <h2>Thank you!</h2>
          <p>Your feedback was sent. It helps us make SimplyMed easier for everyone.</p>
          <button type="button" className="btn btn-ghost" onClick={() => setStatus('idle')}>
            Send more feedback
          </button>
        </div>
      ) : (
        <form className="card" onSubmit={handleSubmit} aria-label="Feedback">
          <fieldset className="choice-group">
            <legend className="field-label">How easy was SimplyMed to use? (required)</legend>
            <div className="choice-row">
              {EASE.map(([value, label]) => (
                <label key={value} className="choice">
                  <input
                    type="radio"
                    name="ease"
                    checked={form.ease === value}
                    onChange={() => setForm((f) => ({ ...f, ease: value }))}
                    required
                  />
                  <span>
                    <strong>{value}</strong> {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="choice-group">
            <legend className="field-label">Did the simpler version make sense?</legend>
            <div className="choice-row">
              {MADE_SENSE.map(([value, label]) => (
                <label key={value} className="choice">
                  <input
                    type="radio"
                    name="made-sense"
                    checked={form.madeSense === value}
                    onChange={() => setForm((f) => ({ ...f, madeSense: value }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="fb-page" className="field-label">
                Which part is this about?
              </label>
              <select id="fb-page" value={form.page} onChange={set('page')}>
                <option>Whole app</option>
                {ROUTES.filter((r) => r.path !== '/feedback').map((r) => (
                  <option key={r.path}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="fb-role" className="field-label">
                I am a... (optional)
              </label>
              <select id="fb-role" value={form.role} onChange={set('role')}>
                <option value="">Prefer not to say</option>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="fb-age" className="field-label">
                My age group (optional)
              </label>
              <select id="fb-age" value={form.ageGroup} onChange={set('ageGroup')}>
                <option value="">Prefer not to say</option>
                {AGE_GROUPS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="fb-comments" className="field-label">
              What was confusing, or what would you change? (optional)
            </label>
            <textarea
              id="fb-comments"
              rows={5}
              maxLength={2000}
              value={form.comments}
              onChange={set('comments')}
              aria-describedby="fb-comments-hint"
            />
            <p id="fb-comments-hint" className="hint">
              Please do not include names or medical details.
            </p>
          </div>

          {status === 'error' && (
            <p className="error" role="alert">
              Your feedback could not be sent. Check your internet connection and try again.
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={!supabase || !form.ease || status === 'sending'}
            aria-busy={status === 'sending'}
          >
            {status === 'sending' ? 'Sending...' : 'Send feedback'}
          </button>
        </form>
      )}
    </div>
  )
}
