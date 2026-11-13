import { useEffect, useId, useRef, useState } from 'react'
import { ArrowLeft, CalendarClock, Check, ChevronRight, CreditCard, Plus, Repeat2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FormField, FormMessage } from '@/components/FormField'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'
import { moneyAmount } from '@/lib/money-input'
import { dateInGuatemala } from '@/lib/period-recap'
import { nextRecurringPayment, recurringDatesForMonth } from '@/lib/recurring-payments'
import { useRecurringPayments } from '@/lib/use-recurring-payments'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, monthName, newOperationId } from '@/lib/utils'
import './recurring-payments.css'

const paymentKinds = { subscription: 'Suscripción o membresía', bill: 'Cuenta o servicio' }
const cardKinds = { none: 'Sin tarjeta', credit: 'Tarjeta de crédito', debit: 'Tarjeta de débito' }
const daysOfMonth = Array.from({ length: 31 }, (_, index) => index + 1)
const firstHalfDays = daysOfMonth.slice(0, 15)
const secondHalfDays = daysOfMonth.slice(15)
const initialPayment = {
  name: '', kind: 'subscription', amount: '', frequency: 'monthly',
  days: [1, 30], cardType: 'none', cardName: '', cutDay: '',
}

function DaySelect({ id, label, value, onChange, optional = false, options = daysOfMonth }) {
  return (
    <label htmlFor={id} className="recurring-field">
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {optional && <option value="">Sin fecha de corte</option>}
        {options.map((day) => <option key={day} value={day}>{day}</option>)}
      </select>
    </label>
  )
}

function PaymentEditor({ initial, busy, onSave, onRemove, onClose }) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const title = useRef(null)
  const cancel = useRef(null)
  const biweekly = draft.frequency === 'twice-monthly'
  const hasCard = draft.cardType !== 'none'

  useEffect(() => {
    if (confirming) cancel.current?.focus()
    else title.current?.focus()
  }, [confirming])

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  function changeFrequency(event) {
    const frequency = event.target.value
    setDraft((current) => {
      if (frequency === 'monthly') return { ...current, frequency }
      const firstDay = current.days.find((day) => day <= 15) ?? 15
      const secondDay = current.days.find((day) => day >= 16) ?? 30
      return { ...current, frequency, days: [firstDay, secondDay] }
    })
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const name = draft.name.trim()
    const amount = draft.amount ? moneyAmount(draft.amount) : ''
    const cardName = hasCard ? draft.cardName.trim() : ''
    const days = [Number(draft.days[0])]
    if (biweekly) days.push(Number(draft.days[1]))

    if (!name) return setError('Escribe un nombre para el pago.')
    if (draft.amount && !amount) return setError('Ingresa un monto mayor que cero o deja el campo vacío.')
    if (biweekly && days[0] === days[1]) return setError('Elige dos días distintos para el pago quincenal.')
    if (/\d{13}/.test(cardName.replace(/[\s-]/g, ''))) return setError('Escribe un alias sin el número de tarjeta.')

    setError(await onSave({
      ...draft,
      name,
      amount,
      days: days.sort((a, b) => a - b),
      cardName,
      cutDay: draft.cardType === 'credit' && draft.cutDay ? Number(draft.cutDay) : '',
    }))
  }

  if (confirming) {
    return (
      <div className="recurring-dialog-content">
        <h2 id="recurring-dialog-title">¿Eliminar este pago?</h2>
        <p>Quitarás <strong>{initial.name}</strong> de tus pagos recurrentes.</p>
        <FormMessage>{error}</FormMessage>
        <div className="recurring-actions">
          <Button ref={cancel} variant="secondary" disabled={busy} onClick={() => { setError(''); setConfirming(false) }}>Cancelar</Button>
          <Button variant="danger" disabled={busy} onClick={async () => setError(await onRemove(initial.id))}>Eliminar pago</Button>
        </div>
      </div>
    )
  }

  return (
    <form className="recurring-dialog-content" onSubmit={submit}>
      <header className="recurring-dialog-header">
        <h2 ref={title} id="recurring-dialog-title" tabIndex={-1}>{initial.id ? 'Editar pago' : 'Nuevo pago'}</h2>
        <Button size="icon" variant="ghost" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={21} aria-hidden="true" /></Button>
      </header>
      <FormField id="recurring-name" label="Nombre del pago" placeholder="Ej. Internet" value={draft.name} maxLength={70} onChange={(event) => update('name', event.target.value)} required />
      <label className="recurring-field" htmlFor="recurring-kind">
        <span>Tipo de pago</span>
        <select id="recurring-kind" value={draft.kind} onChange={(event) => update('kind', event.target.value)}>
          {Object.entries(paymentKinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <MoneyField id="recurring-amount" label="Monto por pago en Q (opcional)" value={draft.amount} onValueChange={(value) => update('amount', value)} />
      <label className="recurring-field" htmlFor="recurring-frequency">
        <span>Frecuencia</span>
        <select id="recurring-frequency" value={draft.frequency} onChange={changeFrequency}>
          <option value="monthly">Mensual</option>
          <option value="twice-monthly">Quincenal (dos veces al mes)</option>
        </select>
      </label>
      <div className="recurring-days" data-pair={biweekly}>
        <DaySelect id="recurring-first-day" label={biweekly ? 'Primer día de pago' : 'Día de pago'} options={biweekly ? firstHalfDays : daysOfMonth} value={draft.days[0]} onChange={(value) => update('days', [value, draft.days[1]])} />
        {biweekly && <DaySelect id="recurring-second-day" label="Segundo día de pago" options={secondHalfDays} value={draft.days[1]} onChange={(value) => update('days', [draft.days[0], value])} />}
      </div>
      <p className="recurring-note">En meses más cortos, el pago queda para el último día del mes.</p>
      <label className="recurring-field" htmlFor="recurring-card-type">
        <span>Tarjeta del pago</span>
        <select id="recurring-card-type" value={draft.cardType} onChange={(event) => update('cardType', event.target.value)}>
          {Object.entries(cardKinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      {hasCard && <FormField id="recurring-card-name" label="Alias de la tarjeta (opcional)" placeholder="Ej. Visa personal" hint="Usa un nombre, sin número de tarjeta." value={draft.cardName} maxLength={32} onChange={(event) => update('cardName', event.target.value)} />}
      {draft.cardType === 'credit' && <DaySelect id="recurring-cut-day" label="Día de corte de la tarjeta (opcional)" value={draft.cutDay} onChange={(value) => update('cutDay', value)} optional />}
      <FormMessage>{error}</FormMessage>
      <div className="recurring-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar pago'}</Button>
      </div>
      {initial.id && <Button className="recurring-delete" variant="ghost" disabled={busy} onClick={() => { setError(''); setConfirming(true) }}>Eliminar este pago</Button>}
    </form>
  )
}

function PaymentCard({ payment, nextDate, dates, onEdit }) {
  const datesId = useId()
  const Icon = payment.cardType === 'none' ? CalendarClock : CreditCard
  const schedule = payment.days.length === 1 ? `Día ${payment.days[0]} de cada mes` : `Días ${payment.days.join(' y ')} de cada mes`

  return (
    <li>
      <button type="button" className="recurring-card" aria-haspopup="dialog" aria-label={`Editar pago ${payment.name}`} aria-describedby={datesId} onClick={onEdit}>
        <span className="recurring-card-header">
          <span className="recurring-card-icon"><Icon size={22} aria-hidden="true" /></span>
          <span className="recurring-card-name"><strong>{payment.name}</strong><span>{paymentKinds[payment.kind]}</span></span>
          <ChevronRight size={19} className="recurring-card-chevron" aria-hidden="true" />
        </span>
        {payment.amount && <strong className="recurring-card-amount">{formatCurrency(payment.amount)}</strong>}
        <span className="recurring-card-row"><span>Próximo pago</span><time dateTime={nextDate}>{formatDate(nextDate)}</time></span>
        <span className="recurring-card-row" id={datesId}>
          <span>Fechas del mes</span>
          <span className="recurring-card-dates">
            {dates.map((date) => (
              <span key={date} className="recurring-card-date">
                <time dateTime={date}>{formatDate(date)}</time>
                {payment.paidDates?.includes(date) && <span className="recurring-card-paid"><Check size={13} aria-hidden="true" /> Pagado</span>}
              </span>
            ))}
          </span>
        </span>
        <span className="recurring-card-row"><span>{payment.frequency === 'monthly' ? 'Mensual' : 'Quincenal'}</span><span>{schedule}</span></span>
        {payment.cardType !== 'none' && (
          <span className="recurring-card-row"><span>{cardKinds[payment.cardType]}</span><span>{[payment.cardName, payment.cutDay && `Corte el día ${payment.cutDay}`].filter(Boolean).join(' · ')}</span></span>
        )}
      </button>
    </li>
  )
}

export function RecurringPaymentsPage() {
  const { user } = useAuth()
  const { query } = useDashboardPeriod()
  const records = useRecurringPayments(user.id)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const dialog = useRef(null)
  const addButton = useRef(null)
  const removedTrigger = useRef(false)
  const pending = useRef(false)
  const draftId = useRef(null)
  const today = dateInGuatemala()
  const [year, month] = today.split('-').map(Number)
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [selectedYear, setSelectedYear] = useState(year)
  const payments = records.payments
    .map((payment) => ({
      payment,
      nextDate: nextRecurringPayment(payment.days, today, payment.paidDates),
      dates: recurringDatesForMonth(payment.days, selectedYear, selectedMonth),
    }))
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.payment.name.localeCompare(b.payment.name))

  useEffect(() => {
    if (editing && !dialog.current.open) dialog.current.showModal()
  }, [editing])

  function openEditor(payment) {
    setNotice('')
    draftId.current = payment.id || newOperationId()
    setEditing(payment)
  }

  async function store(operation, message, removed = false) {
    if (pending.current) return ''
    pending.current = true
    setBusy(true)
    try {
      await operation()
      await records.refresh()
      removedTrigger.current = removed
      setNotice(message)
      dialog.current.close()
      return ''
    } catch (error) {
      return Object.values(error.errors ?? {})[0]?.[0] || error.message
    } finally {
      setBusy(false)
      pending.current = false
    }
  }

  function save(payment) {
    return store(() => api.put(`/pagos-programados/${draftId.current}`, payment, { accountId: user.id }),
      payment.id ? 'Pago actualizado.' : 'Pago agregado.')
  }

  function remove(id) {
    return store(() => api.delete(`/pagos-programados/${id}`, { accountId: user.id }), 'Pago eliminado.', true)
  }

  function closeEditor() {
    setEditing(null)
    if (removedTrigger.current) addButton.current?.focus({ preventScroll: true })
    removedTrigger.current = false
  }

  return (
    <section className="recurring-payments" aria-labelledby="recurring-title">
      <Link className="recurring-back" to={`/?${query}`}><ArrowLeft size={19} aria-hidden="true" /> Inicio</Link>
      <header className="recurring-heading">
        <div>
          <h1 id="recurring-title">Pagos recurrentes</h1>
          <p>Consulta tus suscripciones, cuentas y próximas fechas de pago.</p>
        </div>
        <Button ref={addButton} disabled={records.loading || Boolean(records.error)} onClick={() => openEditor(initialPayment)}><Plus size={19} aria-hidden="true" /> Agregar pago</Button>
      </header>
      <p className="recurring-note">Tu calendario se guarda en tu cuenta de Saldo.</p>
      <p className="recurring-notice" role="status">{notice}</p>
      <FormMessage>{records.error}</FormMessage>
      {records.error && <Button variant="secondary" size="sm" onClick={records.refresh}>Reintentar</Button>}
      {records.loading && <p role="status">Cargando pagos…</p>}
      {!records.loading && !records.error && (payments.length > 0 ? (
        <>
          <div className="recurring-period" role="group" aria-label="Consultar fechas programadas">
            <label className="recurring-field">Mes
              <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{monthName(value)}</option>)}
              </select>
            </label>
            <label className="recurring-field">Año
              <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
                {Array.from({ length: 7 }, (_, index) => year - 3 + index).map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <ul className="recurring-list" role="list">
            {payments.map(({ payment, nextDate, dates }) => <PaymentCard key={payment.id} payment={payment} nextDate={nextDate} dates={dates} onEdit={() => openEditor(payment)} />)}
          </ul>
        </>
      ) : (
        <div className="recurring-empty">
          <Repeat2 size={27} aria-hidden="true" />
          <p>Todavía no tienes pagos recurrentes.</p>
        </div>
      ))}
      <dialog ref={dialog} className="recurring-dialog" aria-labelledby="recurring-dialog-title" onClose={closeEditor}
        onCancel={(event) => { if (pending.current) event.preventDefault() }}>
        {editing && <PaymentEditor initial={editing} busy={busy} onSave={save} onRemove={remove} onClose={() => dialog.current.close()} />}
      </dialog>
    </section>
  )
}
