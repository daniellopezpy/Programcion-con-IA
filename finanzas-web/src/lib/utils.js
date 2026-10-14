import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...values) {
  return twMerge(clsx(values))
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export function getCurrentPeriod() {
  const now = new Date()
  return { anio: String(now.getFullYear()), mes: String(now.getMonth() + 1) }
}

export function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}
