import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarClock, Check, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { moneyAmount } from '@/lib/money-input'
import { overdueRecurringPayments, tomorrowDate, upcomingRecurringPayments } from '@/lib/recurring-payments'
import { overduePaymentsAnchor, recurringAmountLabel, upcomingPaymentsAnchor } from '@/lib/upcoming-payments'
import { useRecurringPayments } from '@/lib/use-recurring-payments'
import { formatCurrency, formatDate } from '@/lib/utils'
import './home-transaction-sheet.css'

function expensePath({ payment, date }) {
  return `/egresos/recurrentes/${encodeURIComponent(payment.id)}/${date}`
}

export function UpcomingPayments({ userId, query, onExpenseChange }) {
  const { payments, loading, error, refresh, today } = useRecurringPayments()
  const { hash, key: locationKey } = useLocation()
  const [selected, setSelected] = useState(null)
  const [lastMarked, setLastMarked] = useState(null)
  const [notice, setNotice] = useState('')
  const [saveError, setSaveError] = useState('')
  const [draftAmount, setDraftAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const dialog = useRef(null)
  const heading = useRef(null)
  const overdueHeading = useRef(null)
  const trigger = useRef(null)
  const navigatedTargetRef = useRef(null)
  const overdue = overdueRecurringPayments(payments, today)
  const upcoming = upcomingRecurringPayments(payments, today)
  const tomorrow = tomorrowDate(today)

  const isOverdueTarget = hash === `#${overduePaymentsAnchor}`
  const isUpcomingTarget = hash === `#${upcomingPaymentsAnchor}`
  const isTargetNav = isOverdueTarget || isUpcomingTarget
  const showOverdueSection = overdue.length > 0 || (isOverdueTarget && !loading && !error)

  useLayoutEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal()
  }, [selected])

  useEffect(() => {
    if (!isTargetNav || loading) return

    const targetId = hash.slice(1)
    const navToken = `${locationKey}:${targetId}`

    if (navigatedTargetRef.current === navToken) return

    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(targetId)
      if (el) {
        navigatedTargetRef.current = navToken
        el.focus({ preventScroll: true })
        el.scrollIntoView({ block: 'start' })
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [hash, locationKey, isTargetNav, loading, showOverdueSection, upcoming.length])

  function openPayment(occurrence, event) {
    if (pending.current) return
    trigger.current = event.currentTarget
    setSaveError('')
    setAmountError('')
    setDraftAmount(moneyAmount(occurrence.payment.amount) ?? '')
    setSelected(occurrence)
  }

  function closePayment() {
    const wasOverdue = selected?.date && selected.date < today
    setSelected(null)
    setSaveError('')
    const defaultHeading = wasOverdue && overdueHeading.current ? overdueHeading.current : heading.current
    const focusTarget = trigger.current?.isConnected ? trigger.current : defaultHeading
    focusTarget?.focus({ preventScroll: true })
    trigger.current = null
  }

  async function markPaid(event) {
    event.preventDefault()
    if (pending.current || !selected) return
    const amount = moneyAmount(draftAmount)
    if (!amount) {
      setAmountError('Ingresa un monto mayor que Q 0.00.')
      return
    }

    pending.current = true
    setBusy(true)
    setSaveError('')
    try {
      const expense = await api.post(expensePath(selected), { descripcion: selected.payment.name, monto: amount }, { accountId: userId })
      onExpenseChange()
      await refresh()
      setLastMarked(selected)
      setNotice(`Registraste ${expense.descripcion} como gasto por ${formatCurrency(expense.monto)}.`)
      trigger.current = null
      dialog.current?.close()
    } catch (requestError) {
      if (requestError.errors?.monto?.[0]) setAmountError(requestError.errors.monto[0])
      else setSaveError(requestError.errors?.vencimiento?.[0] || requestError.message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  async function undoPaid() {
    if (pending.current || !lastMarked) return
    const wasOverdue = lastMarked.date < today
    pending.current = true
    setBusy(true)
    setSaveError('')
    try {
      await api.delete(expensePath(lastMarked), { accountId: userId })
      onExpenseChange()
      await refresh()
      setLastMarked(null)
      setNotice('Gasto eliminado y pago devuelto a pendientes.')
      const targetHeading = wasOverdue && overdueHeading.current ? overdueHeading.current : heading.current
      targetHeading?.focus({ preventScroll: true })
    } catch (requestError) {
      setSaveError(requestError.errors?.egreso?.[0] || requestError.message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <section className="saldo-upcoming" aria-labelledby={showOverdueSection ? overduePaymentsAnchor : upcomingPaymentsAnchor}>
      <div className="saldo-upcoming-feedback">
        <p role="status">{notice}</p>
        {lastMarked && <button type="button" className="saldo-upcoming-undo" disabled={busy} onClick={undoPaid}>Deshacer</button>}
      </div>
      {loading && <p className="saldo-upcoming-note" role="status">Consultando próximos pagos…</p>}
      {error && <div><p className="saldo-upcoming-note" role="status">{error}</p><Button size="sm" variant="secondary" onClick={refresh}>Reintentar</Button></div>}
      {!selected && saveError && <p className="saldo-upcoming-error" role="alert">{saveError}</p>}

      {showOverdueSection && (
        <div className="saldo-overdue-block">
          <header className="saldo-upcoming-header">
            <h2 id={overduePaymentsAnchor} ref={overdueHeading} tabIndex={-1}>
              <CalendarClock size={21} aria-hidden="true" /> Pagos vencidos
            </h2>
          </header>
          {overdue.length === 0 ? (
            <p className="saldo-upcoming-note">No tienes pagos vencidos.</p>
          ) : (
            <ol className="saldo-upcoming-list" role="list">
              {overdue.map((occurrence) => {
                const { payment, date } = occurrence
                const amount = recurringAmountLabel(payment)
                return (
                  <li key={`${payment.id}-${date}`}>
                    <button type="button" className="saldo-upcoming-row" aria-haspopup="dialog" disabled={busy} onClick={(event) => openPayment(occurrence, event)}>
                      <span>
                        <span className="saldo-upcoming-name">{payment.name}</span>
                        <time dateTime={date} className="saldo-upcoming-overdue-time">
                          Venció el {formatDate(date)}
                        </time>
                      </span>
                      <span className="saldo-upcoming-row-amount">{amount}</span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}

      <div className="saldo-upcoming-block">
        <header className="saldo-upcoming-header">
          <h2 id={upcomingPaymentsAnchor} ref={heading} tabIndex={-1}><CalendarClock size={21} aria-hidden="true" /> Próximos pagos</h2>
          <Link className="saldo-upcoming-link" to={`/pagos-recurrentes?${query}`}>
            {upcoming.length > 0 || error ? 'Ver calendario' : 'Agregar un pago'}
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </header>
        {!loading && !error && upcoming.length === 0 && <p className="saldo-upcoming-note">Aquí verás las próximas fechas de tus suscripciones y cuentas.</p>}
        {upcoming.length > 0 && (
          <ol className="saldo-upcoming-list" role="list">
            {upcoming.map((occurrence) => {
              const { payment, date } = occurrence
              const amount = recurringAmountLabel(payment)
              return (
                <li key={`${payment.id}-${date}`}>
                  <button type="button" className="saldo-upcoming-row" aria-haspopup="dialog" disabled={busy} onClick={(event) => openPayment(occurrence, event)}>
                    <span>
                      <span className="saldo-upcoming-name">{payment.name}</span>
                      <time dateTime={date} className={date <= tomorrow ? 'saldo-upcoming-due' : undefined}>
                        {date === today ? 'Vence hoy' : date === tomorrow ? 'Vence mañana' : formatDate(date)}
                      </time>
                    </span>
                    <span className="saldo-upcoming-row-amount">{amount}</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <dialog ref={dialog} className="saldo-transaction-sheet" aria-labelledby="saldo-upcoming-confirm-title" onClose={closePayment} onCancel={(event) => { if (pending.current) event.preventDefault() }}>
        {selected && (
          <form className="saldo-transaction-sheet-content saldo-upcoming-confirm" onSubmit={markPaid} aria-busy={busy}>
            <h2 id="saldo-upcoming-confirm-title">Marcar como pagado</h2>
            <div>
              <p className="saldo-upcoming-name">{selected.payment.name}</p>
              <p className="saldo-upcoming-note">Vencimiento <time dateTime={selected.date}>{formatDate(selected.date)}</time></p>
            </div>
            <MoneyField
              id="saldo-upcoming-expense-amount"
              name="monto"
              label="Monto pagado (Q)"
              value={draftAmount}
              onValueChange={(value) => { setDraftAmount(value); setAmountError('') }}
              error={amountError}
              disabled={busy}
              required
            />
            <p className="saldo-upcoming-note">Saldo registrará el gasto con la fecha de hoy.</p>
            {saveError && <p className="saldo-upcoming-error" role="alert">{saveError}</p>}
            <div className="saldo-transaction-actions">
              <Button variant="secondary" autoFocus disabled={busy} onClick={() => dialog.current.close()}>Cancelar</Button>
              <Button type="submit" disabled={busy}><Check size={18} aria-hidden="true" /> {busy ? 'Registrando…' : 'Marcar como pagado'}</Button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  )
}
