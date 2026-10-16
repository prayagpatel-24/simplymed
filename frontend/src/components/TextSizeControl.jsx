import { useI18n } from '../i18n/index.jsx'

const SIZES = [
  { scale: 1, label: 'text.normal' },
  { scale: 1.2, label: 'text.large' },
  { scale: 1.4, label: 'text.xl' },
  { scale: 1.6, label: 'text.xxl' },
]

export default function TextSizeControl({ value, onChange }) {
  const { t } = useI18n()
  return (
    <div className="text-size" role="group" aria-labelledby="text-size-label">
      <p id="text-size-label" className="field-label">
        {t('text.size')}
      </p>
      <div className="text-size-buttons">
        {SIZES.map((s) => (
          <button
            key={s.scale}
            type="button"
            className="text-size-btn"
            style={{ fontSize: `${s.scale}rem` }}
            aria-pressed={value === s.scale}
            onClick={() => onChange(s.scale)}
          >
            {t(s.label)}
          </button>
        ))}
      </div>
    </div>
  )
}
