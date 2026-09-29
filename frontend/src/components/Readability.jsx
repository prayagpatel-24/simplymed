export default function Readability({ readability }) {
  if (!readability) return null
  const { original, simplified } = readability

  return (
    <section className="card no-print" aria-labelledby="h-readability">
      <h2 id="h-readability">Reading level (for researchers)</h2>
      <table className="readability">
        <thead>
          <tr>
            <th scope="col">Measure</th>
            <th scope="col">Original</th>
            <th scope="col">Simpler version</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Flesch-Kincaid grade level</th>
            <td>{original.grade}</td>
            <td>{simplified.grade}</td>
          </tr>
          <tr>
            <th scope="row">Flesch reading ease (higher is easier)</th>
            <td>{original.reading_ease}</td>
            <td>{simplified.reading_ease}</td>
          </tr>
          <tr>
            <th scope="row">Words</th>
            <td>{original.words}</td>
            <td>{simplified.words}</td>
          </tr>
        </tbody>
      </table>
      <p className="hint">
        These scores only measure sentence and word length. Short abbreviations like "PO BID" can
        make hard text look easy, so scores are not proof that people understand it.
      </p>
    </section>
  )
}
