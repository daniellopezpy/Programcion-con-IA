import { moneyAmount } from './money-input.js'
import { api } from './api.js'

const receivablesKey = (userId) => `saldo.receivables:${userId}`
const batchSize = 50

export function isReceivableDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || value < '2000-01-01' || value > '2100-12-31') return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function parseLegacyReceivables(stored) {
  const items = JSON.parse(stored)
  if (!Array.isArray(items) || !items.every((item) =>
    typeof item?.id === 'string' && /^[a-z0-9-]{1,80}$/i.test(item.id)
    && typeof item.person === 'string' && item.person.trim() && Array.from(item.person).length <= 100
    && typeof item.amount === 'string' && moneyAmount(item.amount)
    && (item.dueDate === '' || isReceivableDate(item.dueDate))
    && (item.collectedDate === '' || isReceivableDate(item.collectedDate))
    && typeof item.note === 'string' && Array.from(item.note).length <= 500
  )) throw new Error('Invalid receivables data')
  return items.map(({ id, person, amount, dueDate, note, collectedDate }) =>
    ({ id, person, amount, dueDate, note, collectedDate }))
}

export async function importLocalReceivables(userId, signal) {
  const key = receivablesKey(userId)
  const stored = localStorage.getItem(key)
  if (stored === null) return 0
  const items = parseLegacyReceivables(stored)
  for (let offset = 0; offset < items.length; offset += batchSize) {
    await api.post('/cobros/importar', { items: items.slice(offset, offset + batchSize) }, { accountId: userId, signal })
  }
  signal.throwIfAborted()
  // Preserve a different snapshot if another tab changed the legacy data during import.
  if (localStorage.getItem(key) === stored) localStorage.removeItem(key)
  return items.length
}
