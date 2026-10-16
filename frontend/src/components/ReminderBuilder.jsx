import { useState } from 'react'
import ScheduleFields from './ScheduleFields.jsx'
import { todayKey } from '../calendar.js'
import { buildIcs, downloadFile, toLocalDate } from '../ics.js'
import { useI18n } from '../i18n/index.jsx'
import { choiceProblem, initialChoice, toSchedule } from '../schedule.js'
import { doseNotes, useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'

// The app suggests times but never decides them: the patient picks times (and, for medicines
// not taken every day, the days) that match their instructions.
export default function ReminderBuilder({ medications, followUps }) {
  const { t } = useI18n()
  const schedulable = medications.filter((m) => !m.as_needed)
  const asNeeded = medications.filter((m) => m.as_needed)

  const [startDate, setStartDate] = useState(todayKey)
  const [choices, setChoices] = useState(() => schedulable.map(initialChoice))
  const [appointmentDates, setAppointmentDates] = useState(() => followUps.map(() => ''))
  const { saveFromPlan } = useCareStore()
  const [saved, setSaved] = useState(null)

  if (medications.length === 0 && followUps.length === 0) return null

  const update = (i, next) => {
    setChoices((all) => all.map((c, j) => (j === i ? next : c)))
    setSaved(null)
  }

  // What the user confirmed on screen: the medicines they ticked, with their chosen
  // times and days, and the appointments they gave a date.
  const chosenDoses = () =>
    schedulable
      .map((med, i) => ({ med, choice: choices[i] }))
      .filter(({ choice }) => choice.include)
      .map(({ med, choice }) => ({ med, schedule: toSchedule(choice, startDate) }))

  const chosenAppointments = () =>
    followUps
      .map((f, i) => ({ f, date: appointmentDates[i] }))
      .filter(({ date }) => date)
      .map(({ f, date }) => ({ title: f.what, date, notes: f.when ? `Your instructions say: ${f.when}` : '' }))

  function handleDownload() {
    const doses = chosenDoses().flatMap(({ med, schedule }) =>
      schedule.times.map((time) => ({
        title: `Take ${med.name}`,
        description: doseNotes(med),
        start: toLocalDate(schedule.date, time),
        days: schedule.days,
        weekdays: schedule.weekdays,
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
    for (const { med, schedule } of chosenDoses()) schedules[medications.indexOf(med)] = schedule
    setSaved(saveFromPlan({ medications, schedules, appointments: chosenAppointments() }))
  }

  const incomplete = choices.some((c) => c.include && choiceProblem(c))
  const nothingSelected = !choices.some((c) => c.include) && !appointmentDates.some(Boolean)

  return (
    <section className="card no-print" aria-labelledby="h-reminders">
      <h2 id="h-reminders">{t('rem.title')}</h2>
      <p>
        {t('rem.intro')} <strong>{t('rem.suggest')}</strong> {t('rem.suggest2')}
      </p>

      {schedulable.length > 0 && (
        <div className="field-row">
          <label htmlFor="start-date" className="field-label">
            {t('rem.firstDay')}
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
                checked={choices[i].include}
                onChange={(e) => update(i, { ...choices[i], include: e.target.checked })}
              />
              <span>
                <strong>{med.name}</strong>
                {med.frequency && <> - {med.frequency}</>}
              </span>
            </label>
          </legend>
          {!choices[i].include && !choices[i].everyDay && <p className="hint">{t('sched.notDaily')}</p>}
          {!choices[i].include && choices[i].everyDay && choices[i].times.length === 0 && (
            <p className="hint">{t('rem.unclearMed')}</p>
          )}
          {choices[i].include && (
            <ScheduleFields idPrefix={`plan-med-${i}`} value={choices[i]} onChange={(next) => update(i, next)} />
          )}
        </fieldset>
      ))}

      {followUps.length > 0 && (
        <fieldset className="reminder">
          <legend>{t('rem.appointments')}</legend>
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

      {asNeeded.length > 0 && <p className="hint">{t('rem.asNeeded', { names: asNeeded.map((m) => m.name).join(', ') })}</p>}

      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={incomplete}>
          {t('rem.save')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleDownload} disabled={nothingSelected || incomplete}>
          {t('rem.download')}
        </button>
      </div>
      <p className="hint">{t('rem.changeLater')}</p>

      {saved && (
        <p className="note" role="status">
          {saved.medicines === 0 && saved.events === 0
            ? t('rem.already')
            : t('rem.saved', { meds: saved.medicines, events: saved.events })}{' '}
          <a href={href('/medicines')}>{t('rem.goMeds')}</a> · <a href={href('/calendar')}>{t('rem.goCal')}</a>
        </p>
      )}
    </section>
  )
}
