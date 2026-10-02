const SIZES = [
  { scale: 1, label: 'Normal' },
  { scale: 1.2, label: 'Large' },
  { scale: 1.4, label: 'Extra large' },
  { scale: 1.6, label: 'Largest' },
]

export default function TextSizeControl({ value, onChange }) {
  return (
    <div className="text-size" role="group" aria-labelledby="text-size-label">
      <p id="text-size-label" className="field-label">
        Text size
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
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
