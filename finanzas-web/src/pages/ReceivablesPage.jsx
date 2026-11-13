import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, HandCoins, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActivityHeading } from '@/components/ActivityList'
import { FormField, FormMessage } from '@/components/FormField'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'
import { moneyAmount } from '@/lib/money-input'
import { dateInGuatemala } from '@/lib/period-recap'
import { importLocalReceivables, isReceivableDate } from '@/lib/receivables'
import { formatCurrency, formatDate } from '@/lib/utils'
import '@/components/home-transaction-sheet.css'
import './receivables-page.css'

const blankReceivable = { person: '', amount: '', dueDate: '', note: '', collectedDate: '' }
const loadErrorMessage = 'No pudimos consultar tus cobros. Comprueba tu conexión e inténtalo de nuevo.'
const importWarningMessage = 'No pudimos importar los cobros guardados en este navegador. Siguen aquí; puedes reintentar sin duplicarlos.'
const newReceivableId = () => Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(36)).join('-')
const recordPath = (id) => `/cobros/${encodeURIComponent(id)}`

function comparePending(left, right) {
  return (left.dueDate || '9999').localeCompare(right.dueDate || '9999')
}

function ReceivableCard({ item, today, onEdit }) {
  const overdue = !item.collectedDate && item.dueDate && item.dueDate < today
  const dueToday = !item.collectedDate && item.dueDate === today

  return (
    <li>
      <button className="saldo-receivable-card" type="button" onClick={onEdit} aria-haspopup="dialog">
        <span className="saldo-receivable-card-icon">
          {item.collectedDate ? <Check size={20} aria-hidden="true" /> : <HandCoins size={20} aria-hidden="true" />}
        </span>
        <span className="saldo-receivable-card-main">
          <strong>{item.person}</strong>
          {item.collectedDate ? (
            <span>Cobrado el <time dateTime={item.collectedDate}>{formatDate(item.collectedDate)}</time></span>
          ) : item.dueDate ? (
            <span data-overdue={Boolean(overdue)}>
              {overdue ? 'Venció el ' : dueToday ? 'Vence hoy, ' : 'Vence el '}
              <time dateTime={item.dueDate}>{formatDate(item.dueDate)}</time>
            </span>
          ) : <span>Sin fecha acordada</span>}
        </span>
        <strong className="saldo-receivable-card-amount">{formatCurrency(item.amount)}</strong>
        <ChevronRight className="saldo-receivable-card-arrow" size={17} aria-hidden="true" />
      </button>
    </li>
  )
}

export function ReceivablesPage() {
  const { user } = useAuth()
  return <ReceivablesForAccount key={user.id} userId={user.id} />
}

function ReceivablesForAccount({ userId }) {
  const { query } = useDashboardPeriod()
  const [records, setRecords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [importWarning, setImportWarning] = useState('')
  const [imported, setImported] = useState(false)
  const [view, setView] = useState('pending')
  const [draft, setDraft] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [incomeQuery, setIncomeQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const newId = useRef(null)
  const loadInFlight = useRef(null)
  const refreshController = useRef(null)
  const dialog = useRef(null)
  const closeButton = useRef(null)
  const cancelConfirmation = useRef(null)
  const addButton = useRef(null)
  const focusTrigger = useRef(null)
  const id = useId()
  const today = dateInGuatemala()
  const items = records ?? []
  const pending = items.filter(({ collectedDate }) => !collectedDate).sort(comparePending)
  const collected = items.filter(({ collectedDate }) => collectedDate)
    .sort((left, right) => right.collectedDate.localeCompare(left.collectedDate))
  const pendingTotal = pending.reduce((cents, { amount }) => cents + Math.round(Number(amount) * 100), 0) / 100
  const visible = view === 'pending' ? pending : collected
  const editing = draft?.id != null
  const linked = Boolean(draft?.collectedDate && draft.incomeId)

  const refresh = useCallback(async (signal) => {
    if (saving.current || (loadInFlight.current && !loadInFlight.current.aborted) || signal.aborted) return
    loadInFlight.current = signal
    setLoading(true)
    const current = () => !signal.aborted
    try {
      try {
        const count = await importLocalReceivables(userId, signal)
        if (current()) {
          setImportWarning('')
          if (count > 0) setImported(true)
        }
      } catch {
        if (current()) setImportWarning(importWarningMessage)
      }
      if (!current()) return
      const result = await api.get('/cobros', { accountId: userId, signal })
      if (!Array.isArray(result)) throw new Error('Invalid receivables response')
      if (current()) {
        setRecords(result)
        setLoadError('')
      }
    } catch {
      if (current()) setLoadError(loadErrorMessage)
    } finally {
      if (current()) {
        loadInFlight.current = null
        setLoading(false)
      }
    }
  }, [userId])

  useEffect(() => {
    const controller = new AbortController()
    refreshController.current = controller
    function refreshVisible() {
      if (document.visibilityState === 'visible' && !dialog.current?.open) void refresh(controller.signal)
    }
    queueMicrotask(() => void refresh(controller.signal))
    window.addEventListener('focus', refreshVisible)
    document.addEventListener('visibilitychange', refreshVisible)
    const timer = window.setInterval(refreshVisible, 30_000)
    return () => {
      controller.abort()
      window.removeEventListener('focus', refreshVisible)
      document.removeEventListener('visibilitychange', refreshVisible)
      window.clearInterval(timer)
    }
  }, [refresh])

  useLayoutEffect(() => {
    if (!draft || dialog.current.open) return
    dialog.current.showModal()
    closeButton.current.focus({ preventScroll: true })
  }, [draft])

  useLayoutEffect(() => {
    if (confirmation) cancelConfirmation.current?.focus({ preventScroll: true })
  }, [confirmation])

  function open(item, event) {
    focusTrigger.current = event.currentTarget
    newId.current = null
    setDraft({ ...item })
    setErrors({})
    setMessage('')
    setConfirmation(null)
    setNotice('')
    setIncomeQuery('')
  }

  function onClose() {
    setDraft(null)
    const target = focusTrigger.current?.isConnected ? focusTrigger.current : addButton.current
    target?.focus({ preventScroll: true })
  }

  function changeField(name, value) {
    setDraft((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setMessage('')
  }

  async function persist(request, onSuccess, fallback) {
    if (saving.current || loadInFlight.current) return
    saving.current = true
    setBusy(true)
    setMessage('')
    try {
      const result = await request({ accountId: userId })
      if (dialog.current) onSuccess(result)
    } catch (error) {
      const fieldMessages = ['person', 'amount', 'dueDate', 'note']
        .map((field) => error.errors?.[field]?.[0]).filter(Boolean)
      const changed = error.status === 404 || error.status === 409
      setMessage(changed
        ? 'Este cobro cambió en otro dispositivo. Cierra el panel para ver su estado actual.'
        : fieldMessages[0] || fallback)
      if (changed) {
        // Read the current record without replacing the open draft.
        saving.current = false
        if (refreshController.current) void refresh(refreshController.current.signal)
      }
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  function finish(record, success, nextView = view) {
    const recordId = record?.id ?? draft.id
    setRecords((current) => record
      ? current.some((item) => item.id === recordId)
        ? current.map((item) => item.id === recordId ? record : item)
        : [record, ...current]
      : current.filter((item) => item.id !== recordId))
    setView(nextView)
    setNotice(success)
    if (nextView !== view || confirmation) focusTrigger.current = addButton.current
    dialog.current.close()
  }

  function submit(event) {
    event.preventDefault()
    if (saving.current || loading) return
    const person = draft.person.trim()
    const amount = moneyAmount(draft.amount)
    const fieldErrors = {}
    if (!person) fieldErrors.person = 'Escribe un nombre.'
    if (!amount) fieldErrors.amount = 'Escribe un monto mayor que cero.'
    if (draft.dueDate && !isReceivableDate(draft.dueDate)) fieldErrors.dueDate = 'Elige una fecha válida entre 2000 y 2100.'
    const firstError = Object.keys(fieldErrors)[0]
    if (firstError) {
      setErrors(fieldErrors)
      event.currentTarget.elements.namedItem(firstError)?.focus()
      return
    }

    const details = { dueDate: draft.dueDate, note: draft.note.trim() }
    const values = linked ? details : { ...details, person, amount }
    if (!editing) newId.current ??= newReceivableId()
    void persist(
      (options) => editing
        ? api.put(recordPath(draft.id), values, options)
        : api.post('/cobros', { id: newId.current, ...values }, options),
      (record) => finish(record, editing ? 'Cobro actualizado.' : 'Cobro registrado en tu cuenta.', record.collectedDate ? 'collected' : 'pending'),
      'No pudimos guardar el cobro. Inténtalo de nuevo.',
    )
  }

  function toggleCollected() {
    const path = `${recordPath(draft.id)}/recibido`
    if (draft.collectedDate) {
      void persist(
        (options) => api.delete(path, options),
        (record) => finish(record, linked ? 'Ingreso eliminado y cobro devuelto a pendientes.' : 'Cobro devuelto a pendientes.', 'pending'),
        'No pudimos devolver el cobro a pendientes. Inténtalo de nuevo.',
      )
      return
    }
    void persist(
      (options) => api.put(path, undefined, options),
      (record) => {
        if (!isReceivableDate(record.collectedDate)) throw new Error('Missing collection date')
        finish(record, record.incomeId
          ? `Registramos ${formatCurrency(record.amount)} como ingreso del ${formatDate(record.collectedDate)}.`
          : 'Este cobro ya estaba marcado como cobrado.', 'collected')
        if (record.incomeId) {
          const [year, month] = record.collectedDate.split('-')
          setIncomeQuery(`anio=${year}&mes=${Number(month)}`)
        }
      },
      'No pudimos confirmar el cobro. Inténtalo de nuevo; el ingreso no se duplicará.',
    )
  }

  function remove() {
    void persist(
      (options) => api.delete(recordPath(draft.id), options),
      () => finish(null, 'Cobro eliminado de tu lista.'),
      'No pudimos eliminar el cobro. Inténtalo de nuevo.',
    )
  }

  function cancelAction() {
    setConfirmation(null)
    setMessage('')
    closeButton.current?.focus({ preventScroll: true })
  }

  return (
    <div className="activity-page saldo-receivables-page mx-auto w-full max-w-3xl">
      <Link to={`/?${query}`} className="activity-back">
        <ArrowLeft size={17} aria-hidden="true" /> Volver a Inicio
      </Link>
      <ActivityHeading title="Por cobrar" description="Lleva la cuenta de los pagos que esperas recibir.">
        <Button ref={addButton} className="saldo-receivables-add" disabled={records === null || loading} onClick={(event) => open(blankReceivable, event)}>
          <Plus size={18} aria-hidden="true" /> Nuevo cobro
        </Button>
      </ActivityHeading>

      {records === null && loading && <p className="saldo-receivables-storage" role="status">Cargando tus cobros…</p>}
      {(loadError || importWarning) && (
        <div className="grid justify-items-start gap-2">
          <FormMessage>{loadError || importWarning}</FormMessage>
          <Button variant="secondary" disabled={loading} onClick={() => void refresh(refreshController.current.signal)}>
            {loading ? 'Consultando…' : 'Reintentar'}
          </Button>
        </div>
      )}
      {imported && !importWarning && <p className="saldo-receivables-notice" role="status">Importación de cobros completada.</p>}
      {records !== null && (
        <>
          <section className="saldo-receivables-total" aria-labelledby={`${id}-total`}>
            <div>
              <h2 id={`${id}-total`}>Total pendiente</h2>
              <p>{formatCurrency(pendingTotal)}</p>
            </div>
            <HandCoins size={26} strokeWidth={1.6} aria-hidden="true" />
          </section>
          <div className="saldo-receivables-list">
            <div className="saldo-receivables-filters" role="group" aria-label="Estado del cobro">
              <button type="button" aria-pressed={view === 'pending'} onClick={() => setView('pending')}>
                Pendientes <span>{pending.length}</span>
              </button>
              <button type="button" aria-pressed={view === 'collected'} onClick={() => setView('collected')}>
                Cobrados <span>{collected.length}</span>
              </button>
            </div>
            <p className="saldo-receivables-notice" role="status">
              {notice}
              {incomeQuery && <> <Link to={`/?${incomeQuery}`} className="underline underline-offset-4">Ver saldo del mes</Link></>}
            </p>
            {visible.length > 0 ? (
              <ul className="saldo-receivables-cards" aria-label={view === 'pending' ? 'Cobros pendientes' : 'Cobros cobrados'}>
                {visible.map((item) => <ReceivableCard key={item.id} item={item} today={today} onEdit={(event) => open(item, event)} />)}
              </ul>
            ) : (
              <div className="saldo-receivables-empty">
                <HandCoins size={24} strokeWidth={1.7} aria-hidden="true" />
                <h2>{view === 'pending' ? 'Sin cobros pendientes' : 'Aún no hay cobros marcados'}</h2>
                <p>{view === 'pending' ? 'Agrega un cobro para saber quién te debe y cuánto.' : 'Cuando recibas un pago, marca su registro como cobrado.'}</p>
              </div>
            )}
            <p className="saldo-receivables-storage">Tus cobros pendientes y cobrados se guardan en tu cuenta. Al marcar uno como cobrado, Saldo registra el ingreso de hoy.</p>
          </div>
        </>
      )}

      <dialog
        ref={dialog}
        className="saldo-transaction-sheet saldo-receivables-dialog"
        aria-labelledby={`${id}-title`}
        onClose={onClose}
        onCancel={(event) => {
          if (saving.current) {
            event.preventDefault()
            return
          }
          if (!confirmation) return
          event.preventDefault()
          cancelAction()
        }}
      >
        {draft && (
          <div className="saldo-transaction-sheet-content" aria-busy={busy}>
            <div className="saldo-transaction-sheet-header">
              <h2 id={`${id}-title`}>{confirmation === 'reopen' ? '¿Volver a pendientes?' : confirmation === 'remove' ? '¿Eliminar este cobro?' : editing ? 'Editar cobro' : 'Nuevo cobro'}</h2>
              <button type="button" ref={closeButton} className="saldo-transaction-sheet-close" aria-label="Cerrar" disabled={busy} onClick={() => dialog.current.close()}>
                <X size={21} aria-hidden="true" />
              </button>
            </div>
            {confirmation ? (
              <>
                {confirmation === 'reopen' ? (
                  <p className="saldo-receivables-confirm">El cobro volverá a pendientes. Si tiene un ingreso vinculado, también se eliminará de tus movimientos.</p>
                ) : (
                  <>
                    <p className="saldo-receivables-confirm">Eliminarás el registro de <strong>{draft.person}</strong> por <strong>{formatCurrency(draft.amount)}</strong>.</p>
                    {linked && <p className="saldo-receivables-confirm">El ingreso seguirá en tus movimientos.</p>}
                  </>
                )}
                <FormMessage>{message}</FormMessage>
                <div className="saldo-receivables-actions">
                  <Button ref={cancelConfirmation} variant="secondary" disabled={busy} onClick={cancelAction}>Cancelar</Button>
                  <Button variant="danger" disabled={busy || loading} onClick={confirmation === 'reopen' ? toggleCollected : remove}>
                    {busy ? 'Actualizando…' : confirmation === 'reopen' ? 'Sí, devolver' : 'Eliminar cobro'}
                  </Button>
                </div>
              </>
            ) : (
              <form className="saldo-receivables-form" onSubmit={submit}>
                <FormField className="activity-form-field" id={`${id}-person`} label="Nombre" name="person" value={draft.person} maxLength={100} onChange={(event) => changeField('person', event.target.value)} error={errors.person} disabled={busy} readOnly={linked} required />
                <MoneyField className="activity-form-field" id={`${id}-amount`} label="Monto (Q)" name="amount" value={draft.amount} onValueChange={(value) => changeField('amount', value)} error={errors.amount} disabled={busy || linked} required />
                <FormField className="activity-form-field" id={`${id}-date`} label="Fecha acordada (opcional)" name="dueDate" type="date" min="2000-01-01" max="2100-12-31" value={draft.dueDate} onChange={(event) => changeField('dueDate', event.target.value)} error={errors.dueDate} disabled={busy} />
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor={`${id}-note`} className="activity-form-label">Nota (opcional)</label>
                  <textarea className="activity-form-control" id={`${id}-note`} rows={2} maxLength={500} value={draft.note} onChange={(event) => changeField('note', event.target.value)} disabled={busy} />
                </div>
                <FormMessage>{message}</FormMessage>
                <div className="saldo-receivables-actions">
                  <Button variant="secondary" disabled={busy} onClick={() => dialog.current.close()}>Cancelar</Button>
                  <Button type="submit" disabled={busy || loading}>Guardar cobro</Button>
                </div>
                {editing && (
                  <>
                    <div className="saldo-receivables-secondary-actions">
                      <Button variant="secondary" disabled={busy || loading} onClick={draft.collectedDate ? () => { setMessage(''); setConfirmation('reopen') } : toggleCollected}>
                        {busy ? 'Registrando…' : draft.collectedDate ? 'Volver a pendientes' : 'Marcar como cobrado'}
                      </Button>
                      <Button variant="ghost" className="saldo-receivables-remove" disabled={busy} onClick={() => { setMessage(''); setConfirmation('remove') }}>
                        Eliminar
                      </Button>
                    </div>
                    {(!draft.collectedDate || linked) && <p className="saldo-receivables-storage">
                      {linked
                        ? 'Si lo devuelves a pendientes, se eliminará el ingreso vinculado.'
                        : 'Se registrará el monto guardado como ingreso de hoy.'}
                    </p>}
                  </>
                )}
              </form>
            )}
          </div>
        )}
      </dialog>
    </div>
  )
}
