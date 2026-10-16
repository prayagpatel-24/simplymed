import { useState } from 'react'
import PageHeader from './PageHeader.jsx'
import TextSizeControl from './TextSizeControl.jsx'
import { LanguageSelect, useI18n } from '../i18n/index.jsx'
import { useCareStore } from '../store.jsx'
import { href } from '../useRoute.js'

export default function SettingsPage({ textScale, onTextScaleChange }) {
  const { t } = useI18n()
  const { signedIn, medicines, events, clearAll } = useCareStore()
  const [cleared, setCleared] = useState(false)

  function handleClear() {
    if (!window.confirm(t('settings.deleteConfirm'))) return
    clearAll()
    setCleared(true)
  }

  return (
    <div className="page">
      <PageHeader path="/settings" />

      <section className="card" aria-labelledby="h-display">
        <h2 id="h-display">{t('settings.reading')}</h2>
        <TextSizeControl value={textScale} onChange={onTextScaleChange} />
        <p className="hint">
          {t('settings.textHint')} {signedIn ? t('settings.savedAccount') : t('settings.savedDevice')}
        </p>
        <p className="sample-text" aria-hidden="true">
          {t('settings.example')}
        </p>
      </section>

      <section className="card" aria-labelledby="h-defaults">
        <h2 id="h-defaults">{t('lang.label')}</h2>
        <div className="field-row wide">
          <LanguageSelect id="default-language" label={t('settings.languageLabel')} />
        </div>
        <p className="hint">{t('settings.languageHint')}</p>
        <p className="hint">{t('lang.testNote')}</p>
      </section>

      <section className="card" aria-labelledby="h-data">
        <h2 id="h-data">{t('settings.data')}</h2>
        {signedIn ? (
          <p>{t('settings.dataAccount')}</p>
        ) : (
          <p>
            {t('settings.dataGuest')} <a href={href('/account')}>{t('settings.signInLink')}</a>{' '}
            {t('settings.dataGuestRest')}
          </p>
        )}
        <p>{t('settings.counts', { meds: medicines.length, events: events.length })}</p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleClear}
          disabled={medicines.length === 0 && events.length === 0}
        >
          {t('settings.delete')}
        </button>
        {cleared && (
          <p className="note" role="status">
            {t('settings.deleted')}
          </p>
        )}
      </section>
    </div>
  )
}
