import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth.jsx'
import { supabase } from './supabase.js'
import { useSessionState } from './usePersistentState.js'

// My Medicines, Calendar and profile (age, text size).
// Signed in: saved to the person's Supabase account, so it is there next time.
// Guest: kept only in this browser tab (sessionStorage) and gone when the tab closes.
// The pasted instructions are never saved in either case.

const CareStore = createContext(null)

export const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

const MEDICINE_FIELDS = [
  'name', 'strength', 'dose', 'route', 'frequency', 'as_needed',
  'duration', 'purpose', 'special_instructions', 'missed_dose', 'original_text',
]

export const emptyMedicine = () => ({
  name: '', strength: '', dose: '', route: '', frequency: '', as_needed: false,
  duration: '', purpose: '', special_instructions: [], missed_dose: '', original_text: '',
})

// "1 tablet. 875 mg. 2 times a day. Take it with food." for reminder descriptions.
export const doseNotes = (m) =>
  [m.dose, m.strength, m.frequency, ...(m.special_instructions ?? [])]
    .filter(Boolean)
    .map((s) => s.trim().replace(/\.+$/, ''))
    .join('. ') + '.'

const sameMedicine = (a, b) => a.name === b.name && a.original_text === b.original_text

const toRows = (items) => items.map((item) => ({ id: item.id, data: item }))
const fromRows = (rows) => (rows ?? []).map((r) => ({ ...r.data, id: r.id }))

export function CareStoreProvider({ children }) {
  const { user } = useAuth()
  const [guestMeds, setGuestMeds] = useSessionState('simplymed-medicines', [])
  const [guestEvents, setGuestEvents] = useSessionState('simplymed-events', [])
  const [guestProfile, setGuestProfile] = useSessionState('simplymed-profile', {})
  const [cloud, setCloud] = useState({ medicines: [], events: [], profile: {} })
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [imported, setImported] = useState(0)

  const signedIn = Boolean(user && supabase)
  const medicines = signedIn ? cloud.medicines : guestMeds
  const events = signedIn ? cloud.events : guestEvents
  const profile = signedIn ? cloud.profile : guestProfile

  const setMedicines = (f) =>
    signedIn ? setCloud((c) => ({ ...c, medicines: typeof f === 'function' ? f(c.medicines) : f })) : setGuestMeds(f)
  const setEvents = (f) =>
    signedIn ? setCloud((c) => ({ ...c, events: typeof f === 'function' ? f(c.events) : f })) : setGuestEvents(f)

  // Send a change to the account. The screen updates right away; a failure is reported.
  async function remote(run) {
    if (!signedIn) return
    const { error } = await run(supabase)
    if (error) setSyncError('Could not save that change to your account. Check your internet connection, then reload the page.')
  }

  // On sign in: move anything saved as a guest into the account, then load the account.
  useEffect(() => {
    if (!user || !supabase) {
      setCloud({ medicines: [], events: [], profile: {} })
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setSyncError('')
      if (guestMeds.length || guestEvents.length) {
        const results = await Promise.all([
          guestMeds.length ? supabase.from('medicines').upsert(toRows(guestMeds)) : { error: null },
          guestEvents.length ? supabase.from('events').upsert(toRows(guestEvents)) : { error: null },
        ])
        if (!results.some((r) => r.error)) {
          setImported(guestMeds.length + guestEvents.length)
          setGuestMeds([])
          setGuestEvents([])
        }
      }
      const [m, e, p] = await Promise.all([
        supabase.from('medicines').select('id, data').order('created_at'),
        supabase.from('events').select('id, data').order('created_at'),
        supabase.from('profiles').select('age, text_scale').maybeSingle(),
      ])
      if (cancelled) return
      if (m.error || e.error) setSyncError('Could not load your saved information. Check your internet connection, then reload the page.')
      setCloud({
        medicines: fromRows(m.data),
        events: fromRows(e.data),
        profile: { age: p.data?.age ?? guestProfile.age ?? null, textScale: p.data?.text_scale ?? null },
      })
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
    // Only when the signed-in person changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  /**
   * Save what the user confirmed on a care plan.
   * medications: plan medicines. schedules: { [index]: { date, times: [], days } } for the ones
   * the user chose reminders for. appointments: [{ title, date, notes }].
   * Medicines already saved (same name and original words) are skipped with their reminders.
   */
  function saveFromPlan({ medications, schedules, appointments }) {
    const addedMeds = []
    const addedEvents = []
    medications.forEach((m, i) => {
      if (medicines.some((saved) => sameMedicine(saved, m))) return
      const med = { id: newId(), edited: false, addedAt: new Date().toISOString() }
      for (const f of MEDICINE_FIELDS) med[f] = m[f] ?? emptyMedicine()[f]
      addedMeds.push(med)
      const schedule = schedules[i]
      if (!schedule) return
      for (const time of schedule.times) {
        addedEvents.push({
          id: newId(),
          kind: 'dose',
          title: `Take ${m.name}`,
          date: schedule.date,
          time,
          repeatDays: schedule.days,
          medicineId: med.id,
          notes: doseNotes(m),
        })
      }
    })
    for (const a of appointments) {
      const duplicate = events.some((e) => e.kind === 'appointment' && e.title === a.title && e.date === a.date)
      if (!duplicate) addedEvents.push({ id: newId(), kind: 'appointment', time: null, repeatDays: null, medicineId: null, ...a })
    }
    setMedicines((all) => [...all, ...addedMeds])
    setEvents((all) => [...all, ...addedEvents])
    if (addedMeds.length) remote((db) => db.from('medicines').insert(toRows(addedMeds)))
    if (addedEvents.length) remote((db) => db.from('events').insert(toRows(addedEvents)))
    return { medicines: addedMeds.length, events: addedEvents.length }
  }

  function addMedicine(m) {
    const med = { ...m, id: newId(), edited: true, addedAt: new Date().toISOString() }
    setMedicines((all) => [...all, med])
    remote((db) => db.from('medicines').insert(toRows([med])))
  }

  function updateMedicine(id, patch) {
    const old = medicines.find((m) => m.id === id)
    if (!old) return
    const med = { ...old, ...patch, id, edited: true }
    setMedicines((all) => all.map((m) => (m.id === id ? med : m)))
    remote((db) => db.from('medicines').update({ data: med }).eq('id', id))
    // Keep reminder titles in step with a renamed medicine.
    if (patch.name && patch.name !== old.name) {
      const renamed = events
        .filter((e) => e.medicineId === id && e.title === `Take ${old.name}`)
        .map((e) => ({ ...e, title: `Take ${patch.name}` }))
      if (renamed.length) {
        setEvents((all) => all.map((e) => renamed.find((r) => r.id === e.id) ?? e))
        remote((db) => db.from('events').upsert(toRows(renamed)))
      }
    }
  }

  // Removing a medicine also removes its dose reminders.
  function removeMedicine(id) {
    const linked = events.filter((e) => e.medicineId === id).map((e) => e.id)
    setMedicines((all) => all.filter((m) => m.id !== id))
    setEvents((all) => all.filter((e) => e.medicineId !== id))
    remote((db) => db.from('medicines').delete().eq('id', id))
    if (linked.length) remote((db) => db.from('events').delete().in('id', linked))
  }

  function addEvent(e) {
    const event = { ...e, id: newId() }
    setEvents((all) => [...all, event])
    remote((db) => db.from('events').insert(toRows([event])))
  }

  function updateEvent(id, patch) {
    const old = events.find((e) => e.id === id)
    if (!old) return
    const event = { ...old, ...patch, id }
    setEvents((all) => all.map((e) => (e.id === id ? event : e)))
    remote((db) => db.from('events').update({ data: event }).eq('id', id))
  }

  function removeEvent(id) {
    setEvents((all) => all.filter((e) => e.id !== id))
    remote((db) => db.from('events').delete().eq('id', id))
  }

  function updateProfile(patch) {
    if (!signedIn) {
      setGuestProfile((p) => ({ ...p, ...patch }))
      return
    }
    setCloud((c) => ({ ...c, profile: { ...c.profile, ...patch } }))
    const row = { id: user.id }
    if ('age' in patch) row.age = patch.age
    if ('textScale' in patch) row.text_scale = patch.textScale
    remote((db) => db.from('profiles').upsert(row))
  }

  function clearAll() {
    setMedicines([])
    setEvents([])
    remote((db) => db.from('medicines').delete().eq('user_id', user.id))
    remote((db) => db.from('events').delete().eq('user_id', user.id))
  }

  const value = {
    signedIn,
    loading,
    syncError,
    imported,
    dismissImported: () => setImported(0),
    medicines,
    events,
    profile,
    saveFromPlan,
    addMedicine,
    updateMedicine,
    removeMedicine,
    addEvent,
    updateEvent,
    removeEvent,
    updateProfile,
    clearAll,
  }

  return <CareStore.Provider value={value}>{children}</CareStore.Provider>
}

export const useCareStore = () => useContext(CareStore)
