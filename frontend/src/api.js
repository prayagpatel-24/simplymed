const BASE = import.meta.env.VITE_API_URL ?? ''

export async function simplify({ text, language, readingLevel }) {
  let response
  try {
    response = await fetch(`${BASE}/api/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language, reading_level: readingLevel }),
    })
  } catch {
    throw new Error('Could not reach the SimplyMed server. Check your internet connection and try again.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok && data === null) {
    // No JSON back: the dev proxy couldn't reach the Python backend.
    throw new Error('The SimplyMed server is not running. Start the backend (uvicorn app.main:app --reload) and try again.')
  }
  if (!response.ok) {
    const detail = Array.isArray(data.detail) ? 'Please check the text and try again.' : data.detail
    throw new Error(detail || 'Something went wrong. Please try again.')
  }
  return data
}
