const guatemalaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guatemala',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function dateString(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function dateInGuatemala(date = new Date()) {
  const parts = Object.fromEntries(guatemalaDate.formatToParts(date).map(({ type, value }) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function recentClosedPeriod(today, cadence) {
  const [year, month, day] = today.split('-').map(Number)
  if (day >= 16 && cadence !== 'mensual') {
    return {
      kind: 'fortnight',
      year,
      month,
      start: dateString(year, month, 1),
      end: dateString(year, month, 15),
    }
  }

  const previousMonthEnd = new Date(Date.UTC(year, month - 1, 0))
  const closedYear = previousMonthEnd.getUTCFullYear()
  const closedMonth = previousMonthEnd.getUTCMonth() + 1
  return {
    kind: 'month',
    year: closedYear,
    month: closedMonth,
    start: dateString(closedYear, closedMonth, 1),
    end: dateString(closedYear, closedMonth, previousMonthEnd.getUTCDate()),
  }
}

export function sumPeriodAmounts(movements, { start, end }) {
  return movements.reduce((cents, movement) => {
    const date = movement.fecha.slice(0, 10)
    if (date < start || date > end) return cents
    return cents + Math.round(Number(movement.monto) * 100)
  }, 0)
}
