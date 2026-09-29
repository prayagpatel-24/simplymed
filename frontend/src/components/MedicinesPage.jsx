import { useState } from 'react'
import MedicationCard from './MedicationCard.jsx'
import Original from './Original.jsx'
import { emptyMedicine, useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'

const TEXT_FIELDS = [
  ['name', 'Medicine name'],
  ['strength', 'Strength (for example, 500 mg)'],
  ['dose', 'How much'],
  ['route', 'How to take it'],
  ['frequency', 'How often'],
  ['duration', 'For how long'],
  ['purpose', "What it's for"],
]

export default function MedicinesPage() {
  const { medicines, addMedicine, updateMedicine, removeMedicine } = useCareStore()
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)

  function handleRemove(med) {
    if (window.confirm(`Remove ${med.name} and its calendar reminders?`)) removeMedicine(med.id)
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Medicines</h1>
        <p className="lead">
          Medicines you saved from your care plans. You can change them if your pharmacist or doctor
          tells you something different. The original words stay here so you can always compare.
        </p>
      </header>

      {medicines.length === 0 && !adding && (
        <div className="card empty">
          <p>
            <strong>No medicines yet.</strong> <a href={href('/')}>Simplify some instructions</a>, then
            choose <strong>Save to My Medicines and Calendar</strong>. You can also add one by hand.
          </p>
        </div>
      )}

      {medicines.map((med) =>
        editingId === med.id ? (
          <MedicineForm
            key={med.id}
            initial={med}
            title={`Change ${med.name}`}
            onSave={(patch) => {
              updateMedicine(med.id, patch)
              setEditingId(null)
            }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <MedicationCard key={med.id} med={med}>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(med.id)}>
              Edit {med.name}
            </button>
            <button type="button" className="btn btn-ghost btn-danger-outline" onClick={() => handleRemove(med)}>
              Remove {med.name}
            </button>
          </MedicationCard>
        ),
      )}

      {adding ? (
        <MedicineForm
          initial={emptyMedicine()}
          title="Add a medicine"
          isNew
          onSave={(med) => {
            addMedicine(med)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          Add a medicine by hand
        </button>
      )}
    </div>
  )
}

function MedicineForm({ initial, title, isNew = false, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    special: (initial.special_instructions ?? []).join('\n'),
  }))
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const idFor = (field) => `med-${initial.id ?? 'new'}-${field}`

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const { special, ...rest } = form
    const result = { ...rest, name: form.name.trim() }
    result.special_instructions = special.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!isNew) delete result.original_text // The original words never change.
    onSave(result)
  }

  return (
    <form className="card med-form" onSubmit={handleSubmit} aria-label={title}>
      <h2>{title}</h2>
      {TEXT_FIELDS.map(([field, label]) => (
        <div key={field} className="form-field">
          <label htmlFor={idFor(field)} className="field-label">
            {label}
          </label>
          <input
            id={idFor(field)}
            type="text"
            value={form[field] ?? ''}
            onChange={set(field)}
            required={field === 'name'}
          />
        </div>
      ))}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.as_needed}
          onChange={(e) => setForm((f) => ({ ...f, as_needed: e.target.checked }))}
        />
        Only take it when needed
      </label>
      <div className="form-field">
        <label htmlFor={idFor('special')} className="field-label">
          Special instructions (one per line)
        </label>
        <textarea id={idFor('special')} rows={3} value={form.special} onChange={set('special')} />
      </div>

      {isNew ? (
        <div className="form-field">
          <label htmlFor={idFor('original')} className="field-label">
            Words from the label (optional)
          </label>
          <textarea id={idFor('original')} rows={3} value={form.original_text} onChange={set('original_text')} />
        </div>
      ) : (
        initial.original_text && (
          <div className="form-field">
            <p className="field-label">Original words (these do not change)</p>
            <Original text={initial.original_text} />
          </div>
        )
      )}

      <div className="button-row">
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
