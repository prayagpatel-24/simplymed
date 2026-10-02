import { useState } from 'react'
import PageHeader from './PageHeader.jsx'
import TextSizeControl from './TextSizeControl.jsx'
import { useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'
import { usePersistentState } from '../usePersistentState.js'
import { DEFAULTS_KEY, DEFAULT_OPTIONS, LANGUAGES } from '../settings.js'

export default function SettingsPage({ textScale, onTextScaleChange }) {
  const { signedIn, medicines, events, clearAll } = useCareStore()
  const [defaults, setDefaults] = usePersistentState(DEFAULTS_KEY, DEFAULT_OPTIONS)
  const [cleared, setCleared] = useState(false)

  function handleClear() {
    if (!window.confirm('Delete all medicines and calendar events you saved? This cannot be undone.')) return
    clearAll()
    setCleared(true)
  }

  return (
    <div className="page">
      <PageHeader path="/settings" />

      <section className="card" aria-labelledby="h-display">
        <h2 id="h-display">Reading</h2>
        <TextSizeControl value={textScale} onChange={onTextScaleChange} />
        <p className="hint">
          The words get bigger on every page.{' '}
          {signedIn ? 'Your choice is saved to your account.' : 'Your choice is remembered on this device.'}
        </p>
        <p className="sample-text" aria-hidden="true">
          Example: Take 1 tablet 2 times a day with food.
        </p>
      </section>

      <section className="card" aria-labelledby="h-defaults">
        <h2 id="h-defaults">Language</h2>
        <div className="field-row wide">
          <label htmlFor="default-language" className="field-label">
            Write my care plans in
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
        <p className="hint">You can still change this each time you simplify.</p>
      </section>

      <section className="card" aria-labelledby="h-data">
        <h2 id="h-data">My saved information</h2>
        {signedIn ? (
          <p>
            Your medicines and calendar are saved to your account, so they are here every time you sign
            in. The full instructions you paste are not saved, and the AI does not keep anything.
          </p>
        ) : (
          <p>
            You are not signed in, so your medicines and calendar are kept only until you close this tab.{' '}
            <a href={href('/account')}>Sign in or create an account</a> to keep them.
          </p>
        )}
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
