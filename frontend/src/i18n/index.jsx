import { createContext, useContext, useEffect } from 'react'
import { usePersistentState } from '../usePersistentState.js'
import en from './en.js'
import es from './es.js'
import zh from './zh.js'
import vi from './vi.js'
import tl from './tl.js'
import ar from './ar.js'
import fr from './fr.js'
import ko from './ko.js'
import ru from './ru.js'
import pt from './pt.js'
import hi from './hi.js'
import ht from './ht.js'

// App language. One choice changes both the screens and the language the AI writes care
// plans in. Remembered on this device (a display preference, not health information).
// Any text missing from a language falls back to English.

// [code, name in its own language, English name, locale for dates and times, text direction]
export const LANGUAGES = [
  ['en', 'English', 'English', 'en-US', 'ltr'],
  ['es', 'Español', 'Spanish', 'es', 'ltr'],
  ['zh', '中文（简体）', 'Chinese', 'zh-CN', 'ltr'],
  ['vi', 'Tiếng Việt', 'Vietnamese', 'vi', 'ltr'],
  ['tl', 'Tagalog', 'Tagalog', 'fil', 'ltr'],
  ['ar', 'العربية', 'Arabic', 'ar-u-nu-latn', 'rtl'],
  ['fr', 'Français', 'French', 'fr', 'ltr'],
  ['ko', '한국어', 'Korean', 'ko', 'ltr'],
  ['ru', 'Русский', 'Russian', 'ru', 'ltr'],
  ['pt', 'Português', 'Portuguese', 'pt-BR', 'ltr'],
  ['hi', 'हिन्दी', 'Hindi', 'hi', 'ltr'],
  ['ht', 'Kreyòl ayisyen', 'Haitian Creole', 'ht', 'ltr'],
]

const STRINGS = { en, es, zh, vi, tl, ar, fr, ko, ru, pt, hi, ht }

const SETTINGS_KEY = 'simplymed-defaults'

const info = (code) => LANGUAGES.find((l) => l[0] === code) ?? LANGUAGES[0]

export const languageLabel = (code) => {
  const [c, native, english] = info(code)
  return c === 'en' ? native : `${native} (${english})`
}

// Date helpers outside React read the current locale from here.
let currentLocale = 'en-US'
export const getLocale = () => currentLocale

function translate(language, key, vars) {
  let text = STRINGS[language]?.[key] ?? en[key] ?? key
  if (vars && typeof text === 'string') {
    text = text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m))
  }
  return text
}

const I18n = createContext(null)

export function LanguageProvider({ children }) {
  const [settings, setSettings] = usePersistentState(SETTINGS_KEY, { language: 'en' })
  const language = STRINGS[settings.language] ? settings.language : 'en'
  const [, , , locale, dir] = info(language)
  currentLocale = locale

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = dir
  }, [language, dir])

  const value = {
    language,
    locale,
    dir,
    setLanguage: (code) => setSettings((s) => ({ ...s, language: code })),
    t: (key, vars) => translate(language, key, vars),
  }
  return <I18n.Provider value={value}>{children}</I18n.Provider>
}

export const useI18n = () => useContext(I18n)

/** A labeled language menu. Changing it changes the whole app right away. */
export function LanguageSelect({ id, label, hint }) {
  const { language, setLanguage, t } = useI18n()
  return (
    <div className="language-select">
      <label htmlFor={id} className="field-label">
        {label ?? t('lang.label')}
      </label>
      <select id={id} value={language} onChange={(e) => setLanguage(e.target.value)}>
        {LANGUAGES.map(([code]) => (
          <option key={code} value={code} lang={code}>
            {languageLabel(code)}
          </option>
        ))}
      </select>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}
