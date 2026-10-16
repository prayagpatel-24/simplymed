import Original from './Original.jsx'
import { useI18n } from '../i18n/index.jsx'

// `children` is for extra buttons (Edit / Remove) on the My Medicines page.
export default function MedicationCard({ med, children }) {
  const { t } = useI18n()
  const facts = [
    ['med.strength', med.strength],
    ['med.dose', med.dose],
    ['med.route', med.route],
    ['med.frequency', med.frequency],
    ['med.duration', med.duration],
    ['med.purpose', med.purpose],
  ].filter(([, value]) => value)

  return (
    <article className="card med-card">
      <div className="med-title">
        <h3>{med.name}</h3>
        {med.as_needed && <span className="badge">{t('med.asNeeded')}</span>}
        {med.edited && <span className="badge badge-plain">{t('med.edited')}</span>}
      </div>

      <dl className="med-facts">
        {facts.map(([label, value]) => (
          <div key={label} className="med-fact">
            <dt>{t(label)}</dt>
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
        <strong>{t('med.missed')} </strong>
        {med.missed_dose || t('med.askPharmacist')}
      </p>

      <Original text={med.original_text} />

      {children && <div className="button-row">{children}</div>}
    </article>
  )
}
