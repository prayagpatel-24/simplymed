import { useI18n } from '../i18n/index.jsx'
import { choiceProblem, weekdayName } from '../schedule.js'

/**
 * Times, days of the week, and how long, for one medicine's reminders.
 * value: { times, everyDay, lockedNotDaily, weekdays, days, daysFromInstructions }. The person decides every
 * one of these; the starting values are only suggestions from the instructions.
 */
export default function ScheduleFields({ idPrefix, value, onChange }) {
  const { t, locale } = useI18n()
  const set = (patch) => onChange({ ...value, ...patch })
  const problem = choiceProblem(value)

  const toggleDay = (d) =>
    set({ weekdays: value.weekdays.includes(d) ? value.weekdays.filter((x) => x !== d) : [...value.weekdays, d] })

  return (
    <div className="schedule-fields">
      {/* Instructions that say weekly or some days lock this: those never become daily. */}
      {!value.lockedNotDaily && (
        <label className="checkbox">
          <input type="checkbox" checked={!value.everyDay} onChange={(e) => set({ everyDay: !e.target.checked })} />
          {t('sched.someDays')}
        </label>
      )}
      {!value.everyDay && (
        <fieldset className="weekday-picker">
          <legend className="field-label">{t('sched.whichDays')}</legend>
          <p className="hint">{t('sched.notDaily')}</p>
          <div className="weekday-options">
            {Array.from({ length: 7 }, (_, d) => (
              <label key={d} className="checkbox weekday">
                <input type="checkbox" checked={value.weekdays.includes(d)} onChange={() => toggleDay(d)} />
                {weekdayName(d, locale)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="times">
        {value.times.map((time, k) => (
          <div key={k} className="time-field">
            <label htmlFor={`${idPrefix}-time-${k}`}>{t('rem.time', { n: k + 1 })}</label>
            <div className="time-row">
              <input
                id={`${idPrefix}-time-${k}`}
                type="time"
                value={time}
                onChange={(e) => set({ times: value.times.map((x, j) => (j === k ? e.target.value : x)) })}
              />
              <button
                type="button"
                className="btn btn-ghost btn-small btn-danger-outline"
                aria-label={t('rem.removeTime', { n: k + 1 })}
                onClick={() => set({ times: value.times.filter((_, j) => j !== k) })}
              >
                {t('meds.remove')}
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => set({ times: [...value.times, ''] })}>
        + {t('rem.addTime')}
      </button>

      <div className="time-field days-field">
        {value.everyDay ? (
          <>
            <label htmlFor={`${idPrefix}-days`}>{t('rem.days')}</label>
            <input
              id={`${idPrefix}-days`}
              type="number"
              min="1"
              max="365"
              value={value.days}
              onChange={(e) => set({ days: e.target.value })}
            />
          </>
        ) : (
          <>
            <label htmlFor={`${idPrefix}-weeks`}>{t('sched.weeks')}</label>
            <input
              id={`${idPrefix}-weeks`}
              type="number"
              min="1"
              max="52"
              value={Math.max(1, Math.ceil((Number(value.days) || 7) / 7))}
              onChange={(e) => set({ days: Math.max(1, Number(e.target.value) || 1) * 7 })}
            />
          </>
        )}
      </div>
      {!value.daysFromInstructions && <p className="hint">{t('rem.askDays')}</p>}

      {problem && (
        <p className="field-problem" role="status">
          {t(problem)}
        </p>
      )}
    </div>
  )
}
