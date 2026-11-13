import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, CopyPlus, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import { FormField, FormMessage } from '@/components/FormField'
import { HomeTransactionEditor } from '@/components/HomeTransactionEditor'
import { Button } from '@/components/ui/button'
import { MoneyField } from '@/components/MoneyField'
import { useAuth } from '@/context/useAuth'
import { api } from '@/lib/api'
import { getExpenseCard, setCardExpense } from '@/lib/card-expenses'
import { categoryLabel } from '@/lib/category-label'
import { getSaldoPreferences } from '@/lib/saldo-preferences'
import { dateInGuatemala } from '@/lib/period-recap'
import { moneyAmount } from '@/lib/money-input'
import { formatCurrency, formatDate, newOperationId } from '@/lib/utils'
import './home-transaction-sheet.css'

export function HomeTransactionSheet({ transaction, onClose, onMutation }) {
  const dialog = useRef(null)
  const pressedBackdrop = useRef(false)
  const pending = useRef(false)
  const modeFocus = useRef(null)
  const headingId = useId()
  const confirmationId = useId()
  const [mode, setMode] = useState('detail')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const { user } = useAuth()

  useLayoutEffect(() => {
    if (transaction && !dialog.current.open) dialog.current.showModal()
  }, [transaction])

  useLayoutEffect(() => {
    if (!dialog.current.open) return
    dialog.current.scrollTop = 0
    modeFocus.current?.focus({ preventScroll: true })
  }, [mode])

  const item = transaction?.item
  const isExpense = transaction?.type === 'egreso'
  const Icon = isExpense ? ArrowUpRight : ArrowDownLeft
  const description = isExpense ? item?.descripcion : item?.fuente
  const date = item?.fecha?.slice(0, 10)
  const amount = item && (isExpense ? formatCurrency(-Number(item.monto)) : `+${formatCurrency(item.monto)}`)
  const cardId = isExpense ? getExpenseCard(user?.id, item?.id) : ''
  const card = cardId && (getSaldoPreferences(user?.id).cards.find(({ id }) => id === cardId)?.label || 'Tarjeta')
  const collection = isExpense ? '/egresos' : '/ingresos'
  const endpoint = `${collection}/${item?.id}`
  const detailMode = mode === 'detail'
  const repeating = mode === 'repeat'

  function changeMode(nextMode) {
    setMode(nextMode)
    setError(null)
    setSaved(false)
  }

  function dismiss() {
    if (pending.current) return
    if (detailMode) dialog.current.close()
    else changeMode('detail')
  }

  function handleClose() {
    changeMode('detail')
    onClose()
  }

  async function save(payload) {
    if (pending.current || (mode !== 'edit' && !repeating)) return
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      const options = { accountId: user.id }
      const movement = repeating
        ? await api.post(collection, payload, options)
        : await api.put(endpoint, payload, options)
      const visible = onMutation({ type: transaction.type, item: movement }, { repeated: repeating })
      if (!repeating && visible) {
        changeMode('detail')
        setSaved(true)
      } else {
        dialog.current?.close()
      }
    } catch (requestError) {
      setError(requestError)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  async function remove() {
    if (pending.current || mode !== 'delete') return
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      let removed = 'deleted'
      try {
        await api.delete(endpoint)
      } catch (requestError) {
        if (requestError.status !== 404) throw requestError
        removed = 'missing'
      }
      if (isExpense) setCardExpense(user.id, item.id, false)
      onMutation(null, { removed })
      dialog.current?.close()
    } catch (requestError) {
      setError(requestError)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  async function refund(payload) {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      const ingreso = await api.post(`${endpoint}/devoluciones`, payload, { accountId: user.id })
      onMutation({ type: 'ingreso', item: ingreso }, { refunded: true })
      dialog.current?.close()
    } catch (requestError) {
      setError(requestError)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="saldo-transaction-sheet"
      aria-labelledby={headingId}
      aria-describedby={mode === 'delete' ? confirmationId : undefined}
      onClose={handleClose}
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
      onPointerDown={(event) => { pressedBackdrop.current = event.target === event.currentTarget }}
      onPointerCancel={() => { pressedBackdrop.current = false }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) dismiss()
        pressedBackdrop.current = false
      }}
    >
      {item && (
        <div className="saldo-transaction-sheet-content">
          <header className="saldo-transaction-sheet-header">
            <span className="saldo-transaction-sheet-kind" data-expense={isExpense}>
              <Icon size={17} aria-hidden="true" /> {isExpense ? 'Gasto' : item.egreso_devolucion_id ? 'Devolución' : 'Ingreso'}
            </span>
            <button type="button" className="saldo-transaction-sheet-close" aria-label={detailMode ? 'Cerrar detalle' : 'Volver al detalle'} autoFocus disabled={busy} onClick={dismiss}>
              {detailMode ? <X size={22} aria-hidden="true" /> : <ArrowLeft size={22} aria-hidden="true" />}
            </button>
          </header>
          {detailMode && (
            <>
              <h2 id={headingId} ref={modeFocus} tabIndex={-1}>{description || (isExpense ? 'Detalle del gasto' : 'Detalle del ingreso')}</h2>
              <p className="saldo-transaction-sheet-amount" data-expense={isExpense}>{amount}</p>
              <dl className="saldo-transaction-sheet-facts">
                <div><dt>Fecha</dt><dd><time dateTime={date}>{formatDate(date)}</time></dd></div>
                {item.categoria?.nombre && <div><dt>Categoría</dt><dd>{categoryLabel(item.categoria.nombre)}</dd></div>}
                {item.subcategoria?.nombre && <div><dt>Subcategoría</dt><dd>{categoryLabel(item.subcategoria.nombre)}</dd></div>}
                {card && <div><dt>Pago con tarjeta</dt><dd>{card}</dd></div>}
              </dl>
              {item.notas?.trim() && <div className="saldo-transaction-sheet-notes"><h3>Notas</h3><p>{item.notas}</p></div>}
              {saved && <p className="saldo-transaction-notice" role="status">Cambios guardados.</p>}
              <div className="saldo-transaction-actions">
                <Button className="saldo-transaction-repeat" onClick={() => changeMode('repeat')}><CopyPlus size={17} aria-hidden="true" /> Repetir</Button>
                {isExpense && <Button variant="secondary" className="saldo-transaction-repeat" onClick={() => changeMode('refund')}><RotateCcw size={17} aria-hidden="true" /> Registrar devolución</Button>}
                <Button variant="secondary" onClick={() => changeMode('edit')}><Pencil size={17} aria-hidden="true" /> Editar</Button>
                <Button variant="ghost" className="saldo-transaction-delete" onClick={() => changeMode('delete')}><Trash2 size={17} aria-hidden="true" /> Eliminar</Button>
              </div>
            </>
          )}
          {mode === 'refund' && (
            <>
              <h2 id={headingId} ref={modeFocus} tabIndex={-1}>Registrar devolución</h2>
              <RefundForm endpoint={endpoint} purchaseDate={date} accountId={user.id} busy={busy} error={error} onSave={refund} onCancel={dismiss} />
            </>
          )}
          {(mode === 'edit' || repeating) && (
            <>
              <h2 id={headingId} ref={modeFocus} tabIndex={-1}>{`${repeating ? 'Repetir' : 'Editar'} ${isExpense ? 'gasto' : 'ingreso'}`}</h2>
              {repeating && <p className="saldo-transaction-confirm">Ajusta el monto o la fecha antes de guardar el nuevo movimiento.</p>}
              <HomeTransactionEditor transaction={transaction} repeating={repeating} busy={busy} error={error} onSave={save} onCancel={dismiss} />
            </>
          )}
          {mode === 'delete' && (
            <>
              <h2 id={headingId}>{isExpense ? '¿Eliminar este gasto?' : '¿Eliminar este ingreso?'}</h2>
              <p id={confirmationId} className="saldo-transaction-confirm">Vas a eliminar <strong>{description}</strong> por <strong>{formatCurrency(item.monto)}</strong>. Esta acción es permanente.</p>
              <FormMessage>{error?.message}</FormMessage>
              <div className="saldo-transaction-actions" aria-busy={busy}>
                <Button variant="secondary" ref={modeFocus} disabled={busy} onClick={dismiss}>Cancelar</Button>
                <Button variant="danger" disabled={busy} onClick={remove}>
                  {busy ? 'Eliminando…' : isExpense ? 'Eliminar gasto' : 'Eliminar ingreso'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}

function RefundForm({ endpoint, purchaseDate, accountId, busy, error, onSave, onCancel }) {
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [partial, setPartial] = useState(false)
  const [amount, setAmount] = useState('')
  const [validation, setValidation] = useState('')
  const operation = useRef(null)
  const today = dateInGuatemala()
  const available = Number(data?.restante)

  useEffect(() => {
    const controller = new AbortController()
    api.get(`${endpoint}/devoluciones`, { accountId, signal: controller.signal }).then(
      (result) => { if (!controller.signal.aborted) setData(result) },
      () => { if (!controller.signal.aborted) setLoadError('No pudimos consultar las devoluciones del gasto.') },
    )
    return () => controller.abort()
  }, [endpoint, accountId, attempt])

  function submit(event) {
    event.preventDefault()
    if (busy || !(available > 0)) return
    const monto = partial ? moneyAmount(amount) : data.restante
    if (!monto || Number(monto) > available) {
      setValidation('Escribe un monto mayor que cero que no supere el saldo por devolver.')
      return
    }
    const fecha = new FormData(event.currentTarget).get('fecha')
    const key = `${monto}:${fecha}`
    if (operation.current?.key !== key) operation.current = { key, id: newOperationId() }
    onSave({ monto, fecha, operacion: operation.current.id })
  }

  if (loadError) return <div className="grid gap-2"><FormMessage>{loadError}</FormMessage><Button variant="secondary" onClick={() => { setLoadError(''); setAttempt((value) => value + 1) }}>Reintentar</Button></div>
  if (!data) return <p role="status">Consultando devoluciones…</p>

  return (
    <div className="grid gap-3">
      <p className="saldo-transaction-confirm">Pendiente de devolver <strong>{formatCurrency(data.restante)}</strong></p>
      {data.devoluciones.length > 0 && <ul className="grid gap-1 text-sm" aria-label="Devoluciones registradas">
        {data.devoluciones.map((entry) => <li key={entry.id} className="flex flex-wrap justify-between gap-2"><time dateTime={entry.fecha.slice(0, 10)}>{formatDate(entry.fecha.slice(0, 10))}</time><strong>{formatCurrency(entry.monto)}</strong></li>)}
      </ul>}
      {available > 0 ? (
        <form className="grid gap-3" onSubmit={submit}>
          <fieldset disabled={busy} className="grid gap-3">
            <legend className="mb-2 text-sm font-semibold">Tipo de devolución</legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex min-h-11 items-center gap-2"><input type="radio" name="tipo-devolucion" checked={!partial} onChange={() => { setPartial(false); setValidation('') }} /> Total pendiente</label>
              <label className="flex min-h-11 items-center gap-2"><input type="radio" name="tipo-devolucion" checked={partial} onChange={() => { setPartial(true); setValidation('') }} /> Parcial</label>
            </div>
            {partial && <MoneyField id="refund-amount" label="Monto recibido (Q)" value={amount} onValueChange={(value) => { setAmount(value); setValidation('') }} required />}
            <FormField id="refund-date" label="Fecha en que recibiste el dinero" name="fecha" type="date" defaultValue={today} min={purchaseDate} max={today} required />
          </fieldset>
          <FormMessage>{validation || Object.values(error?.errors ?? {})[0]?.[0] || error?.message}</FormMessage>
          <div className="saldo-transaction-actions">
            <Button variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar devolución'}</Button>
          </div>
        </form>
      ) : <p>Este gasto ya se devolvió por completo.</p>}
    </div>
  )
}
