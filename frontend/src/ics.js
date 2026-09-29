// Builds a standard .ics calendar file. It opens in Google Calendar, Apple
// Calendar and Outlook with no login and no API key.

const pad = (n) => String(n).padStart(2, '0')

const localDateTime = (d) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

const localDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`

const escapeText = (s) =>
  String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

// Lines longer than 75 characters must be folded.
const fold = (line) => {
  const out = []
  for (let i = 0; i < line.length; i += 73) out.push((i ? ' ' : '') + line.slice(i, i + 73))
  return out.join('\r\n')
}

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`) + '@simplymed'

/** Parse "2026-10-01" and "08:30" as a local date/time. */
export function toLocalDate(dateStr, timeStr = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

/**
 * doses: [{ title, description, start: Date, days }]  -> repeats daily
 * appointments: [{ title, description, date: Date }]  -> all-day event
 */
export function buildIcs({ doses = [], appointments = [] }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SimplyMed//Student Prototype//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const dose of doses) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid()}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${localDateTime(dose.start)}`,
      'DURATION:PT15M',
      `RRULE:FREQ=DAILY;COUNT=${dose.days}`,
      `SUMMARY:${escapeText(dose.title)}`,
      `DESCRIPTION:${escapeText(dose.description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(dose.title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    )
  }

  for (const appt of appointments) {
    const next = new Date(appt.date)
    next.setDate(next.getDate() + 1)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid()}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${localDate(appt.date)}`,
      `DTEND;VALUE=DATE:${localDate(next)}`,
      `SUMMARY:${escapeText(appt.title)}`,
      `DESCRIPTION:${escapeText(appt.description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(appt.title)}`,
      'TRIGGER:-PT12H',
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function downloadFile(content, filename, type = 'text/calendar') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
