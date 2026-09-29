import { useEffect, useState } from 'react'

function useStoredState(getStorage, key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = getStorage().getItem(key)
      return saved === null ? initialValue : JSON.parse(saved)
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    try {
      getStorage().setItem(key, JSON.stringify(value))
    } catch {
      // Storage can be blocked (private browsing); the app still works without it.
    }
  }, [getStorage, key, value])
  return [value, setValue]
}

const local = () => localStorage
const session = () => sessionStorage

// Like useState, but remembered on this device only. Nothing is sent to a server.
// Use for display preferences, not health information.
export function usePersistentState(key, initialValue) {
  return useStoredState(local, key, initialValue)
}

// Like useState, but kept only in this browser tab: it survives a refresh and is
// cleared when the tab is closed. Use for anything the user typed or saved.
export function useSessionState(key, initialValue) {
  return useStoredState(session, key, initialValue)
}
