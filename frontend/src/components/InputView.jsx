import { useState } from 'react'
import { simplify } from '../api.js'
import { SAMPLES } from '../samples.js'
import { usePersistentState } from '../usePersistentState.js'
import { DEFAULTS_KEY, DEFAULT_OPTIONS, LANGUAGES } from '../settings.js'

const MAX_CHARS = 8000

export default function InputView({ onResult }) {
  const [text, setText] = useState('')
  const [defaults] = usePersistentState(DEFAULTS_KEY, DEFAULT_OPTIONS)
  const [language, setLanguage] = useState(defaults.language)
  const [readingLevel, setReadingLevel] = useState(defaults.readingLevel)
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = text.trim().length >= 10 && confirmed && !loading

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      onResult(await simplify({ text, language, readingLevel }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="input-view">
      <section className="hero">
        <p className="eyebrow">Plain-language medical instructions</p>
        <h1>Understand your care instructions</h1>
        <p className="lead">
          Paste confusing discharge papers or a prescription label. SimplyMed turns them into a
          clear care plan with your medicines, what to do, and when to get help.
        </p>
      </section>

      <div className="notice" role="note">
        <strong>Use made-up examples only.</strong> This is a student research prototype. Please do
        not paste real names, birth dates, or record numbers.
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="samples">
          <span id="samples-label">Try an example:</span>
          <div className="sample-buttons" role="group" aria-labelledby="samples-label">
            {SAMPLES.map((s) => (
              <button key={s.label} type="button" className="btn btn-ghost" onClick={() => setText(s.text)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <label htmlFor="instructions" className="field-label">
          Paste the instructions here
        </label>
        <textarea
          id="instructions"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_CHARS}
          rows={10}
          aria-describedby="char-count"
          placeholder="For example: Take 1 tab PO BID with food x 10 days"
        />
        <p id="char-count" className="hint">
          {text.length} of {MAX_CHARS} characters
        </p>

        <div className="options">
          <fieldset>
            <legend className="field-label">How simple should it be?</legend>
            <label className="radio">
              <input
                type="radio"
                name="level"
                checked={readingLevel === 'very_simple'}
                onChange={() => setReadingLevel('very_simple')}
              />
              Very simple
            </label>
            <label className="radio">
              <input
                type="radio"
                name="level"
                checked={readingLevel === 'simple'}
                onChange={() => setReadingLevel('simple')}
              />
              Simple
            </label>
          </fieldset>

          <div>
            <label htmlFor="language" className="field-label">
              Language
            </label>
            <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="checkbox confirm">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          I confirm this is a made-up example, not a real person's medical information.
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-large" disabled={!canSubmit} aria-busy={loading}>
          {loading ? 'Working on it... this can take up to 30 seconds' : 'Make it simpler'}
        </button>
      </form>
    </div>
  )
}
