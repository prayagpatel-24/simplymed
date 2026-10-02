import { createClient } from '@supabase/supabase-js'

// Accounts and saved data live in Supabase. The URL and anon key are public by design:
// Row Level Security (supabase/schema.sql) is what keeps each person's data private.
// Without them the app still works in guest mode (saved only in this browser tab).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey, { auth: { flowType: 'pkce' } }) : null
