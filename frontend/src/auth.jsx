import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const Auth = createContext(null)

// Turns Supabase's English error messages into plain, friendly ones.
function friendly(error) {
  const msg = error?.message ?? ''
  if (/invalid login/i.test(msg)) return 'That email and password do not match. Check them and try again.'
  if (/already registered/i.test(msg)) return 'There is already an account with this email. Try signing in instead.'
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. Look for the email from SimplyMed and tap the link.'
  if (/password/i.test(msg) && /characters/i.test(msg)) return 'Your password needs at least 6 characters.'
  if (/rate limit/i.test(msg)) return 'Too many tries. Please wait a few minutes and try again.'
  if (/fetch|network/i.test(msg)) return 'Could not reach the sign-in service. Check your internet connection and try again.'
  return msg || 'Something went wrong. Please try again.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!supabase)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      // Arrived from a "reset password" email: show the new-password form.
      if (event === 'PASSWORD_RECOVERY') {
        setRecovering(true)
        window.location.hash = '#/account'
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function call(promise) {
    const { error } = await promise
    if (error) throw new Error(friendly(error))
  }

  const value = {
    configured: Boolean(supabase),
    ready,
    user,
    recovering,
    signIn: (email, password) => call(supabase.auth.signInWithPassword({ email, password })),
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw new Error(friendly(error))
      return { needsConfirmation: !data.session }
    },
    signOut: () => call(supabase.auth.signOut()),
    sendReset: (email) =>
      call(supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })),
    setNewPassword: async (password) => {
      await call(supabase.auth.updateUser({ password }))
      setRecovering(false)
    },
  }

  return <Auth.Provider value={value}>{children}</Auth.Provider>
}

export const useAuth = () => useContext(Auth)
