import { moneyAmount } from './money-input'
import { formatCurrency } from './utils'

// Existing destination of every "Próximos pagos" shortcut in Análisis.
export const upcomingPaymentsAnchor = 'saldo-upcoming-title'
export const overduePaymentsAnchor = 'saldo-overdue-title'

export function upcomingPaymentsPath(query) {
  return `/analisis?${query}&vista=egresos#${upcomingPaymentsAnchor}`
}

export function overduePaymentsPath(query) {
  return `/analisis?${query}&vista=egresos#${overduePaymentsAnchor}`
}

export function recurringAmountLabel(payment) {
  const amount = moneyAmount(payment.amount)
  return amount ? formatCurrency(amount) : 'Monto por definir'
}
