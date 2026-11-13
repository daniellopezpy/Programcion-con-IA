import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { dateInGuatemala } from './period-recap'

export function cn(...values) {
  return twMerge(clsx(values))
}

export function newOperationId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
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
  const date = value instanceof Date
    ? value
    : /^\d{4}-\d{2}-\d{2}$/.test(String(value))
      ? new Date(`${value}T00:00:00Z`)
      : new Date(value)

  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
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
  const [year, month] = dateInGuatemala().split('-')
  return { anio: year, mes: String(Number(month)) }
}

export function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}
