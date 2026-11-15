import { useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { overdueRecurringPayments, recurringPaymentsDueOn } from '@/lib/recurring-payments'
import { overduePaymentsPath, recurringAmountLabel, upcomingPaymentsPath } from '@/lib/upcoming-payments'
import { useRecurringPayments } from '@/lib/use-recurring-payments'
import { formatDate } from '@/lib/utils'
import './payment-notifications.css'

function bellLabel(overdueCount, dueCount) {
  const total = overdueCount + dueCount
  if (!total) return 'Notificaciones'

  if (overdueCount > 0 && dueCount > 0) {
    const overdueText = `${overdueCount} ${overdueCount === 1 ? 'pago vencido' : 'pagos vencidos'}`
    const dueText = `${dueCount} ${dueCount === 1 ? 'vence hoy' : 'vencen hoy'}`
    return `Notificaciones: ${overdueText} y ${dueText}`
  }

  if (overdueCount > 0) {
    return `Notificaciones: ${overdueCount} ${overdueCount === 1 ? 'pago vencido' : 'pagos vencidos'}`
  }

  return `Notificaciones: ${dueCount} ${dueCount === 1 ? 'pago vence hoy' : 'pagos vencen hoy'}`
}

export function PaymentNotifications({ query }) {
  const { payments, loading, error, refresh, today } = useRecurringPayments()
  const [open, setOpen] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const dialog = useRef(null)
  const bell = useRef(null)
  const synced = !loading && !error
  const overdue = synced ? overdueRecurringPayments(payments, today) : []
  const due = synced ? recurringPaymentsDueOn(payments, today) : []
  const count = overdue.length + due.length

  function openPanel() {
    const panel = dialog.current
    if (panel.open) return
    panel.showModal()
    setOpen(true)
  }

  function closePanel() {
    dialog.current?.close()
  }

  async function retry() {
    if (retrying) return
    setRetrying(true)
    try {
      await refresh()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <>
      <button
        ref={bell}
        type="button"
        className="saldo-notifications-bell"
        aria-label={bellLabel(overdue.length, due.length)}
        aria-haspopup="dialog"
        aria-controls="saldo-notifications-dialog"
        aria-expanded={open}
        onClick={openPanel}
      >
        <Bell size={20} aria-hidden="true" />
        {count > 0 && <span className="saldo-notifications-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
      </button>
      <dialog
        id="saldo-notifications-dialog"
        ref={dialog}
        className="saldo-notifications-dialog"
        aria-labelledby="saldo-notifications-title"
        onClose={() => {
          setOpen(false)
          bell.current?.focus({ preventScroll: true })
        }}
      >
        <header className="saldo-notifications-header">
          <h2 id="saldo-notifications-title">Notificaciones</h2>
          <button type="button" className="saldo-notifications-close" aria-label="Cerrar notificaciones" onClick={closePanel}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {loading && <p className="saldo-notifications-note" role="status">Consultando tus pagos de hoy…</p>}
        {!loading && error && (
          <div className="saldo-notifications-error">
            <p className="saldo-notifications-note" role="status">
              {retrying ? 'Consultando tus pagos de hoy…' : 'No pudimos consultar tus pagos de hoy.'}
            </p>
            <button type="button" className="saldo-notifications-retry" disabled={retrying} onClick={retry}>Reintentar</button>
          </div>
        )}
        {synced && overdue.length > 0 && (
          <section aria-labelledby="saldo-notifications-overdue-title">
            <h3 id="saldo-notifications-overdue-title" className="saldo-notifications-subtitle">Vencidos</h3>
            <ul className="saldo-notifications-list" role="list">
              {overdue.map(({ payment, date }) => (
                <li key={`${payment.id}-${date}`}>
                  <span className="saldo-notifications-item-main">
                    <strong>{payment.name}</strong>
                    <time dateTime={date}>Venció el {formatDate(date)}</time>
                  </span>
                  <span className="saldo-notifications-amount">{recurringAmountLabel(payment)}</span>
                </li>
              ))}
            </ul>
            <Link
              className="saldo-notifications-link"
              to={overduePaymentsPath(query)}
              state={{ useCurrentAnalyticsPeriod: true }}
              onClick={closePanel}
            >
              Ver pagos vencidos
            </Link>
          </section>
        )}
        {synced && due.length > 0 && (
          <section aria-labelledby="saldo-notifications-due-title">
            <h3 id="saldo-notifications-due-title" className="saldo-notifications-subtitle">Pagos que vencen hoy</h3>
            <ul className="saldo-notifications-list" role="list">
              {due.map(({ payment, date }) => (
                <li key={`${payment.id}-${date}`}>
                  <span className="saldo-notifications-item-main">
                    <strong>{payment.name}</strong>
                    <time dateTime={date}>Vence hoy</time>
                  </span>
                  <span className="saldo-notifications-amount">{recurringAmountLabel(payment)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {synced && due.length === 0 && <p className="saldo-notifications-note">No tienes pagos que venzan hoy</p>}

        <Link
          className="saldo-notifications-link"
          to={upcomingPaymentsPath(query)}
          state={{ useCurrentAnalyticsPeriod: true }}
          onClick={closePanel}
        >
          Ver próximos pagos
        </Link>
      </dialog>
    </>
  )
}
