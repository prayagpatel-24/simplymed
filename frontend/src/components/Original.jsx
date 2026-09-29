// A fold-out showing the exact original words, so anyone can compare.
export default function Original({ text }) {
  if (!text) return null
  return (
    <details className="original">
      <summary>Show the original words</summary>
      <blockquote>{text}</blockquote>
    </details>
  )
}
