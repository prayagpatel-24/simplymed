// Empty when the site and API share an address (Vercel, local dev). Set VITE_API_URL only if they don't.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function postJson(path, body) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the SimplyMed server. Check your internet connection and try again.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok && data === null) {
    // No JSON back: the Python backend could not be reached.
    throw new Error(
      import.meta.env.DEV
        ? 'The SimplyMed server is not running. Start the backend (uvicorn app.main:app --reload) and try again.'
        : 'The SimplyMed server did not answer. Please try again in a moment.',
    )
  }
  if (!response.ok) {
    const detail = Array.isArray(data.detail) ? 'Please check what you typed and try again.' : data.detail
    throw new Error(detail || 'Something went wrong. Please try again.')
  }
  return data
}

export const simplify = ({ text, language, age }) => postJson('/api/simplify', { text, language, age })

/** messages: [{ role: 'user' | 'assistant', content }]. plan: the current care plan, or null. */
export const askHelper = ({ messages, plan }) => postJson('/api/chat', { messages, plan })
