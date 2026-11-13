const emptyPreferences = { salary: '', payday: '', cadence: '', hasCards: null, cards: [] }
const preferencesKey = (userId) => `saldo.preferences:${userId}`
const frequencies = new Set(['quincenal', 'mensual', 'semanal', 'variable'])
const cardTypes = new Set(['visa', 'mastercard', 'amex', 'otra'])

export function normalizeSalary(value) {
  const normalized = String(value ?? '').trim().replace(',', '.').replace(/^\./, '0.').replace(/^0+(?=\d)/, '')
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized) || Number(normalized) <= 0) return ''
  const [whole, fraction = ''] = normalized.split('.')
  return `${whole}.${fraction.padEnd(2, '0')}`
}

function normalizePayday(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2100-12-31') return ''
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : ''
}

function normalizePreferences(preferences) {
  const seen = new Set()
  const cards = (Array.isArray(preferences?.cards) ? preferences.cards : []).filter((card) => {
    if (!card || typeof card.id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(card.id)
      || !cardTypes.has(card.type) || typeof card.label !== 'string' || !card.label.trim()
      || seen.has(card.id)) return false
    seen.add(card.id)
    return true
  }).slice(0, 6).map(({ id, type, label }) => ({ id, type, label: label.trim().slice(0, 32) }))
  return {
    salary: normalizeSalary(preferences?.salary),
    payday: normalizePayday(preferences?.payday),
    cadence: frequencies.has(preferences?.cadence) ? preferences.cadence : '',
    hasCards: typeof preferences?.hasCards === 'boolean' ? preferences.hasCards : null,
    cards: preferences?.hasCards === false ? [] : cards,
  }
}

export function getSaldoPreferences(userId) {
  if (userId == null) return emptyPreferences
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey(userId)))
    return normalizePreferences(saved)
  } catch {
    return emptyPreferences
  }
}

export function saveSaldoPreferences(userId, preferences) {
  if (userId == null) return false
  try {
    const key = preferencesKey(userId)
    const saved = normalizePreferences(preferences)
    if (saved.salary || saved.payday || saved.cadence || saved.hasCards !== null || saved.cards.length) localStorage.setItem(key, JSON.stringify(saved))
    else localStorage.removeItem(key)
    window.dispatchEvent(new CustomEvent('saldo:preferences-updated', { detail: String(userId) }))
    return true
  } catch {
    return false
  }
}
