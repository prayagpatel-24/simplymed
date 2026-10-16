import { useEffect, useState } from 'react'

// A tiny hash router (#/medicines, #/calendar, ...) so the Back button works
// without adding a routing library. Each page has a tab color; its title and overview
// are in the language files (src/i18n). "label" stays English: Feedback stores it.
export const ROUTES = [
  {
    path: '/',
    label: 'Simplify',
    icon: 'simplify',
    tint: 'mint',
  },
  {
    path: '/medicines',
    label: 'My Medicines',
    icon: 'pill',
    tint: 'peach',
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: 'calendar',
    tint: 'sky',
  },
  {
    path: '/help',
    label: 'Help',
    icon: 'help',
    tint: 'lavender',
  },
  {
    path: '/feedback',
    label: 'Feedback',
    icon: 'feedback',
    tint: 'butter',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: 'settings',
    tint: 'rose',
  },
  {
    path: '/account',
    label: 'Account',
    icon: 'user',
    tint: 'sage',
  },
  {
    path: '/admin',
    label: 'Admin',
    icon: 'shield',
    tint: 'teal',
    adminOnly: true,
  },
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

export const routeFor = (path) => ROUTES.find((r) => r.path === path) ?? ROUTES[0]
