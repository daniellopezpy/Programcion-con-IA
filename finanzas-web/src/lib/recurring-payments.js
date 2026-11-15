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

export function activeStageOn(payment, date) {
  const stages = payment?.scheduleHistory
  if (Array.isArray(stages) && stages.length > 0) {
    let active = null
    for (const stage of stages) {
      if (stage.startsOn <= date) {
        active = stage
      } else {
        break
      }
    }
    if (active) return active
  }
  return { startsOn: payment?.createdOn ?? '', days: payment?.days ?? [] }
}

export function activeStageDaysOn(payment, date) {
  return activeStageOn(payment, date).days ?? []
}

// Scheduled dates for a given month respecting each schedule stage and preventing
// pre-creation dates from appearing. Gathers dates per active stage interval in the month.
export function scheduledDatesForMonth(payment, year, month) {
  if (!payment) return []
  const createdOn = payment.createdOn
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
  if (createdOn && monthPrefix < createdOn.slice(0, 7)) {
    return []
  }

  const stages = Array.isArray(payment.scheduleHistory) && payment.scheduleHistory.length > 0
    ? [...payment.scheduleHistory].sort((a, b) => a.startsOn.localeCompare(b.startsOn))
    : (payment.days?.length ? [{ startsOn: payment.createdOn ?? '', days: payment.days }] : [])

  if (!stages.length) return []

  const monthStart = `${monthPrefix}-01`
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const monthEnd = `${monthPrefix}-${String(lastDayOfMonth).padStart(2, '0')}`

  const dates = new Set()

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]
    if (!Array.isArray(stage.days) || !stage.days.length) continue

    const stageStart = (createdOn && stage.startsOn < createdOn) ? createdOn : stage.startsOn
    const nextStage = stages[i + 1]
    const stageEnd = nextStage ? nextStage.startsOn : '9999-12-31'

    if (stageStart > monthEnd || stageEnd <= monthStart) continue

    const candidateDates = recurringDatesForMonth(stage.days, year, month)
    for (const date of candidateDates) {
      if ((!stageStart || date >= stageStart) && date < stageEnd) {
        dates.add(date)
      }
    }
  }

  return [...dates].sort()
}

function compareOccurrences(a, b) {
  return (a.payment.name ?? '').localeCompare(b.payment.name ?? '', 'es-GT')
    || String(a.payment.id).localeCompare(String(b.payment.id))
}

// Every unpaid occurrence from payment creation inclusive strictly before today,
// ordered oldest first with stable tie-break.
// If createdOn is missing/null, no overdue payments are calculated.
export function overdueRecurringPayments(payments, today) {
  const overdue = []

  for (const payment of payments) {
    if (!payment?.createdOn || payment.createdOn >= today) continue
    const paid = new Set(payment.paidDates ?? [])

    const [startYear, startMonth] = payment.createdOn.split('-').map(Number)
    const [endYear, endMonth] = today.split('-').map(Number)

    let curYear = startYear
    let curMonth = startMonth

    while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
      const dates = scheduledDatesForMonth(payment, curYear, curMonth)
      for (const date of dates) {
        if (date < today && !paid.has(date)) {
          overdue.push({ payment, date })
        }
      }
      curMonth++
      if (curMonth > 12) {
        curMonth = 1
        curYear++
      }
    }
  }

  return overdue.sort((a, b) => a.date.localeCompare(b.date) || compareOccurrences(a, b))
}

// Every unpaid occurrence scheduled exactly on `date`, without a limit.
export function recurringPaymentsDueOn(payments, date) {
  const [year, month] = date.split('-').map(Number)
  return payments
    .filter((payment) => !(payment.paidDates ?? []).includes(date)
      && scheduledDatesForMonth(payment, year, month).includes(date))
    .map((payment) => ({ payment, date }))
    .sort(compareOccurrences)
}

export function upcomingRecurringPayments(payments, today, limit = 3) {
  const recurring = payments.filter((payment) => {
    return (payment.scheduleHistory?.length > 0) || (Array.isArray(payment.days) && payment.days.length > 0)
  })
  if (!recurring.length || !Number.isInteger(limit) || limit <= 0) return []

  const [year, month] = today.split('-').map(Number)
  const schedules = recurring.map((payment) => ({ payment, paid: new Set(payment.paidDates ?? []) }))
  const upcoming = []
  // Dynamic horizon based on paidDates to collect at least `limit` occurrences
  const maxOffset = Math.min(...schedules.map(({ paid }) => paid.size)) + limit

  for (let offset = 0; offset <= maxOffset && upcoming.length < limit; offset++) {
    const targetMonth = month + offset
    const calcYear = year + Math.floor((targetMonth - 1) / 12)
    const calcMonth = ((targetMonth - 1) % 12) + 1

    for (const { payment, paid } of schedules) {
      const dates = scheduledDatesForMonth(payment, calcYear, calcMonth)
      for (const date of dates) {
        if (date >= today && !paid.has(date)) {
          upcoming.push({ payment, date })
        }
      }
    }
  }

  return upcoming.sort((a, b) => a.date.localeCompare(b.date) || compareOccurrences(a, b)).slice(0, limit)
}

export function nextRecurringPayment(paymentOrDays, today, paidDates = [], createdOn = '') {
  if (paymentOrDays && typeof paymentOrDays === 'object' && !Array.isArray(paymentOrDays)) {
    return upcomingRecurringPayments([paymentOrDays], today, 1)[0]?.date ?? ''
  }
  return upcomingRecurringPayments([{ days: paymentOrDays, paidDates, createdOn }], today, 1)[0]?.date ?? ''
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
