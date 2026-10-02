import { useEffect, useState } from 'react'

// A tiny hash router (#/medicines, #/calendar, ...) so the Back button works
// without adding a routing library. Each page has a tab color and a short overview.
export const ROUTES = [
  {
    path: '/',
    label: 'Simplify',
    icon: 'simplify',
    tint: 'mint',
    title: 'Understand your care instructions',
    overview: [
      'Paste confusing discharge papers or a prescription label.',
      'Get a clear care plan: medicines, what to do, and when to get help.',
      'Save your medicines and reminders with one button.',
    ],
  },
  {
    path: '/medicines',
    label: 'My Medicines',
    icon: 'pill',
    tint: 'peach',
    title: 'My Medicines',
    overview: [
      'See all your saved medicines in one table.',
      'Change a medicine if your pharmacist or doctor tells you something different.',
      'Tap "Show original words" to compare with the label.',
    ],
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: 'calendar',
    tint: 'sky',
    title: 'My Calendar',
    overview: [
      'See your whole month, or one week at a time.',
      'Tap a day to add, change, or remove a reminder.',
      'Download everything to Google, Apple, or Outlook Calendar.',
    ],
  },
  {
    path: '/help',
    label: 'Help',
    icon: 'help',
    tint: 'lavender',
    title: 'Help',
    overview: [
      'Step-by-step help for every part of SimplyMed.',
      'Fixes for common problems.',
      'Ask the SimplyMed helper a question.',
    ],
  },
  {
    path: '/feedback',
    label: 'Feedback',
    icon: 'feedback',
    tint: 'butter',
    title: 'Tell us what you think',
    overview: [
      'Rate how easy SimplyMed is to use.',
      'Tell us what was confusing or what you would change.',
      'It takes about 1 minute.',
    ],
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: 'settings',
    tint: 'rose',
    title: 'Settings',
    overview: [
      'Make the words bigger.',
      'Choose your language.',
      'Delete your saved medicines and calendar.',
    ],
  },
  {
    path: '/account',
    label: 'Account',
    icon: 'user',
    tint: 'sage',
    title: 'My Account',
    overview: [
      'Sign in so your medicines and calendar are kept for next time.',
      'Create a free account with your email.',
      'Reset your password if you forgot it.',
    ],
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
