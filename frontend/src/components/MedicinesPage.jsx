import { Fragment, useState } from 'react'
import Original from './Original.jsx'
import PageHeader from './PageHeader.jsx'
import ScheduleFields from './ScheduleFields.jsx'
import { formatTime, todayKey } from '../calendar.js'
import { toLocalDate } from '../ics.js'
import { useI18n } from '../i18n/index.jsx'
import {
  choiceProblem, namedWeekdays, scheduleFromEvents, suggestedTimes, takenEveryDay, toSchedule, weekdayName,
} from '../schedule.js'
import { emptyMedicine, useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'

const TEXT_FIELDS = [
  ['name', 'form.name'],
  ['strength', 'form.strength'],
  ['dose', 'med.dose'],
  ['route', 'med.route'],
  ['frequency', 'med.frequency'],
  ['duration', 'med.duration'],
  ['purpose', 'med.purpose'],
]

// Table columns. On phones each row turns into a stacked card using these labels.
const COLUMNS = [
  ['med.dose', (m) => [m.dose, m.strength].filter(Boolean).join(', ')],
  ['med.frequency', (m) => m.frequency],
  ['med.duration', (m) => m.duration],
  ['med.purpose', (m) => m.purpose],
]

export default function MedicinesPage() {
  const { t } = useI18n()
  const { medicines, events, loading, addMedicine, updateMedicine, removeMedicine, setMedicineSchedule } = useCareStore()
  const [editingId, setEditingId] = useState(null)
  const [schedulingId, setSchedulingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [openOriginal, setOpenOriginal] = useState(null)
  const editing = medicines.find((m) => m.id === editingId)
  const scheduling = medicines.find((m) => m.id === schedulingId)

  function handleRemove(med) {
    if (window.confirm(t('meds.removeConfirm', { name: med.name }))) removeMedicine(med.id)
  }

  function open(which, id) {
    setAdding(false)
    setEditingId(which === 'edit' ? id : null)
    setSchedulingId(which === 'schedule' ? id : null)
    window.scrollTo({ top: 0 })
  }

  const closeForms = () => {
    setEditingId(null)
    setSchedulingId(null)
    setAdding(false)
  }

  const formOpen = Boolean(editing || adding || scheduling)

  return (
    <div className="page">
      <PageHeader path="/medicines" />

      {(editing || adding) && (
        <MedicineForm
          key={editing?.id ?? 'new'}
          initial={editing ?? emptyMedicine()}
          title={editing ? t('form.change', { name: editing.name }) : t('form.add')}
          isNew={!editing}
          onSave={(med) => {
            if (editing) updateMedicine(editing.id, med)
            else addMedicine(med)
            closeForms()
          }}
          onCancel={closeForms}
        />
      )}

      {scheduling && (
        <ScheduleForm
          key={scheduling.id}
          med={scheduling}
          saved={scheduleFromEvents(events, scheduling.id)}
          onSave={(schedule) => {
            setMedicineSchedule(scheduling.id, schedule)
            closeForms()
          }}
          onCancel={closeForms}
        />
      )}

      {loading ? (
        <p className="card" role="status">{t('meds.loading')}</p>
      ) : medicines.length === 0 ? (
        !adding && (
          <div className="card empty">
            <p>
              <strong>{t('meds.emptyStrong')}</strong> <a href={href('/')}>{t('meds.emptyLink')}</a>,{' '}
              {t('meds.emptyRest')}
            </p>
          </div>
        )
      ) : (
        <div className="card table-card">
          <table className="med-table">
            <caption>{t('meds.count', { n: medicines.length })}</caption>
            <thead>
              <tr>
                <th scope="col">{t('meds.colMedicine')}</th>
                <th scope="col">{t('meds.colTimes')}</th>
                {COLUMNS.map(([label]) => (
                  <th key={label} scope="col">{t(label)}</th>
                ))}
                <th scope="col">{t('meds.colNotes')}</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <Fragment key={med.id}>
                  <tr>
                    <th scope="row" data-label={t('meds.colMedicine')}>
                      <span className="med-name">{med.name}</span>
                      {med.as_needed && <span className="badge">{t('med.asNeeded')}</span>}
                      {med.edited && <span className="badge badge-plain">{t('med.edited')}</span>}
                      <div className="row-actions">
                        {med.original_text && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            aria-expanded={openOriginal === med.id}
                            onClick={() => setOpenOriginal(openOriginal === med.id ? null : med.id)}
                          >
                            {openOriginal === med.id ? t('meds.hideOriginal') : t('meds.showOriginal')}
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => open('edit', med.id)}>
                          {t('meds.edit')} <span className="visually-hidden">{med.name}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-small btn-danger-outline"
                          onClick={() => handleRemove(med)}
                        >
                          {t('meds.remove')} <span className="visually-hidden">{med.name}</span>
                        </button>
                      </div>
                    </th>
                    <td data-label={t('meds.colTimes')}>
                      <ReminderSummary
                        med={med}
                        schedule={scheduleFromEvents(events, med.id)}
                        disabled={formOpen}
                        onChange={() => open('schedule', med.id)}
                      />
                    </td>
                    {COLUMNS.map(([label, value]) => (
                      <td key={label} data-label={t(label)}>
                        {value(med) || <span className="muted">{t('meds.notStated')}</span>}
                      </td>
                    ))}
                    <td data-label={t('meds.colNotes')}>
                      {med.special_instructions?.length > 0 ? (
                        <ul className="cell-list">
                          {med.special_instructions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="muted">{t('meds.none')}</span>
                      )}
                      <p className="cell-missed">
                        <strong>{t('med.missed')}</strong> {med.missed_dose || t('med.askPharmacist')}
                      </p>
                    </td>
                  </tr>
                  {openOriginal === med.id && (
                    <tr className="original-row">
                      <td colSpan={COLUMNS.length + 3}>
                        <p className="field-label">{t('meds.originalFor', { name: med.name })}</p>
                        <blockquote className="original-quote">{med.original_text}</blockquote>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!formOpen && (
        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            {t('meds.addByHand')}
          </button>
          {medicines.length > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
              {t('meds.print')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** The saved reminder times for one medicine, with a button to choose or change them. */
function ReminderSummary({ med, schedule, disabled, onChange }) {
  const { t, locale } = useI18n()
  if (med.as_needed) return <span className="muted">{t('meds.asNeededNoTimes')}</span>
  const date = (key) => toLocalDate(key).toLocaleDateString(locale, { month: 'long', day: 'numeric' })

  return (
    <div className="reminder-summary">
      {schedule ? (
        <>
          <ul className="cell-list times-list">
            {schedule.times.map((time) => (
              <li key={time}>
                <strong>{formatTime(time)}</strong>
              </li>
            ))}
          </ul>
          <p className="hint">
            {schedule.weekdays?.length
              ? `${t('sched.onlyOn', { days: schedule.weekdays.map((d) => weekdayName(d, locale)).join(', ') })}. `
              : ''}
            {schedule.days > 1 ? t('meds.forDays', { n: schedule.days, date: date(schedule.date) }) : t('meds.onDay', { date: date(schedule.date) })}
          </p>
        </>
      ) : (
        <p className="muted">{t('meds.noReminders')}</p>
      )}
      <button type="button" className="btn btn-ghost btn-small" onClick={onChange} disabled={disabled}>
        {schedule ? t('meds.changeTimes') : t('meds.setTimes')} <span className="visually-hidden">{med.name}</span>
      </button>
    </div>
  )
}

/** Choose or change when a saved medicine's reminders go off. */
function ScheduleForm({ med, saved, onSave, onCancel }) {
  const { t } = useI18n()
  const lockedNotDaily = !takenEveryDay(med)
  const everyDay = saved ? !saved.weekdays?.length : !lockedNotDaily
  const [date, setDate] = useState(saved?.date ?? todayKey())
  const [choice, setChoice] = useState(() => ({
    include: true,
    times: saved?.times ?? suggestedTimes(med) ?? [''],
    everyDay,
    lockedNotDaily,
    weekdays: saved?.weekdays ?? (everyDay ? [] : namedWeekdays(med)),
    days: saved?.days ?? med.duration_days ?? (everyDay ? 7 : 28),
    daysFromInstructions: Boolean(saved || med.duration_days),
  }))

  function handleSubmit(e) {
    e.preventDefault()
    if (choiceProblem(choice) || !date) return
    onSave(toSchedule(choice, date))
  }

  function handleClear() {
    if (window.confirm(t('sched.clearConfirm', { name: med.name }))) onSave(null)
  }

  return (
    <form className="card med-form" onSubmit={handleSubmit} aria-labelledby="schedule-title">
      <h2 id="schedule-title">{t('sched.title', { name: med.name })}</h2>
      <p>{t('sched.intro')}</p>
      {med.frequency && <p className="note">{t('sched.instructionsSay', { text: med.frequency })}</p>}
      <Original text={med.original_text} />

      <div className="form-field">
        <label htmlFor="schedule-date" className="field-label">{t('rem.firstDay')}</label>
        <input id="schedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <ScheduleFields idPrefix={`med-${med.id}`} value={choice} onChange={setChoice} />

      <div className="button-row">
        <button type="submit" className="btn btn-primary" disabled={Boolean(choiceProblem(choice))}>
          {t('sched.save')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        {saved && (
          <button type="button" className="btn btn-ghost btn-danger-outline" onClick={handleClear}>
            {t('sched.clear')}
          </button>
        )}
      </div>
    </form>
  )
}

function MedicineForm({ initial, title, isNew = false, onSave, onCancel }) {
  const { t } = useI18n()
  const [form, setForm] = useState(() => ({
    ...initial,
    special: (initial.special_instructions ?? []).join('\n'),
  }))
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const idFor = (field) => `med-${initial.id ?? 'new'}-${field}`

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const { special, ...rest } = form
    const result = { ...rest, name: form.name.trim() }
    result.special_instructions = special.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!isNew) delete result.original_text // The original words never change.
    onSave(result)
  }

  return (
    <form className="card med-form" onSubmit={handleSubmit} aria-label={title}>
      <h2>{title}</h2>
      {TEXT_FIELDS.map(([field, label]) => (
        <div key={field} className="form-field">
          <label htmlFor={idFor(field)} className="field-label">
            {t(label)}
          </label>
          <input
            id={idFor(field)}
            type="text"
            value={form[field] ?? ''}
            onChange={set(field)}
            required={field === 'name'}
          />
        </div>
      ))}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.as_needed}
          onChange={(e) => setForm((f) => ({ ...f, as_needed: e.target.checked }))}
        />
        {t('form.asNeeded')}
      </label>
      <div className="form-field">
        <label htmlFor={idFor('special')} className="field-label">
          {t('form.special')}
        </label>
        <textarea id={idFor('special')} rows={3} value={form.special} onChange={set('special')} />
      </div>

      {isNew ? (
        <div className="form-field">
          <label htmlFor={idFor('original')} className="field-label">
            {t('form.labelWords')}
          </label>
          <textarea id={idFor('original')} rows={3} value={form.original_text} onChange={set('original_text')} />
        </div>
      ) : (
        initial.original_text && (
          <div className="form-field">
            <p className="field-label">{t('form.originalFixed')}</p>
            <Original text={initial.original_text} />
          </div>
        )
      )}

      <div className="button-row">
        <button type="submit" className="btn btn-primary">
          {t('common.save')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
