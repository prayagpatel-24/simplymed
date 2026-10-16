import { useState } from 'react'
import { simplify } from '../api.js'
import { LanguageSelect, useI18n } from '../i18n/index.jsx'
import { SAMPLES, SAMPLE_GROUPS } from '../samples.js'
import { useCareStore } from '../store.jsx'
import PageHeader from './PageHeader.jsx'

const MAX_CHARS = 8000

export default function InputView({ onResult }) {
  const { t, language } = useI18n()
  const [text, setText] = useState('')
  const { profile, updateProfile } = useCareStore()
  const [age, setAge] = useState(profile.age ?? '')
  const [example, setExample] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ageNumber = age === '' ? null : Number(age)
  const ageValid = ageNumber === null || (Number.isInteger(ageNumber) && ageNumber >= 0 && ageNumber <= 120)
  const canSubmit = text.trim().length >= 10 && confirmed && ageValid && !loading

  function applyExample() {
    const sample = SAMPLES[Number(example)]
    if (!sample) return
    setText(sample.text)
    setAge(sample.age ?? '')
    document.getElementById('instructions')?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    if (ageNumber !== (profile.age ?? null)) updateProfile({ age: ageNumber })
    try {
      onResult(await simplify({ text, language, age: ageNumber }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="input-view">
      <PageHeader path="/" />

      <div className="notice" role="note">
        <strong>{t('input.noticeStrong')}</strong> {t('input.notice')}
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="samples">
          <label htmlFor="example" className="field-label">
            {t('input.examples')}
          </label>
          <div className="sample-picker">
            <select id="example" value={example} onChange={(e) => setExample(e.target.value)}>
              <option value="">{t('input.pickExample')}</option>
              {SAMPLE_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {SAMPLES.map((s, i) =>
                    s.group === group ? (
                      <option key={i} value={i}>
                        {s.label}
                      </option>
                    ) : null,
                  )}
                </optgroup>
              ))}
            </select>
            <button type="button" className="btn btn-ghost" onClick={applyExample} disabled={example === ''}>
              {t('input.useExample')}
            </button>
          </div>
        </div>

        <label htmlFor="instructions" className="field-label">
          {t('input.paste')}
        </label>
        <textarea
          id="instructions"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_CHARS}
          rows={10}
          dir="auto"
          aria-describedby="char-count"
          placeholder={t('input.placeholder')}
        />
        <p id="char-count" className="hint">
          {t('input.chars', { n: text.length, max: MAX_CHARS })}
        </p>

        <div className="options">
          <div>
            <label htmlFor="age" className="field-label">
              {t('input.age')}
            </label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min="0"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              aria-describedby="age-hint"
              aria-invalid={!ageValid}
            />
            <p id="age-hint" className="hint">
              {ageValid ? t('input.ageHint') : t('input.ageInvalid')}
            </p>
          </div>

          <LanguageSelect id="language" label={t('input.language')} hint={t('input.languageHint')} />
        </div>

        <label className="checkbox confirm">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          {t('input.confirm')}
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-large" disabled={!canSubmit} aria-busy={loading}>
          {loading ? t('input.working') : t('input.submit')}
        </button>
      </form>
    </div>
  )
}
