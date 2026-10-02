import { Fragment, useState } from 'react'
import Original from './Original.jsx'
import PageHeader from './PageHeader.jsx'
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

// Table columns. On phones each row turns into a stacked card using these labels.
const COLUMNS = [
  ['How much', (m) => [m.dose, m.strength].filter(Boolean).join(', ')],
  ['How often', (m) => m.frequency],
  ['For how long', (m) => m.duration],
  ["What it's for", (m) => m.purpose],
]

export default function MedicinesPage() {
  const { medicines, loading, addMedicine, updateMedicine, removeMedicine } = useCareStore()
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [openOriginal, setOpenOriginal] = useState(null)
  const editing = medicines.find((m) => m.id === editingId)

  function handleRemove(med) {
    if (window.confirm(`Remove ${med.name} and its calendar reminders?`)) removeMedicine(med.id)
  }

  function startEdit(id) {
    setAdding(false)
    setEditingId(id)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="page">
      <PageHeader path="/medicines" />

      {(editing || adding) && (
        <MedicineForm
          key={editing?.id ?? 'new'}
          initial={editing ?? emptyMedicine()}
          title={editing ? `Change ${editing.name}` : 'Add a medicine'}
          isNew={!editing}
          onSave={(med) => {
            if (editing) updateMedicine(editing.id, med)
            else addMedicine(med)
            setEditingId(null)
            setAdding(false)
          }}
          onCancel={() => {
            setEditingId(null)
            setAdding(false)
          }}
        />
      )}

      {loading ? (
        <p className="card" role="status">Loading your medicines...</p>
      ) : medicines.length === 0 ? (
        !adding && (
          <div className="card empty">
            <p>
              <strong>No medicines yet.</strong> <a href={href('/')}>Simplify some instructions</a>, then
              choose <strong>Save to My Medicines and Calendar</strong>. You can also add one by hand.
            </p>
          </div>
        )
      ) : (
        <div className="card table-card">
          <table className="med-table">
            <caption>
              {medicines.length} {medicines.length === 1 ? 'medicine' : 'medicines'}
            </caption>
            <thead>
              <tr>
                <th scope="col">Medicine</th>
                {COLUMNS.map(([label]) => (
                  <th key={label} scope="col">{label}</th>
                ))}
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <Fragment key={med.id}>
                  <tr>
                    <th scope="row" data-label="Medicine">
                      <span className="med-name">{med.name}</span>
                      {med.as_needed && <span className="badge">Only when needed</span>}
                      {med.edited && <span className="badge badge-plain">Edited by you</span>}
                      <div className="row-actions">
                        {med.original_text && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            aria-expanded={openOriginal === med.id}
                            onClick={() => setOpenOriginal(openOriginal === med.id ? null : med.id)}
                          >
                            {openOriginal === med.id ? 'Hide original words' : 'Show original words'}
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => startEdit(med.id)}>
                          Edit <span className="visually-hidden">{med.name}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-small btn-danger-outline"
                          onClick={() => handleRemove(med)}
                        >
                          Remove <span className="visually-hidden">{med.name}</span>
                        </button>
                      </div>
                    </th>
                    {COLUMNS.map(([label, value]) => (
                      <td key={label} data-label={label}>
                        {value(med) || <span className="muted">Not stated</span>}
                      </td>
                    ))}
                    <td data-label="Notes">
                      {med.special_instructions?.length > 0 ? (
                        <ul className="cell-list">
                          {med.special_instructions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="muted">None</span>
                      )}
                      <p className="cell-missed">
                        <strong>If you miss a dose:</strong> {med.missed_dose || 'Ask your pharmacist.'}
                      </p>
                    </td>
                  </tr>
                  {openOriginal === med.id && (
                    <tr className="original-row">
                      <td colSpan={COLUMNS.length + 2}>
                        <p className="field-label">Original words for {med.name}</p>
                        <blockquote className="original-quote">{med.original_text}</blockquote>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!adding && !editing && (
        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            Add a medicine by hand
          </button>
          {medicines.length > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
              Print my medicines
            </button>
          )}
        </div>
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
