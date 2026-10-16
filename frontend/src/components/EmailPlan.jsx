import { useState } from 'react'
import { useAuth } from '../auth.jsx'
import { MAILTO_SAFE_LENGTH, carePlanText, looksLikeEmail, mailtoLink } from '../email.js'
import { useI18n } from '../i18n/index.jsx'

// Email the care plan. This opens the person's own email app (a mailto: link) with the plan
// typed in; they press Send. SimplyMed's server never sends, sees, or keeps the email.
export default function EmailPlan({ result }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [to, setTo] = useState('')
  const [touched, setTouched] = useState(false)
  const [copied, setCopied] = useState(null)

  const body = carePlanText(result, t)
  const link = (address) => mailtoLink(address, t('email.subject'), body)
  const long = link(user?.email ?? to).length > MAILTO_SAFE_LENGTH
  const valid = looksLikeEmail(to)

  function handleSend(e) {
    e.preventDefault()
    setTouched(true)
    if (valid) window.location.href = link(to)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body)
      setCopied('ok')
    } catch {
      setCopied('failed')
    }
  }

  return (
    <section className="card no-print" aria-labelledby="h-email">
      <h2 id="h-email">{t('email.title')}</h2>
      <p>{t('email.intro')}</p>

      {user?.email ? (
        <>
          <a className="btn btn-primary" href={link(user.email)}>
            {t('email.toMe')}
          </a>
          <p className="hint">{t('email.toMeAt', { email: user.email })}</p>
        </>
      ) : (
        <form className="email-form" onSubmit={handleSend} noValidate>
          <label htmlFor="email-to" className="field-label">
            {t('email.address')}
          </label>
          <div className="email-row">
            <input
              id="email-to"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-invalid={touched && !valid}
              aria-describedby={touched && !valid ? 'email-error' : undefined}
            />
            <button type="submit" className="btn btn-primary">
              {t('email.send')}
            </button>
          </div>
          {touched && !valid && (
            <p id="email-error" className="field-problem">
              {t('email.invalid')}
            </p>
          )}
        </form>
      )}

      <div className="button-row">
        <button type="button" className="btn btn-ghost" onClick={handleCopy}>
          {t('email.copy')}
        </button>
      </div>
      {copied && (
        <p className={copied === 'ok' ? 'note' : 'error'} role="status">
          {copied === 'ok' ? t('email.copied') : t('email.copyFailed')}
        </p>
      )}
      {long && <p className="hint">{t('email.long')}</p>}
    </section>
  )
}
