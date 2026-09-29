import { useState } from 'react'
import { addDays, dayHeading, expandEvents, formatTime, startOfWeek, todayKey } from '../calendar.js'
import { buildIcs, downloadFile, toLocalDate } from '../ics.js'
import { useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'

const blankEvent = (date) => ({ kind: 'other', title: '', date, time: '', repeatDays: '', notes: '', medicineId: null })

export default function CalendarPage() {
  const { events, addEvent, updateEvent, removeEvent } = useCareStore()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayKey()))
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)

  const days = expandEvents(events, weekStart, 7)
  const weekEnd = addDays(weekStart, 6)
  const rangeLabel = `${toLocalDate(weekStart).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} to ${toLocalDate(weekEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
  const editing = events.find((e) => e.id === editingId)

  function startEdit(id) {
    setAdding(false)
    setEditingId(id)
    window.scrollTo({ top: 0 })
  }

  function handleRemove(event) {
    const repeats = Number(event.repeatDays) > 1
    const message = repeats
      ? `Remove "${event.title}"? This removes it from all ${event.repeatDays} days.`
      : `Remove "${event.title}"?`
    if (window.confirm(message)) removeEvent(event.id)
  }

  function handleDownload() {
    const doses = []
    const appointments = []
    for (const e of events) {
      if (e.time) {
        doses.push({ title: e.title, description: e.notes, start: toLocalDate(e.date, e.time), days: Math.max(1, Number(e.repeatDays) || 1) })
      } else {
        appointments.push({ title: e.title, description: e.notes, date: toLocalDate(e.date) })
      }
    }
    downloadFile(buildIcs({ doses, appointments }), 'simplymed-calendar.ics')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Calendar</h1>
        <p className="lead">
          Your medicine reminders and appointments, day by day. You can change any of them.
        </p>
      </header>

      {events.length === 0 && !adding && (
        <div className="card empty">
          <p>
            <strong>Nothing on your calendar yet.</strong> <a href={href('/')}>Simplify some instructions</a>,
            pick your reminder times, then choose <strong>Save to My Medicines and Calendar</strong>. You can
            also add an event by hand.
          </p>
        </div>
      )}

      {(editing || adding) && (
        <EventForm
          key={editing?.id ?? 'new'}
          initial={editing ?? blankEvent(todayKey())}
          title={editing ? `Change "${editing.title}"` : 'Add an event'}
          onSave={(data) => {
            if (editing) updateEvent(editing.id, data)
            else addEvent(data)
            setEditingId(null)
            setAdding(false)
          }}
          onCancel={() => {
            setEditingId(null)
            setAdding(false)
          }}
        />
      )}

      <div className="button-row">
        {!adding && !editing && (
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            Add an event
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={handleDownload} disabled={events.length === 0}>
          Download to my calendar app
        </button>
      </div>
      <p className="hint">
        The download works with Google Calendar, Apple Calendar, and Outlook. Open the file to add
        the reminders there.
      </p>

      <nav className="week-nav" aria-label="Choose a week">
        <button type="button" className="btn btn-ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          Previous week
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setWeekStart(startOfWeek(todayKey()))}>
          This week
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          Next week
        </button>
      </nav>
      <h2 className="week-label" aria-live="polite">
        {rangeLabel}
      </h2>

      {days.map(({ key, items }) => (
        <section key={key} className={`card day${key === todayKey() ? ' day-today' : ''}`} aria-labelledby={`day-${key}`}>
          <h3 id={`day-${key}`}>{dayHeading(key)}</h3>
          {items.length === 0 ? (
            <p className="hint">Nothing planned.</p>
          ) : (
            <ul className="agenda">
              {items.map((e) => (
                <li key={e.id}>
                  <p className="agenda-time">{formatTime(e.time)}</p>
                  <div className="agenda-body">
                    <p className="agenda-title">{e.title}</p>
                    {e.notes && <p className="hint">{e.notes}</p>}
                    <div className="button-row small">
                      <button type="button" className="btn btn-ghost" onClick={() => startEdit(e.id)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-ghost btn-danger-outline" onClick={() => handleRemove(e)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

function EventForm({ initial, title, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({ ...initial, time: initial.time ?? '', repeatDays: initial.repeatDays ?? '' }))
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    const repeatDays = Number(form.repeatDays)
    onSave({
      ...form,
      title: form.title.trim(),
      time: form.time || null,
      repeatDays: repeatDays > 1 ? Math.min(repeatDays, 365) : null,
    })
  }

  return (
    <form className="card event-form" onSubmit={handleSubmit} aria-label={title}>
      <h2>{title}</h2>
      <div className="form-field">
        <label htmlFor="event-title" className="field-label">What</label>
        <input id="event-title" type="text" value={form.title} onChange={set('title')} required />
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="event-date" className="field-label">Date (first day)</label>
          <input id="event-date" type="date" value={form.date} onChange={set('date')} required />
        </div>
        <div className="form-field">
          <label htmlFor="event-time" className="field-label">Time (leave empty for all day)</label>
          <input id="event-time" type="time" value={form.time} onChange={set('time')} />
        </div>
        <div className="form-field">
          <label htmlFor="event-repeat" className="field-label">Repeat every day for how many days?</label>
          <input id="event-repeat" type="number" min="1" max="365" value={form.repeatDays} onChange={set('repeatDays')} placeholder="1" />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="event-notes" className="field-label">Notes</label>
        <textarea id="event-notes" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="button-row">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
