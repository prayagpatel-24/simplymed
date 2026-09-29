import { useState } from 'react'
import TextSizeControl from './TextSizeControl.jsx'
import { useCareStore } from '../store.jsx'
import { usePersistentState } from '../usePersistentState.js'
import { DEFAULTS_KEY, DEFAULT_OPTIONS, LANGUAGES } from '../settings.js'

export default function SettingsPage({ textScale, onTextScaleChange }) {
  const { medicines, events, clearAll } = useCareStore()
  const [defaults, setDefaults] = usePersistentState(DEFAULTS_KEY, DEFAULT_OPTIONS)
  const [cleared, setCleared] = useState(false)

  function handleClear() {
    if (!window.confirm('Delete all medicines and calendar events you saved? This cannot be undone.')) return
    clearAll()
    setCleared(true)
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <section className="card" aria-labelledby="h-display">
        <h2 id="h-display">Reading</h2>
        <TextSizeControl value={textScale} onChange={onTextScaleChange} />
        <p className="hint">The text size is remembered on this device.</p>
      </section>

      <section className="card" aria-labelledby="h-defaults">
        <h2 id="h-defaults">When I simplify instructions</h2>
        <fieldset>
          <legend className="field-label">How simple should it be?</legend>
          <label className="radio">
            <input
              type="radio"
              name="default-level"
              checked={defaults.readingLevel === 'very_simple'}
              onChange={() => setDefaults({ ...defaults, readingLevel: 'very_simple' })}
            />
            Very simple
          </label>
          <label className="radio">
            <input
              type="radio"
              name="default-level"
              checked={defaults.readingLevel === 'simple'}
              onChange={() => setDefaults({ ...defaults, readingLevel: 'simple' })}
            />
            Simple
          </label>
        </fieldset>
        <div className="field-row wide">
          <label htmlFor="default-language" className="field-label">
            Language
          </label>
          <select
            id="default-language"
            value={defaults.language}
            onChange={(e) => setDefaults({ ...defaults, language: e.target.value })}
          >
            {LANGUAGES.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <p className="hint">You can still change these each time you simplify.</p>
      </section>

      <section className="card" aria-labelledby="h-data">
        <h2 id="h-data">My saved information</h2>
        <p>
          Your medicines and calendar are kept only in this browser tab. They are never sent to
          the AI or saved on a server, and they are deleted when you close this tab.
        </p>
        <p>
          Right now you have {medicines.length} {medicines.length === 1 ? 'medicine' : 'medicines'} and{' '}
          {events.length} calendar {events.length === 1 ? 'event' : 'events'} saved.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleClear}
          disabled={medicines.length === 0 && events.length === 0}
        >
          Delete my medicines and calendar
        </button>
        {cleared && (
          <p className="note" role="status">
            Deleted.
          </p>
        )}
      </section>
    </div>
  )
}
