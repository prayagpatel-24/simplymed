import { useEffect, useState } from 'react'

// A tiny hash router (#/medicines, #/calendar, ...) so the Back button works
// without adding a routing library.
export const ROUTES = [
  { path: '/', label: 'Simplify' },
  { path: '/medicines', label: 'My Medicines' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/settings', label: 'Settings' },
]

const current = () => {
  const path = window.location.hash.replace(/^#/, '') || '/'
  return ROUTES.some((r) => r.path === path) ? path : '/'
}

export function useRoute() {
  const [route, setRoute] = useState(current)
  useEffect(() => {
    const onChange = () => {
      setRoute(current())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const href = (path) => `#${path}`
