import Icon from './Icon.jsx'
import { useI18n } from '../i18n/index.jsx'
import { routeFor } from '../useRoute.js'

// The colored banner at the top of every page: title plus "On this page you can:".
export default function PageHeader({ path, title, children }) {
  const { t } = useI18n()
  const route = routeFor(path)
  return (
    <header className={`page-header tint-${route.tint}`}>
      <div className="page-header-title">
        <span className="page-icon">
          <Icon name={route.icon} size={30} />
        </span>
        <h1>{title ?? t(`title.${route.path}`)}</h1>
      </div>
      <div className="overview">
        <p className="overview-label">{t('header.overview')}</p>
        <ul>
          {t(`overview.${route.path}`).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      {children}
    </header>
  )
}
