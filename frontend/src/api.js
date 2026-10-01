// Empty when the backend serves the site; set VITE_API_URL when the site is hosted elsewhere (GitHub Pages).
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export async function simplify({ text, language, readingLevel }) {
  let response
  try {
    response = await fetch(`${BASE}/api/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language, reading_level: readingLevel }),
    })
  } catch {
    throw new Error(
      'Could not reach the SimplyMed server. Check your internet connection. If nobody has used it for a while it may be waking up, so wait a minute and try again.',
    )
  }
  const data = await response.json().catch(() => null)
  if (!response.ok && data === null) {
    // No JSON back: the Python backend could not be reached (not running, or asleep).
    throw new Error(
      import.meta.env.DEV
        ? 'The SimplyMed server is not running. Start the backend (uvicorn app.main:app --reload) and try again.'
        : 'The SimplyMed server did not answer. If nobody has used it for a while it may be waking up, which can take about a minute. Please try again.',
    )
  }
  if (!response.ok) {
    const detail = Array.isArray(data.detail) ? 'Please check the text and try again.' : data.detail
    throw new Error(detail || 'Something went wrong. Please try again.')
  }
  return data
}
