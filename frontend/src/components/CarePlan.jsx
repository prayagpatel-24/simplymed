import { useEffect, useRef } from 'react'
import Checklist from './Checklist.jsx'
import EmailPlan from './EmailPlan.jsx'
import MedicationCard from './MedicationCard.jsx'
import Original from './Original.jsx'
import Readability from './Readability.jsx'
import ReminderBuilder from './ReminderBuilder.jsx'
import SafetyBanner from './SafetyBanner.jsx'
import { useI18n } from '../i18n/index.jsx'

const EMERGENCY = new Set(['call_911', 'go_to_er'])

export default function CarePlan({ result, justFinished, onDismissFinished, onStartOver }) {
  const { t } = useI18n()
  const { plan, safety, readability, original_text: original, removed_details: removed } = result
  const emergency = plan.warning_signs.filter((w) => EMERGENCY.has(w.action))
  const callDoctor = plan.warning_signs.filter((w) => !EMERGENCY.has(w.action))
  const ready = useRef(null)

  // Move focus to the "ready" message so screen readers announce it too.
  useEffect(() => {
    if (justFinished) ready.current?.focus()
  }, [justFinished])

  return (
    <article className="care-plan" lang={result.language}>
      {justFinished && (
        <div className="ready-banner no-print" role="status" tabIndex={-1} ref={ready}>
          <span className="ready-icon" aria-hidden="true">🎉</span>
          <div>
            <p className="ready-title">{t('plan.readyTitle')}</p>
            <p>{t('plan.readyBody')}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-small" onClick={onDismissFinished}>
            {t('plan.readyDismiss')}
          </button>
        </div>
      )}

      <div className="plan-actions no-print">
        <button type="button" className="btn btn-ghost" onClick={onStartOver}>
          {t('plan.startOver')}
        </button>
        <div className="button-row">
          {/* Pages use the URL hash, so this scrolls instead of linking to #h-email. */}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => document.getElementById('h-email')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('email.title')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            {t('plan.print')}
          </button>
        </div>
      </div>

      <header className="plan-header">
        <p className="eyebrow">SimplyMed</p>
        <h1>{t('plan.title')}</h1>
        {result.age && <p className="plan-for">{t('plan.writtenFor', { age: result.age })}</p>}
      </header>

      <SafetyBanner safety={safety} />

      {removed?.length > 0 && <p className="note">{t('plan.removed', { items: removed.join(', ') })}</p>}

      {emergency.length > 0 && (
        <section className="card urgent" aria-labelledby="h-emergency">
          <h2 id="h-emergency">
            <span aria-hidden="true">⚠ </span>
            {t('plan.emergency')}
          </h2>
          <WarningList items={emergency} />
        </section>
      )}

      {callDoctor.length > 0 && (
        <section className="card caution" aria-labelledby="h-call">
          <h2 id="h-call">{t('plan.callDoctor')}</h2>
          <WarningList items={callDoctor} />
        </section>
      )}

      <section className="card" aria-labelledby="h-summary">
        <h2 id="h-summary">{t('plan.summary')}</h2>
        <ul className="summary">
          {(Array.isArray(plan.summary) ? plan.summary : [plan.summary]).map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </section>

      {plan.medications.length > 0 && (
        <section aria-labelledby="h-meds">
          <h2 id="h-meds" className="section-title">
            {t('plan.meds')}
          </h2>
          {plan.medications.map((m, i) => (
            <MedicationCard key={i} med={m} />
          ))}
        </section>
      )}

      {plan.steps.length > 0 && (
        <section className="card" aria-labelledby="h-steps">
          <h2 id="h-steps">{t('plan.steps')}</h2>
          <ol className="steps">
            {plan.steps.map((s, i) => (
              <li key={i}>
                {s.text}
                <Original text={s.original_text} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {plan.follow_ups.length > 0 && (
        <section className="card" aria-labelledby="h-follow">
          <h2 id="h-follow">{t('plan.followUps')}</h2>
          <ul className="plain-list">
            {plan.follow_ups.map((f, i) => (
              <li key={i}>
                <strong>{f.what}</strong>
                {f.when && <> - {f.when}</>}
                <Original text={f.original_text} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.checklist.length > 0 && <Checklist items={plan.checklist} />}

      {/* A rewrite in another language is a new plan: start the reminder choices fresh. */}
      <ReminderBuilder key={result.language} medications={plan.medications} followUps={plan.follow_ups} />

      {plan.questions_to_ask.length > 0 && (
        <section className="card" aria-labelledby="h-questions">
          <h2 id="h-questions">{t('plan.questions')}</h2>
          <ul className="plain-list questions">
            {plan.questions_to_ask.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </section>
      )}

      {plan.unclear_items.length > 0 && (
        <section className="card caution" aria-labelledby="h-unclear">
          <h2 id="h-unclear">{t('plan.unclear')}</h2>
          <p>{t('plan.unclearIntro')}</p>
          <ul className="plain-list">
            {plan.unclear_items.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </section>
      )}

      <EmailPlan result={result} />

      <section className="card no-print" aria-labelledby="h-original">
        <h2 id="h-original">{t('plan.original')}</h2>
        <p className="hint">{t('plan.originalHint')}</p>
        <pre className="original-full" dir="auto">{original}</pre>
      </section>

      <Readability readability={readability} />

      <p className="meta no-print">
        {t('plan.madeBy', { who: result.provider === 'mock' ? t('plan.demo') : `${result.provider} (${result.model})` })}{' '}
        {t('plan.privacy')}
      </p>
    </article>
  )
}

function WarningList({ items }) {
  return (
    <ul className="warning-list">
      {items.map((w, i) => (
        <li key={i}>
          <strong>{w.sign}</strong>
          {w.action_text && <span className="warning-action">{w.action_text}</span>}
          <Original text={w.original_text} />
        </li>
      ))}
    </ul>
  )
}
