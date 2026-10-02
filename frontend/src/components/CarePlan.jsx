import Checklist from './Checklist.jsx'
import MedicationCard from './MedicationCard.jsx'
import Original from './Original.jsx'
import Readability from './Readability.jsx'
import ReminderBuilder from './ReminderBuilder.jsx'
import SafetyBanner from './SafetyBanner.jsx'

const EMERGENCY = new Set(['call_911', 'go_to_er'])

export default function CarePlan({ result, onStartOver }) {
  const { plan, safety, readability, original_text: original, removed_details: removed } = result
  const emergency = plan.warning_signs.filter((w) => EMERGENCY.has(w.action))
  const callDoctor = plan.warning_signs.filter((w) => !EMERGENCY.has(w.action))

  return (
    <article className="care-plan" lang={result.language}>
      <div className="plan-actions no-print">
        <button type="button" className="btn btn-ghost" onClick={onStartOver}>
          Go back and start over
        </button>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Print my care plan
        </button>
      </div>

      <header className="plan-header">
        <p className="eyebrow">SimplyMed</p>
        <h1>My Care Plan</h1>
        {result.age && <p className="plan-for">Written for: age {result.age}</p>}
      </header>

      <SafetyBanner safety={safety} />

      {removed?.length > 0 && (
        <p className="note">
          For privacy, we removed: {removed.join(', ')}. It was never sent to the AI.
        </p>
      )}

      {emergency.length > 0 && (
        <section className="card urgent" aria-labelledby="h-emergency">
          <h2 id="h-emergency">
            <span aria-hidden="true">⚠ </span>Get help right away
          </h2>
          <WarningList items={emergency} />
        </section>
      )}

      {callDoctor.length > 0 && (
        <section className="card caution" aria-labelledby="h-call">
          <h2 id="h-call">Call your doctor if you notice</h2>
          <WarningList items={callDoctor} />
        </section>
      )}

      <section className="card" aria-labelledby="h-summary">
        <h2 id="h-summary">The big picture</h2>
        <ul className="summary">
          {(Array.isArray(plan.summary) ? plan.summary : [plan.summary]).map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </section>

      {plan.medications.length > 0 && (
        <section aria-labelledby="h-meds">
          <h2 id="h-meds" className="section-title">Your medicines</h2>
          {plan.medications.map((m, i) => (
            <MedicationCard key={i} med={m} />
          ))}
        </section>
      )}

      {plan.steps.length > 0 && (
        <section className="card" aria-labelledby="h-steps">
          <h2 id="h-steps">What to do</h2>
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
          <h2 id="h-follow">Appointments and tests</h2>
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

      <ReminderBuilder medications={plan.medications} followUps={plan.follow_ups} />

      {plan.questions_to_ask.length > 0 && (
        <section className="card" aria-labelledby="h-questions">
          <h2 id="h-questions">Questions to ask your pharmacist or doctor</h2>
          <ul className="plain-list questions">
            {plan.questions_to_ask.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </section>
      )}

      {plan.unclear_items.length > 0 && (
        <section className="card caution" aria-labelledby="h-unclear">
          <h2 id="h-unclear">Parts we could not make simpler</h2>
          <p>Ask your pharmacist or doctor to explain these:</p>
          <ul className="plain-list">
            {plan.unclear_items.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card no-print" aria-labelledby="h-original">
        <h2 id="h-original">Your original instructions</h2>
        <p className="hint">If anything above looks different from this, trust the original and ask your care team.</p>
        <pre className="original-full">{original}</pre>
      </section>

      <Readability readability={readability} />

      <p className="meta no-print">
        Made by {result.provider === 'mock' ? 'demo mode (no AI connected)' : `${result.provider} (${result.model})`}.
        The AI does not keep what you entered. This care plan stays in this browser tab until you close it. Only what you choose to save goes to your account.
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
