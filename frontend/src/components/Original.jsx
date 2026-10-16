import { useI18n } from '../i18n/index.jsx'

// A fold-out showing the exact original words, so anyone can compare.
export default function Original({ text }) {
  const { t } = useI18n()
  if (!text) return null
  return (
    <details className="original">
      <summary>{t('original.show')}</summary>
      <blockquote dir="auto">{text}</blockquote>
    </details>
  )
}
