import Original from './Original.jsx'

// `children` is for extra buttons (Edit / Remove) on the My Medicines page.
export default function MedicationCard({ med, children }) {
  const facts = [
    ['Strength', med.strength],
    ['How much', med.dose],
    ['How to take it', med.route],
    ['How often', med.frequency],
    ['For how long', med.duration],
    ["What it's for", med.purpose],
  ].filter(([, value]) => value)

  return (
    <article className="card med-card">
      <div className="med-title">
        <h3>{med.name}</h3>
        {med.as_needed && <span className="badge">Only when needed</span>}
        {med.edited && <span className="badge badge-plain">Edited by you</span>}
      </div>

      <dl className="med-facts">
        {facts.map(([label, value]) => (
          <div key={label} className="med-fact">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {med.special_instructions.length > 0 && (
        <ul className="special">
          {med.special_instructions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}

      <p className="missed-dose">
        <strong>If you miss a dose: </strong>
        {med.missed_dose || 'Your instructions do not say. Ask your pharmacist.'}
      </p>

      <Original text={med.original_text} />

      {children && <div className="button-row">{children}</div>}
    </article>
  )
}
