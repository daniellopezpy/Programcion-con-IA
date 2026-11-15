import { monthName } from '@/lib/utils'

function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function padZero(num) {
  return String(num).padStart(2, '0')
}

function formatISODate(year, month, day) {
  return `${year}-${padZero(month)}-${padZero(day)}`
}

export function formatExplicitDateRange(startDay, endDay, month, year) {
  const name = (monthName(month) || '').toLowerCase()
  if (startDay === endDay) {
    return `${startDay} de ${name} de ${year}`
  }
  return `${startDay} al ${endDay} de ${name} de ${year}`
}

export function getComparisonRanges(year, month, todayDateString) {
  if (!todayDateString) return null
  const [todayYear, todayMonth, todayDay] = todayDateString.split('-').map(Number)

  // Otros modos y meses futuros sin consultas de comparación.
  const isFuture = year > todayYear || (year === todayYear && month > todayMonth)
  if (isFuture) {
    return null
  }

  // Enero compara diciembre del año anterior.
  const prevYear = month === 1 ? year - 1 : year
  const prevMonth = month === 1 ? 12 : month - 1

  const isCurrentMonth = year === todayYear && month === todayMonth

  const currentStartDay = 1
  let currentEndDay
  const prevStartDay = 1
  let prevEndDay

  if (isCurrentMonth) {
    // Para el mes actual usa del 1 al día disponible en ambos meses
    // (si el anterior es más corto, acota ambos al último día del anterior).
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth)
    const maxDay = Math.min(todayDay, prevMonthDays)
    currentEndDay = maxDay
    prevEndDay = maxDay
  } else {
    // Para un mes cerrado, meses completos.
    currentEndDay = getDaysInMonth(year, month)
    prevEndDay = getDaysInMonth(prevYear, prevMonth)
  }

  return {
    current: {
      year,
      month,
      startDay: currentStartDay,
      endDay: currentEndDay,
      desde: formatISODate(year, month, currentStartDay),
      hasta: formatISODate(year, month, currentEndDay),
    },
    previous: {
      year: prevYear,
      month: prevMonth,
      startDay: prevStartDay,
      endDay: prevEndDay,
      desde: formatISODate(prevYear, prevMonth, prevStartDay),
      hasta: formatISODate(prevYear, prevMonth, prevEndDay),
    },
  }
}

function filterMovementsByDateRange(movements, desde, hasta) {
  return movements.filter((item) => {
    const date = item?.fecha?.slice(0, 10)
    return Boolean(date && date >= desde && date <= hasta)
  })
}

function accumulateCategoryTotals(categoryMap, movements, field) {
  for (const item of movements) {
    const rawId = item.categoria_id ?? item.categoria?.id
    if (rawId == null) continue
    const catId = Number(rawId)
    if (Number.isNaN(catId)) continue

    const cents = Math.round(Number(item.monto || 0) * 100)
    if (!Number.isFinite(cents) || cents <= 0) continue

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        id: catId,
        name: item.categoria?.nombre || 'Otro egreso',
        currentCents: 0,
        previousCents: 0,
      })
    }
    const entry = categoryMap.get(catId)
    entry[field] += cents
    if (item.categoria?.nombre) {
      entry.name = item.categoria.nombre
    }
  }
}

export function calculateExpenseChange(currentMovements, previousMovements, currentRange, previousRange) {
  if (!Array.isArray(currentMovements) || !Array.isArray(previousMovements) || !currentRange || !previousRange) {
    return null
  }

  const currentFiltered = filterMovementsByDateRange(currentMovements, currentRange.desde, currentRange.hasta)
  const previousFiltered = filterMovementsByDateRange(previousMovements, previousRange.desde, previousRange.hasta)
  if (currentFiltered.length === 0 || previousFiltered.length === 0) return null

  const categoryMap = new Map()
  accumulateCategoryTotals(categoryMap, currentFiltered, 'currentCents')
  accumulateCategoryTotals(categoryMap, previousFiltered, 'previousCents')

  const candidates = []
  for (const entry of categoryMap.values()) {
    const diffCents = entry.currentCents - entry.previousCents
    const absDiff = Math.abs(diffCents)
    if (absDiff > 0) {
      candidates.push({
        ...entry,
        diffCents,
        absDiff,
      })
    }
  }

  // Oculta tarjeta si no hay variación
  if (candidates.length === 0) {
    return null
  }

  // Elige un único cambio por diferencia absoluta mayor y desempata de forma estable
  candidates.sort((a, b) => {
    if (b.absDiff !== a.absDiff) {
      return b.absDiff - a.absDiff
    }
    if (b.currentCents !== a.currentCents) {
      return b.currentCents - a.currentCents
    }
    const nameDiff = String(a.name).localeCompare(String(b.name), 'es')
    if (nameDiff !== 0) {
      return nameDiff
    }
    return Number(a.id) - Number(b.id)
  })

  return candidates[0]
}
