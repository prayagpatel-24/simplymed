import { useState } from 'react'
import {
  WEEKDAYS, addDays, addMonths, dayHeading, expandEvents, formatTime, monthGrid, monthLabel,
  startOfMonth, startOfWeek, todayKey,
} from '../calendar.js'
import { buildIcs, downloadFile, toLocalDate } from '../ics.js'
import { useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'
import { usePersistentState } from '../usePersistentState.js'
import PageHeader from './PageHeader.jsx'

const blankEvent = (date) => ({ kind: 'other', title: '', date, time: '', repeatDays: '', notes: '', medicineId: null })

const longDate = (key, options) => toLocalDate(key).toLocaleDateString(undefined, options)

const countLabel = (n) => (n === 0 ? 'nothing planned' : `${n} ${n === 1 ? 'item' : 'items'}`)

export default function CalendarPage() {
  const { events, loading, addEvent, updateEvent, removeEvent } = useCareStore()
  const [view, setView] = usePersistentState('simplymed-calendar-view', 'month')
  const [monthStart, setMonthStart] = useState(() => startOfMonth(todayKey()))
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayKey()))
  const [selectedDay, setSelectedDay] = useState(todayKey)
  const [editingId, setEditingId] = useState(null)
  const [addingOn, setAddingOn] = useState(null)

  const editing = events.find((e) => e.id === editingId)
  const formOpen = Boolean(editing || addingOn)

  function startEdit(id) {
    setAddingOn(null)
    setEditingId(id)
    window.scrollTo({ top: 0 })
  }

  function startAdd(date) {
    setEditingId(null)
    setAddingOn(date)
    window.scrollTo({ top: 0 })
  }

  const closeForm = () => {
    setEditingId(null)
    setAddingOn(null)
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

  const itemList = (items) => (
    <ul className="agenda">
      {items.map((e) => (
        <li key={e.id}>
          <p className="agenda-time">{formatTime(e.time)}</p>
          <div className="agenda-body">
            <p className="agenda-title">{e.title}</p>
            {e.notes && <p className="hint">{e.notes}</p>}
            <div className="button-row small">
              <button type="button" className="btn btn-ghost" onClick={() => startEdit(e.id)}>
                Edit <span className="visually-hidden">{e.title}</span>
              </button>
              <button type="button" className="btn btn-ghost btn-danger-outline" onClick={() => handleRemove(e)}>
                Remove <span className="visually-hidden">{e.title}</span>
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="page">
      <PageHeader path="/calendar" />

      {formOpen && (
        <EventForm
          key={editing?.id ?? `new-${addingOn}`}
          initial={editing ?? blankEvent(addingOn)}
          title={editing ? `Change "${editing.title}"` : 'Add an event'}
          onSave={(data) => {
            if (editing) updateEvent(editing.id, data)
            else addEvent(data)
            setSelectedDay(data.date)
            setMonthStart(startOfMonth(data.date))
            closeForm()
          }}
          onCancel={closeForm}
        />
      )}

      {loading && (
        <p className="card" role="status">
          Loading your calendar...
        </p>
      )}

      {!loading && events.length === 0 && !formOpen && (
        <div className="card empty">
          <p>
            <strong>Nothing on your calendar yet.</strong> <a href={href('/')}>Simplify some instructions</a>,
            pick your reminder times, then choose <strong>Save to My Medicines and Calendar</strong>. You can
            also add an event by hand.
          </p>
        </div>
      )}

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Calendar view">
          <button type="button" aria-pressed={view === 'month'} onClick={() => setView('month')}>
            Month
          </button>
          <button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}>
            Week
          </button>
        </div>
        <div className="button-row">
          {!formOpen && (
            <button type="button" className="btn btn-primary" onClick={() => startAdd(selectedDay)}>
              Add an event
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={handleDownload} disabled={events.length === 0}>
            Download to my calendar app
          </button>
        </div>
      </div>
      <p className="hint">
        The download works with Google Calendar, Apple Calendar, and Outlook. Open the file to add the
        reminders there.
      </p>

      {view === 'month' ? (
        <>
          <nav className="week-nav" aria-label="Choose a month">
            <button type="button" className="btn btn-ghost" onClick={() => setMonthStart(addMonths(monthStart, -1))}>
              Previous month
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setMonthStart(startOfMonth(todayKey()))
                setSelectedDay(todayKey())
              }}
            >
              This month
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setMonthStart(addMonths(monthStart, 1))}>
              Next month
            </button>
          </nav>

          <div className="card month-card">
            <table className="month">
              <caption className="week-label" aria-live="polite">
                {monthLabel(monthStart)}
              </caption>
              <thead>
                <tr>
                  {WEEKDAYS.map((d) => (
                    <th key={d} scope="col" abbr={d}>
                      {d.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthGrid(monthStart).map((week) => (
                  <tr key={week[0]}>
                    {expandEvents(events, week[0], 7).map(({ key, items }) => (
                      <td key={key} className={key.slice(0, 7) === monthStart.slice(0, 7) ? '' : 'other-month'}>
                        <button
                          type="button"
                          className={`day-cell${key === todayKey() ? ' is-today' : ''}`}
                          aria-pressed={key === selectedDay}
                          aria-label={`${longDate(key, { weekday: 'long', month: 'long', day: 'numeric' })}, ${countLabel(items.length)}`}
                          onClick={() => setSelectedDay(key)}
                        >
                          <span className="day-number">{Number(key.slice(8))}</span>
                          {items.slice(0, 2).map((e) => (
                            <span key={e.id} className={`chip chip-${e.kind}`}>
                              {e.title.replace(/^Take /, '')}
                            </span>
                          ))}
                          {items.length > 2 && <span className="chip chip-more">+{items.length - 2} more</span>}
                          {items.length > 0 && <span className="day-count">{items.length}</span>}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {expandEvents(events, selectedDay, 1).map(({ key, items }) => (
            <section key={key} className="card day day-selected" aria-labelledby="selected-day">
              <h2 id="selected-day">{dayHeading(key)}</h2>
              {items.length === 0 ? <p className="hint">Nothing planned.</p> : itemList(items)}
              {!formOpen && (
                <button type="button" className="btn btn-ghost" onClick={() => startAdd(key)}>
                  Add an event on {longDate(key, { month: 'long', day: 'numeric' })}
                </button>
              )}
            </section>
          ))}
        </>
      ) : (
        <>
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
            {longDate(weekStart, { month: 'long', day: 'numeric' })} to{' '}
            {longDate(addDays(weekStart, 6), { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          {expandEvents(events, weekStart, 7).map(({ key, items }) => (
            <section key={key} className={`card day${key === todayKey() ? ' day-today' : ''}`} aria-labelledby={`day-${key}`}>
              <h3 id={`day-${key}`}>{dayHeading(key)}</h3>
              {items.length === 0 ? <p className="hint">Nothing planned.</p> : itemList(items)}
            </section>
          ))}
        </>
      )}
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
