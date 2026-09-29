import { createContext, useContext } from 'react'
import { useSessionState } from './usePersistentState.js'

// My Medicines and Calendar data. Kept only in this browser tab (sessionStorage):
// never sent to the server or the AI, and gone when the tab is closed.

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

export function CareStoreProvider({ children }) {
  const [medicines, setMedicines] = useSessionState('simplymed-medicines', [])
  const [events, setEvents] = useSessionState('simplymed-events', [])

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
    return { medicines: addedMeds.length, events: addedEvents.length }
  }

  const value = {
    medicines,
    events,
    saveFromPlan,
    addMedicine: (m) => setMedicines((all) => [...all, { ...m, id: newId(), edited: true, addedAt: new Date().toISOString() }]),
    updateMedicine: (id, patch) => {
      const old = medicines.find((m) => m.id === id)
      setMedicines((all) => all.map((m) => (m.id === id ? { ...m, ...patch, edited: true } : m)))
      // Keep reminder titles in step with a renamed medicine.
      if (old && patch.name && patch.name !== old.name) {
        setEvents((all) =>
          all.map((e) => (e.medicineId === id && e.title === `Take ${old.name}` ? { ...e, title: `Take ${patch.name}` } : e)),
        )
      }
    },
    // Removing a medicine also removes its dose reminders.
    removeMedicine: (id) => {
      setMedicines((all) => all.filter((m) => m.id !== id))
      setEvents((all) => all.filter((e) => e.medicineId !== id))
    },
    addEvent: (e) => setEvents((all) => [...all, { ...e, id: newId() }]),
    updateEvent: (id, patch) => setEvents((all) => all.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    removeEvent: (id) => setEvents((all) => all.filter((e) => e.id !== id)),
    clearAll: () => {
      setMedicines([])
      setEvents([])
    },
  }

  return <CareStore.Provider value={value}>{children}</CareStore.Provider>
}

export const useCareStore = () => useContext(CareStore)
