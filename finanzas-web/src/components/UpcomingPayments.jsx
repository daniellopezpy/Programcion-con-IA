import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarClock, Check, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { moneyAmount } from '@/lib/money-input'
import { dateInGuatemala } from '@/lib/period-recap'
import { tomorrowDate, upcomingRecurringPayments } from '@/lib/recurring-payments'
import { useRecurringPayments } from '@/lib/use-recurring-payments'
import { formatCurrency, formatDate } from '@/lib/utils'
import './home-transaction-sheet.css'

function paymentAmount(payment) {
  const amount = moneyAmount(payment.amount)
  return amount ? formatCurrency(amount) : 'Monto por definir'
}

function expensePath({ payment, date }) {
  return `/egresos/recurrentes/${encodeURIComponent(payment.id)}/${date}`
}

export function UpcomingPayments({ userId, query, onExpenseChange }) {
  const { payments, loading, error, refresh } = useRecurringPayments(userId)
  const [today, setToday] = useState(dateInGuatemala)
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
  const trigger = useRef(null)
  const upcoming = upcomingRecurringPayments(payments, today)
  const tomorrow = tomorrowDate(today)

  useEffect(() => {
    const updateDate = () => setToday(dateInGuatemala())
    const clock = window.setInterval(updateDate, 60_000)
    window.addEventListener('focus', updateDate)
    return () => {
      window.clearInterval(clock)
      window.removeEventListener('focus', updateDate)
    }
  }, [])

  useLayoutEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal()
  }, [selected])

  function openPayment(occurrence, event) {
    if (pending.current) return
    trigger.current = event.currentTarget
    setSaveError('')
    setAmountError('')
    setDraftAmount(moneyAmount(occurrence.payment.amount) ?? '')
    setSelected(occurrence)
  }

  function closePayment() {
    setSelected(null)
    setSaveError('')
    const focusTarget = trigger.current?.isConnected ? trigger.current : heading.current
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
    pending.current = true
    setBusy(true)
    setSaveError('')
    try {
      await api.delete(expensePath(lastMarked), { accountId: userId })
      onExpenseChange()
      await refresh()
      setLastMarked(null)
      setNotice('Gasto eliminado y pago devuelto a pendientes.')
      heading.current?.focus({ preventScroll: true })
    } catch (requestError) {
      setSaveError(requestError.errors?.egreso?.[0] || requestError.message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <section className="saldo-upcoming" aria-labelledby="saldo-upcoming-title">
      <header className="saldo-upcoming-header">
        <h2 id="saldo-upcoming-title" ref={heading} tabIndex={-1}><CalendarClock size={21} aria-hidden="true" /> Próximos pagos</h2>
        <Link className="saldo-upcoming-link" to={`/pagos-recurrentes?${query}`}>
          {upcoming.length > 0 || error ? 'Ver calendario' : 'Agregar un pago'}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </header>
      <div className="saldo-upcoming-feedback">
        <p role="status">{notice}</p>
        {lastMarked && <button type="button" className="saldo-upcoming-undo" disabled={busy} onClick={undoPaid}>Deshacer</button>}
      </div>
      {loading && <p className="saldo-upcoming-note" role="status">Consultando próximos pagos…</p>}
      {error && <div><p className="saldo-upcoming-note" role="status">{error}</p><Button size="sm" variant="secondary" onClick={refresh}>Reintentar</Button></div>}
      {!selected && saveError && <p className="saldo-upcoming-error" role="alert">{saveError}</p>}
      {!loading && !error && upcoming.length === 0 && <p className="saldo-upcoming-note">Aquí verás las próximas fechas de tus suscripciones y cuentas.</p>}
      {upcoming.length > 0 && (
        <ol className="saldo-upcoming-list" role="list">
          {upcoming.map((occurrence) => {
            const { payment, date } = occurrence
            const amount = paymentAmount(payment)
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
