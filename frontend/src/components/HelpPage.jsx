import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import PageHeader from './PageHeader.jsx'
import { askHelper } from '../api.js'
import { href } from '../useRoute.js'

const HOW_TO = [
  {
    title: 'Make my instructions simpler',
    steps: [
      'Tap "Simplify" on the side.',
      'Paste the instructions into the big box, or tap an example.',
      'If you like, type the age of the person taking the medicine.',
      'Tick the box to confirm it is a made-up example.',
      'Tap "Make it simpler". It can take up to 30 seconds.',
    ],
  },
  {
    title: 'Save my medicines and reminders',
    steps: [
      'Make a care plan first (see above).',
      'Scroll down to "Save my medicines and reminders".',
      'Check the reminder times. They are only suggestions, so change them to match your instructions.',
      'Tap "Save to My Medicines and Calendar".',
    ],
  },
  {
    title: 'Change or remove a medicine',
    steps: [
      'Tap "My Medicines" on the side.',
      'Find the medicine in the table.',
      'Tap "Edit" to change it, or "Remove" to delete it.',
      'Tap "Show original words" to see exactly what the label said.',
    ],
  },
  {
    title: 'Use the calendar',
    steps: [
      'Tap "Calendar" on the side.',
      'Tap "Month" to see the whole month, or "Week" to see one week.',
      'In Month view, tap a day to see what is planned.',
      'Tap "Add an event", "Edit", or "Remove" to make changes.',
    ],
  },
  {
    title: 'Add reminders to my phone or computer calendar',
    steps: [
      'Tap "Calendar" on the side.',
      'Tap "Download to my calendar app".',
      'Open the file that downloads. Your phone or computer asks to add the events.',
      'This works with Google Calendar, Apple Calendar, and Outlook.',
    ],
  },
  {
    title: 'Make the words bigger',
    steps: ['Tap "Settings" on the side.', 'Under "Text size", tap "Large", "Extra large", or "Largest".'],
  },
  {
    title: 'Keep my list for next time (account)',
    steps: [
      'Tap "Sign in" on the side.',
      `Tap "I'm new here" and enter your email and a password.`,
      'You may get an email. Tap the link in it, then sign in.',
      'Forgot your password? Tap "Forgot your password?" on the sign-in page.',
    ],
  },
]

const PROBLEMS = [
  ['"The SimplyMed server did not answer"', 'Wait a moment, then try again. Check that you are connected to the internet.'],
  ['"The AI is busy or unavailable right now"', 'Many people are using the free AI. Wait 1 minute and try again.'],
  ['"Too many requests"', 'You can make about 10 requests a minute. Wait 1 minute and try again.'],
  ['"Make it simpler" is gray and does nothing', 'Paste at least a few words, and tick the "made-up example" box.'],
  ['My medicines disappeared', 'Without an account, your list is deleted when you close the tab. Sign in to keep it.'],
  ['The words are too small', 'Go to Settings and choose a bigger text size.'],
]

const WELCOME = {
  role: 'assistant',
  content:
    '- Hi! I can help you use SimplyMed.\n- I can also explain words in your care plan.\n- I cannot give medical advice. For that, ask your pharmacist or doctor.',
}

// "- one\n- two" -> ["one", "two"]. Anything else stays one paragraph.
function bullets(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const items = lines.filter((l) => /^[-*•]\s+/.test(l)).map((l) => l.replace(/^[-*•]\s+/, ''))
  return items.length === lines.length ? items : null
}

export default function HelpPage({ carePlan }) {
  return (
    <div className="page">
      <PageHeader path="/help" />

      <section aria-labelledby="h-howto">
        <h2 id="h-howto" className="section-title">
          How to...
        </h2>
        {HOW_TO.map((topic) => (
          <details key={topic.title} className="card accordion">
            <summary>{topic.title}</summary>
            <ol className="steps">
              {topic.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </details>
        ))}
      </section>

      <section className="card" aria-labelledby="h-problems">
        <h2 id="h-problems">Something went wrong?</h2>
        <dl className="problems">
          {PROBLEMS.map(([problem, fix]) => (
            <div key={problem}>
              <dt>{problem}</dt>
              <dd>{fix}</dd>
            </div>
          ))}
        </dl>
        <p>
          Still stuck? <a href={href('/feedback')}>Tell us on the Feedback page</a> or ask the helper below.
        </p>
      </section>

      <Chat carePlan={carePlan} />
    </div>
  )
}

function Chat({ carePlan }) {
  const [messages, setMessages] = useState([WELCOME])
  const [draft, setDraft] = useState('')
  const [includePlan, setIncludePlan] = useState(Boolean(carePlan))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const logRef = useRef(null)

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const question = draft.trim()
    if (!question || busy) return
    const next = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setDraft('')
    setBusy(true)
    setError('')
    try {
      const { reply } = await askHelper({
        // The greeting is shown on screen only; the AI gets the real conversation.
        messages: next.filter((m) => m !== WELCOME).slice(-12),
        plan: includePlan ? carePlan : null,
      })
      setMessages((all) => [...all, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card chat tint-lavender-soft" aria-labelledby="h-chat">
      <h2 id="h-chat">
        <Icon name="chat" /> Ask the SimplyMed helper
      </h2>
      <p className="notice small">
        <strong>This is not medical advice.</strong> The helper explains how SimplyMed works and what
        words mean. For questions about your health or medicines, ask your pharmacist or doctor. In an
        emergency, call 911.
      </p>

      <ol className="chat-log" ref={logRef} aria-live="polite" aria-label="Conversation">
        {messages.map((m, i) => {
          const items = m.role === 'assistant' ? bullets(m.content) : null
          return (
            <li key={i} className={`bubble bubble-${m.role}`}>
              <span className="bubble-who">{m.role === 'user' ? 'You' : 'Helper'}</span>
              {items ? (
                <ul>
                  {items.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{m.content}</p>
              )}
            </li>
          )
        })}
        {busy && (
          <li className="bubble bubble-assistant">
            <span className="bubble-who">Helper</span>
            <p>Thinking...</p>
          </li>
        )}
      </ol>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSend} className="chat-form">
        <label htmlFor="chat-input" className="field-label">
          Your question
        </label>
        <textarea
          id="chat-input"
          rows={2}
          maxLength={2000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSend(e)
          }}
          placeholder='For example: What does "as needed" mean?'
        />
        {carePlan && (
          <label className="checkbox">
            <input type="checkbox" checked={includePlan} onChange={(e) => setIncludePlan(e.target.checked)} />
            Let the helper read my current care plan
          </label>
        )}
        <button type="submit" className="btn btn-primary" disabled={!draft.trim() || busy}>
          Send
        </button>
      </form>
    </section>
  )
}
