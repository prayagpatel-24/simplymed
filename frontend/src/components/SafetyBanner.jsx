import { useI18n } from '../i18n/index.jsx'

export default function SafetyBanner({ safety }) {
  const { t } = useI18n()
  if (!safety) return null
  const high = safety.issues.filter((i) => i.severity === 'high')
  const medium = safety.issues.filter((i) => i.severity !== 'high')

  if (high.length === 0 && medium.length === 0) {
    return (
      <div className="banner banner-ok" role="status">
        <p>
          <strong>{t('safety.okStrong')}</strong> {t('safety.ok')}
        </p>
        {safety.note && <p className="hint">{safety.note}</p>}
      </div>
    )
  }

  return (
    <div className={`banner ${high.length ? 'banner-danger' : 'banner-caution'}`} role="alert">
      <h2>{high.length ? t('safety.highTitle') : t('safety.mediumTitle')}</h2>
      <p>
        {t('safety.body')} <strong>{t('safety.trust')}</strong>
      </p>
      <ul>
        {[...high, ...medium].map((issue, i) => (
          <li key={i}>{issue.message}</li>
        ))}
      </ul>
      {safety.note && <p className="hint">{safety.note}</p>}
    </div>
  )
}
