import { usePersistentState } from '../usePersistentState.js'

// Ticks are remembered on this device only, keyed by the checklist's contents.
function keyFor(items) {
  let hash = 0
  for (const ch of items.join('|')) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return `simplymed-checklist-${hash}`
}

export default function Checklist({ items }) {
  const [done, setDone] = usePersistentState(keyFor(items), [])
  const toggle = (i) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))
  const count = items.filter((_, i) => done.includes(i)).length

  return (
    <section className="card" aria-labelledby="h-checklist">
      <h2 id="h-checklist">My checklist</h2>
      <div className="progress" aria-hidden="true">
        <div className="progress-bar" style={{ width: `${(count / items.length) * 100}%` }} />
      </div>
      <p className="hint" aria-live="polite">
        {count} of {items.length} done
      </p>
      <ul className="checklist">
        {items.map((item, i) => (
          <li key={i}>
            <label className="checkbox">
              <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}
