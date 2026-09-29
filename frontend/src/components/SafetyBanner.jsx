export default function SafetyBanner({ safety }) {
  if (!safety) return null
  const high = safety.issues.filter((i) => i.severity === 'high')
  const medium = safety.issues.filter((i) => i.severity !== 'high')

  if (high.length === 0 && medium.length === 0) {
    return (
      <div className="banner banner-ok" role="status">
        <p>
          <strong>✓ Automatic check passed.</strong> Every number, dose, and timing we could find in
          the original is also in this version. Still compare it with your original instructions.
        </p>
        {safety.note && <p className="hint">{safety.note}</p>}
      </div>
    )
  }

  return (
    <div className={`banner ${high.length ? 'banner-danger' : 'banner-caution'}`} role="alert">
      <h2>{high.length ? 'Please double-check these details' : 'Please look over these details'}</h2>
      <p>
        Our automatic check found differences between your original instructions and this simpler
        version. <strong>Trust the original</strong> and ask your pharmacist or doctor.
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
