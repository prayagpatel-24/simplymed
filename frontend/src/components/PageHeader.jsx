import Icon from './Icon.jsx'
import { routeFor } from '../useRoute.js'

// The colored banner at the top of every page: title plus "On this page you can:".
export default function PageHeader({ path, title, children }) {
  const route = routeFor(path)
  return (
    <header className={`page-header tint-${route.tint}`}>
      <div className="page-header-title">
        <span className="page-icon">
          <Icon name={route.icon} size={30} />
        </span>
        <h1>{title ?? route.title}</h1>
      </div>
      <div className="overview">
        <p className="overview-label">On this page you can:</p>
        <ul>
          {route.overview.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      {children}
    </header>
  )
}
