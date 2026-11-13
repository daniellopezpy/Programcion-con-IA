const draftPattern = /^\d{1,10}(?:\.\d{0,2})?$/

export function moneyDraft(value) {
  if (!value) return ''
  const draft = value.replace(/^\./, '0.').replace(/^0+(?=\d)/, '')
  return draftPattern.test(draft) ? draft : null
}

export function moneyAmount(value, { allowZero = false } = {}) {
  const draft = moneyDraft(String(value ?? ''))
  if (!draft || (!allowZero && !/[1-9]/.test(draft))) return null
  const [whole, cents = ''] = draft.split('.')
  return whole + '.' + cents.padEnd(2, '0')
}

export function formatMoneyDraft(value) {
  const [whole, cents] = String(value ?? '').split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return cents === undefined ? grouped : grouped + '.' + cents
}

export function moneyFromPaste(value) {
  const text = value.trim().replace(/^(?:GTQ|Q)\s*/i, '')
  if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(text)) return text.replaceAll(',', '')
  if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(text)) return text.replaceAll('.', '').replace(',', '.')
  return text.replace(',', '.')
}

export function caretFromDraft(display, length) {
  let index = 0
  for (let seen = 0; index < display.length && seen < length; index++) {
    if (display[index] !== ',') seen++
  }
  return index
}
