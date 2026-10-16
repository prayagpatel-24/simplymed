// The care plan as plain text, for email or copying. Same order as the screen (urgent
// warnings first) and always ends with the original words, so the two can be compared.

const EMERGENCY = new Set(['call_911', 'go_to_er'])

const bullets = (items) => items.filter(Boolean).map((s) => `- ${s}`)

function section(title, lines) {
  return lines.length ? [title.toUpperCase(), ...lines, ''] : []
}

export function carePlanText(result, t) {
  const { plan } = result
  const warning = (w) => [w.sign, w.action_text].filter(Boolean).join(': ')
  const summary = Array.isArray(plan.summary) ? plan.summary : [plan.summary]

  const meds = plan.medications.flatMap((m) => [
    `* ${m.name}${m.as_needed ? ` (${t('med.asNeeded')})` : ''}`,
    ...[
      ['med.strength', m.strength],
      ['med.dose', m.dose],
      ['med.route', m.route],
      ['med.frequency', m.frequency],
      ['med.duration', m.duration],
      ['med.purpose', m.purpose],
    ]
      .filter(([, value]) => value)
      .map(([label, value]) => `  ${t(label)}: ${value}`),
    ...m.special_instructions.map((s) => `  - ${s}`),
    `  ${t('med.missed')} ${m.missed_dose || t('med.askPharmacist')}`,
    '',
  ])

  return [
    t('plan.title'),
    result.age ? t('plan.writtenFor', { age: result.age }) : null,
    '',
    ...section(t('plan.emergency'), bullets(plan.warning_signs.filter((w) => EMERGENCY.has(w.action)).map(warning))),
    ...section(t('plan.callDoctor'), bullets(plan.warning_signs.filter((w) => !EMERGENCY.has(w.action)).map(warning))),
    ...section(t('plan.summary'), bullets(summary)),
    ...section(t('plan.meds'), meds),
    ...section(t('plan.steps'), plan.steps.map((s, i) => `${i + 1}. ${s.text}`)),
    ...section(t('plan.followUps'), bullets(plan.follow_ups.map((f) => (f.when ? `${f.what} - ${f.when}` : f.what)))),
    ...section(t('checklist.title'), plan.checklist.map((c) => `[ ] ${c}`)),
    ...section(t('plan.questions'), bullets(plan.questions_to_ask)),
    ...section(t('plan.unclear'), bullets(plan.unclear_items)),
    t('plan.original').toUpperCase(),
    t('plan.originalHint'),
    result.original_text,
    '',
    '---',
    t('email.disclaimer'),
  ]
    .filter((line) => line !== null)
    .join('\n')
}

export const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

// Some email apps cut off very long links. Beyond this, the page suggests copying instead.
export const MAILTO_SAFE_LENGTH = 1800

export function mailtoLink(to, subject, body) {
  return `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
