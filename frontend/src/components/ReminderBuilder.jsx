import { useState } from 'react'
import { buildIcs, downloadFile, toLocalDate } from '../ics.js'
import { doseNotes, useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'

const DEFAULT_TIMES = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
}

// The app suggests times but never decides them: the patient picks times that
// match their instructions.
function suggestedTimes(med) {
  if (med.interval_hours && 24 % med.interval_hours === 0) {
    return Array.from({ length: 24 / med.interval_hours }, (_, i) => {
      const hour = (8 + i * med.interval_hours) % 24
      return `${String(hour).padStart(2, '0')}:00`
    })
  }
  return DEFAULT_TIMES[med.times_per_day] ?? null
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ReminderBuilder({ medications, followUps }) {
  const schedulable = medications.filter((m) => !m.as_needed && suggestedTimes(m))
  const asNeeded = medications.filter((m) => m.as_needed)
  const unclear = medications.filter((m) => !m.as_needed && !suggestedTimes(m))

  const [startDate, setStartDate] = useState(today)
  const [meds, setMeds] = useState(() =>
    schedulable.map((m) => ({
      include: true,
      times: suggestedTimes(m),
      days: m.duration_days ?? 7,
      daysFromInstructions: Boolean(m.duration_days),
    })),
  )
  const [appointmentDates, setAppointmentDates] = useState(() => followUps.map(() => ''))
  const { saveFromPlan } = useCareStore()
  const [saved, setSaved] = useState(null)

  if (medications.length === 0 && followUps.length === 0) return null

  const updateMed = (i, patch) => setMeds((all) => all.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  // What the user confirmed on screen: the medicines they ticked, with their chosen
  // times and days, and the appointments they gave a date.
  const chosenDoses = () =>
    schedulable
      .map((med, i) => ({ med, choice: meds[i] }))
      .filter(({ choice }) => choice.include)
      .map(({ med, choice }) => ({ med, times: choice.times, days: Math.max(1, Number(choice.days) || 1) }))

  const chosenAppointments = () =>
    followUps
      .map((f, i) => ({ f, date: appointmentDates[i] }))
      .filter(({ date }) => date)
      .map(({ f, date }) => ({ title: f.what, date, notes: f.when ? `Your instructions say: ${f.when}` : '' }))

  function handleDownload() {
    const doses = chosenDoses().flatMap(({ med, times, days }) =>
      times.map((time) => ({
        title: `Take ${med.name}`,
        description: doseNotes(med),
        start: toLocalDate(startDate, time),
        days,
      })),
    )
    const appointments = chosenAppointments().map((a) => ({
      title: a.title,
      description: a.notes,
      date: toLocalDate(a.date),
    }))
    downloadFile(buildIcs({ doses, appointments }), 'simplymed-reminders.ics')
  }

  function handleSave() {
    const schedules = {}
    for (const { med, times, days } of chosenDoses()) {
      schedules[medications.indexOf(med)] = { date: startDate, times, days }
    }
    setSaved(saveFromPlan({ medications, schedules, appointments: chosenAppointments() }))
  }

  const nothingSelected = !meds.some((m) => m.include) && !appointmentDates.some(Boolean)

  return (
    <section className="card no-print" aria-labelledby="h-reminders">
      <h2 id="h-reminders">Save my medicines and reminders</h2>
      <p>
        Save these medicines to <strong>My Medicines</strong> and the reminders to your SimplyMed{' '}
        <strong>Calendar</strong>, or download a file for Google Calendar, Apple Calendar, or Outlook.
        <strong> The times below are only suggestions.</strong> Pick times that match your
        instructions. If you are not sure, ask your pharmacist.
      </p>

      {schedulable.length > 0 && (
        <div className="field-row">
          <label htmlFor="start-date" className="field-label">
            First day
          </label>
          <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
      )}

      {schedulable.map((med, i) => (
        <fieldset key={i} className="reminder">
          <legend>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={meds[i].include}
                onChange={(e) => updateMed(i, { include: e.target.checked })}
              />
              <span>
                <strong>{med.name}</strong> - {med.frequency}
              </span>
            </label>
          </legend>
          {meds[i].include && (
            <>
              <div className="times">
                {meds[i].times.map((t, k) => (
                  <label key={k} className="time-field">
                    <span>Dose {k + 1}</span>
                    <input
                      type="time"
                      value={t}
                      onChange={(e) =>
                        updateMed(i, { times: meds[i].times.map((x, j) => (j === k ? e.target.value : x)) })
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="time-field">
                <span>Number of days</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={meds[i].days}
                  onChange={(e) => updateMed(i, { days: e.target.value })}
                />
              </label>
              {!meds[i].daysFromInstructions && (
                <p className="hint">Your instructions do not say for how long. Check with your pharmacist.</p>
              )}
            </>
          )}
        </fieldset>
      ))}

      {followUps.length > 0 && (
        <fieldset className="reminder">
          <legend>Appointments (add a date once you book them)</legend>
          {followUps.map((f, i) => (
            <label key={i} className="time-field">
              <span>
                {f.what}
                {f.when && ` (${f.when})`}
              </span>
              <input
                type="date"
                value={appointmentDates[i]}
                onChange={(e) => setAppointmentDates((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
              />
            </label>
          ))}
        </fieldset>
      )}

      {asNeeded.length > 0 && (
        <p className="hint">
          No reminders for {asNeeded.map((m) => m.name).join(', ')}: only take{' '}
          {asNeeded.length > 1 ? 'these' : 'this'} when you need to.
        </p>
      )}
      {unclear.length > 0 && (
        <p className="hint">
          We could not tell how often to take {unclear.map((m) => m.name).join(', ')}. Ask your pharmacist.
        </p>
      )}

      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          Save to My Medicines and Calendar
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleDownload} disabled={nothingSelected}>
          Download calendar file
        </button>
      </div>

      {saved && (
        <p className="note" role="status">
          {saved.medicines === 0 && saved.events === 0
            ? 'These are already saved. '
            : `Saved ${saved.medicines} ${saved.medicines === 1 ? 'medicine' : 'medicines'} and ${saved.events} calendar ${saved.events === 1 ? 'reminder' : 'reminders'}. `}
          <a href={href('/medicines')}>Go to My Medicines</a> or <a href={href('/calendar')}>go to my Calendar</a>.
        </p>
      )}
    </section>
  )
}
