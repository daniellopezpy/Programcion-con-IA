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

export function formatearMoneda(value) {
  return formatCurrency(value)
}

export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

export function formatearFecha(value) {
  return formatDate(value)
}

export function monthName(month) {
  return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][Number(month) - 1] || '—'
}

export function shortMonthName(month) {
  return monthName(month).slice(0, 3)
}

export function nombreMes(month) {
  return monthName(month)
}

export function getCurrentPeriod() {
  const now = new Date()
  return { anio: String(now.getFullYear()), mes: String(now.getMonth() + 1) }
}

export function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}
