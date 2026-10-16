// Reminder schedules for medicines. The app only suggests times; the person confirms or
// changes every one of them. A schedule is { date, times: ["08:00"], days, weekdays }:
// days is how many calendar days it covers, weekdays (0 = Monday ... 6 = Sunday) limits it
// to some days of the week, or is null for every day.

import { addDays } from './calendar.js'
import { toLocalDate } from './ics.js'

const DEFAULT_TIMES = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
}

/** Suggested clock times from the instructions, or null when the instructions don't say. */
export function suggestedTimes(med) {
  if (med.interval_hours && 24 % med.interval_hours === 0) {
    return Array.from({ length: 24 / med.interval_hours }, (_, i) => {
      const hour = (8 + i * med.interval_hours) % 24
      return `${String(hour).padStart(2, '0')}:00`
    })
  }
  return DEFAULT_TIMES[med.times_per_day] ?? null
}

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Same words as NOT_DAILY_RE in backend/app/safety.py. A second guard so a weekly medicine
// never gets daily reminders, even if the AI forgot to say so.
const NOT_DAILY_RE =
  /\bq?weekly\b|once a week|\bq\.?\s?(?:wk|week)\b|every other day|\bqod\b|\bmwf\b|\bsat\/sun\b|\b(?:mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?)\b/i

/** Weekday numbers the instructions name ("Tuesday" -> 1), or []. */
export function namedWeekdays(med) {
  return (med.days_of_week ?? [])
    .map((d) => DAY_NAMES.indexOf(String(d).toLowerCase()))
    .filter((i) => i >= 0)
}

/** False for medicines taken once a week, on some days, or every other day. */
export function takenEveryDay(med) {
  if (med.as_needed) return false
  if (med.every_day === false || namedWeekdays(med).length) return false
  return !NOT_DAILY_RE.test(med.original_text ?? '')
}

/** 0 = Monday ... 6 = Sunday for a "YYYY-MM-DD" date. */
export const weekdayOf = (key) => (toLocalDate(key).getDay() + 6) % 7

/** The first date on or after `key` that falls on one of `weekdays` (or `key` itself). */
export function firstMatchingDate(key, weekdays) {
  if (!weekdays?.length) return key
  for (let i = 0; i < 7; i++) {
    const day = addDays(key, i)
    if (weekdays.includes(weekdayOf(day))) return day
  }
  return key
}

/** "Monday" in the app's language. 2024-01-01 was a Monday. */
export const weekdayName = (index, locale, style = 'long') =>
  new Date(2024, 0, 1 + index).toLocaleDateString(locale, { weekday: style })

/** Starting values for the schedule editor, built from a care-plan medicine. */
export function initialChoice(med) {
  const times = suggestedTimes(med) ?? []
  const everyDay = takenEveryDay(med)
  const weekdays = everyDay ? [] : namedWeekdays(med)
  return {
    include: times.length > 0 && (everyDay || weekdays.length > 0),
    times,
    everyDay,
    lockedNotDaily: !everyDay,
    weekdays,
    days: med.duration_days ?? (everyDay ? 7 : 28),
    daysFromInstructions: Boolean(med.duration_days),
  }
}

/** What is missing before this choice can be saved, or null if it is complete. */
export function choiceProblem(choice) {
  if (!choice.times.some(Boolean)) return 'rem.noTimes'
  if (!choice.everyDay && choice.weekdays.length === 0) return 'sched.noDays'
  return null
}

/** Turn an editor choice into a saved schedule. */
export function toSchedule(choice, date) {
  const weekdays = choice.everyDay ? null : [...choice.weekdays].sort()
  return {
    date: firstMatchingDate(date, weekdays),
    times: [...new Set(choice.times.filter(Boolean))].sort(),
    days: Math.min(365, Math.max(1, Number(choice.days) || 1)),
    weekdays,
  }
}

/** The schedule currently saved for a medicine, read back from its dose reminders. */
export function scheduleFromEvents(events, medicineId) {
  const doses = events.filter((e) => e.kind === 'dose' && e.medicineId === medicineId)
  if (!doses.length) return null
  const date = doses.map((e) => e.date).sort()[0]
  return {
    date,
    times: [...new Set(doses.map((e) => e.time).filter(Boolean))].sort(),
    days: Math.max(...doses.map((e) => Number(e.repeatDays) || 1)),
    weekdays: doses.find((e) => e.weekdays?.length)?.weekdays ?? null,
  }
}
