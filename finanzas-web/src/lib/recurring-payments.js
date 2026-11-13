import { api } from './api'

function recurringPaymentsKey(userId) {
  return `saldo.recurring-payments:${userId}`
}

function readRecurringPayments(key) {
  const records = JSON.parse(localStorage.getItem(key) ?? '[]')
  if (!Array.isArray(records) || records.some((record) => !record?.id || typeof record.name !== 'string'
    || !Array.isArray(record.days) || !record.days.length
    || record.days.some((day) => !Number.isInteger(day) || day < 1 || day > 31)
    || (record.paidDates != null && !Array.isArray(record.paidDates)))) {
    throw new Error('No se pudieron leer tus pagos recurrentes.')
  }
  return records
}

export function nextRecurringPayment(days, today, paidDates = []) {
  return upcomingRecurringPayments([{ days, paidDates }], today, 1)[0]?.date ?? ''
}

export function tomorrowDate(today) {
  const date = new Date(`${today}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function recurringDatesForMonth(days, year, month) {
  const end = new Date(Date.UTC(year, month, 0))
  const prefix = end.toISOString().slice(0, 7)
  const dates = days.map((day) => `${prefix}-${String(Math.min(day, end.getUTCDate())).padStart(2, '0')}`)
  return [...new Set(dates)].sort()
}

export function upcomingRecurringPayments(payments, today, limit = 3) {
  const recurring = payments.filter(({ days }) => days.length > 0)
  if (!recurring.length || !Number.isInteger(limit) || limit <= 0) return []

  const [year, month] = today.split('-').map(Number)
  const schedules = recurring.map((payment) => ({ payment, paid: new Set(payment.paidDates ?? []) }))
  const upcoming = []
  // A schedule contributes at least one date in each full month unless that date is marked paid.
  const maxOffset = Math.min(...schedules.map(({ paid }) => paid.size)) + limit

  for (let offset = 0; offset <= maxOffset && upcoming.length < limit; offset++) {
    for (const { payment, paid } of schedules) {
      for (const date of recurringDatesForMonth(payment.days, year, month + offset)) {
        if (date >= today && !paid.has(date)) upcoming.push({ payment, date })
      }
    }
  }

  return upcoming.sort((a, b) => a.date.localeCompare(b.date)
    || (a.payment.name ?? '').localeCompare(b.payment.name ?? '', 'es-GT')
    || String(a.payment.id).localeCompare(String(b.payment.id))).slice(0, limit)
}

export async function loadRecurringPayments(userId, signal) {
  const key = recurringPaymentsKey(userId)
  const options = { accountId: userId, signal }
  let local = []
  try {
    local = readRecurringPayments(key)
  } catch {
    // Keep the local copy if the browser cannot read it.
  }
  if (local.length) {
    for (let index = 0; index < local.length; index += 100) {
      await api.post('/pagos-programados/importar', { pagos: local.slice(index, index + 100) }, options)
    }
    try { localStorage.removeItem(key) } catch { /* The import can be retried safely. */ }
  }
  return api.get('/pagos-programados', options)
}
