// Date helpers for the Calendar page. Dates are "YYYY-MM-DD" strings in local time,
// times are "HH:MM" or null (all day).

import { toLocalDate } from './ics.js'

const pad = (n) => String(n).padStart(2, '0')

export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayKey = () => dateKey(new Date())

export function addDays(key, n) {
  const d = toLocalDate(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

/** Days between two date keys (b - a). */
export function daysBetween(a, b) {
  return Math.round((toLocalDate(b) - toLocalDate(a)) / 86400000)
}

/** Monday on or before the given date key. */
export function startOfWeek(key) {
  const day = toLocalDate(key).getDay()
  return addDays(key, -((day + 6) % 7))
}

/**
 * Turn saved events into a list of days, each with the occurrences that fall on it.
 * An event with repeatDays shows on its start date and every day after, repeatDays days in total.
 */
export function expandEvents(events, fromKey, days) {
  return Array.from({ length: days }, (_, i) => {
    const key = addDays(fromKey, i)
    const items = events
      .filter((e) => {
        const offset = daysBetween(e.date, key)
        return offset >= 0 && offset < (e.repeatDays ? Number(e.repeatDays) : 1)
      })
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
    return { key, items }
  })
}

export function dayHeading(key) {
  const today = todayKey()
  const date = toLocalDate(key).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  if (key === today) return `Today, ${date}`
  if (key === addDays(today, 1)) return `Tomorrow, ${date}`
  return date
}

export function formatTime(time) {
  if (!time) return 'Any time'
  return toLocalDate('2000-01-01', time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
