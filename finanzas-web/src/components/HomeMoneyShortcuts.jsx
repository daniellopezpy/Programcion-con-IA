import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Banknote, ReceiptText, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'
import { api } from '@/lib/api'
import { categoryLabel } from '@/lib/category-label'
import { moneyAmount } from '@/lib/money-input'
import { formatCurrency, formatDate, localDateString } from '@/lib/utils'
import './home-money-shortcuts.css'

function ShortcutDialog({ dialogRef, headingId, descriptionId, title, description, busy = false, children }) {
  return (
    <dialog
      className="saldo-home-money-dialog"
      ref={dialogRef}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => { if (busy) event.preventDefault() }}
    >
      <header>
        <h2 id={headingId}>{title}</h2>
        <button type="button" aria-label="Cerrar" disabled={busy} onClick={() => dialogRef.current.close()}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <p id={descriptionId}>{description}</p>
      {children}
    </dialog>
  )
}

export function QuickExpenseShortcut({ onSaved }) {
  const id = useId()
  const dialogRef = useRef(null)
  const pending = useRef(false)
  const requestRef = useRef(null)
  const { user } = useAuth()
  const { query } = useDashboardPeriod()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(localDateString)
  const [catalog, setCatalog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [amountError, setAmountError] = useState('')
  const [saveError, setSaveError] = useState('')

  async function loadPreference() {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setCatalog({ status: 'loading' })
    try {
      const data = await api.get('/preferencias/gasto-hormiga', {
        accountId: user?.id,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (data?.categoria_efectiva?.id) {
        setCatalog({
          status: 'ready',
          id: data.categoria_efectiva.id,
          nombre: categoryLabel(data.categoria_efectiva.nombre),
        })
      } else {
        setCatalog({ status: 'missing' })
      }
    } catch (error) {
      if (controller.signal.aborted || error.name === 'AbortError') return
      setCatalog({ status: 'error' })
    }
  }

  useEffect(() => {
    return () => {
      requestRef.current?.abort()
    }
  }, [])

  function open() {
    setAmount('')
    setDate(localDateString())
    setAmountError('')
    setSaveError('')
    dialogRef.current.showModal()
    dialogRef.current.querySelector('input')?.focus()
    loadPreference()
  }

  async function save(event) {
    event.preventDefault()
    if (pending.current || catalog?.status !== 'ready' || !catalog?.id) return

    const monto = moneyAmount(amount)
    if (monto === null) {
      setAmountError('Ingresa un monto mayor que Q 0.00.')
      return
    }

    pending.current = true
    setBusy(true)
    setSaveError('')
    let expense
    try {
      expense = await api.post('/egresos', {
        monto,
        fecha: date,
        descripcion: 'Gasto hormiga',
        categoria_id: catalog.id,
      }, { accountId: user?.id })
    } catch (error) {
      if (error.errors?.monto?.[0]) setAmountError(error.errors.monto[0])
      else if (error.errors?.categoria_id) setCatalog({ status: 'missing' })
      else if (error.errors?.fecha?.[0]) setSaveError(error.errors.fecha[0])
      else setSaveError('No pudimos guardar el gasto. Revisa tu conexión y vuelve a intentar.')
      return
    } finally {
      pending.current = false
      setBusy(false)
    }

    dialogRef.current?.close()
    onSaved?.(expense)
  }

  const catalogStatus = catalog?.status

  return (
    <>
      <button type="button" className="saldo-shortcut" aria-haspopup="dialog" onClick={open}>
        <span className="saldo-shortcut-icon"><ReceiptText size={20} strokeWidth={1.8} aria-hidden="true" /></span>
        <span className="saldo-shortcut-label">Gasto hormiga</span>
      </button>
      <ShortcutDialog
        dialogRef={dialogRef}
        headingId={`${id}-title`}
        descriptionId={`${id}-description`}
        title="Gasto hormiga"
        description="Anota un gasto pequeño con solo el monto."
        busy={busy}
      >
        <form onSubmit={save} aria-busy={busy}>
          <MoneyField
            id={`${id}-amount`}
            name="monto"
            label="Monto del gasto (Q)"
            value={amount}
            onValueChange={(value) => { setAmount(value); setAmountError(''); setSaveError('') }}
            error={amountError}
            placeholder="0.00"
            required
            disabled={busy}
          />
          {catalogStatus === 'ready' && (
            <p className="saldo-home-money-note">Se guardará en <strong>{catalog.nombre}</strong> con fecha de hoy, {formatDate(date)}.</p>
          )}
          {catalogStatus === 'loading' && <p role="status" className="saldo-home-money-note">Buscando la categoría…</p>}
          {(catalogStatus === 'error' || catalogStatus === 'missing') && (
            <div className="saldo-home-money-retry">
              <p role="alert">{catalogStatus === 'missing' ? 'No encontramos la categoría para el gasto hormiga.' : 'No pudimos consultar las categorías.'}</p>
              <Button variant="secondary" size="sm" onClick={loadPreference}>Volver a intentar</Button>
              <Link to={`/egresos/nuevo?${query}`} onClick={() => dialogRef.current.close()}>Abrir el formulario de egresos</Link>
            </div>
          )}
          {saveError && <p role="alert" className="saldo-home-money-error">{saveError}</p>}
          <Button type="submit" disabled={busy || catalogStatus !== 'ready' || !catalog?.id}>{busy ? 'Guardando…' : 'Guardar gasto'}</Button>
        </form>
      </ShortcutDialog>
    </>
  )
}

function readCash(key) {
  try {
    return moneyAmount(localStorage.getItem(key), { allowZero: true })
  } catch {
    return null
  }
}

export function CashOnHandShortcut() {
  const id = useId()
  const dialogRef = useRef(null)
  const { user } = useAuth()
  const key = `saldo.cashOnHand:${user.id}`
  const [savedAmount, setSavedAmount] = useState(() => readCash(key))
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const request = useRef(null)
  const pending = useRef(false)
  const loadCash = useCallback(async () => {
    if (pending.current) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const options = { accountId: user.id, signal: controller.signal }
    const local = readCash(key)
    const result = local === null
      ? await api.get('/efectivo', options)
      : await api.put('/efectivo', { monto: local, importar: true }, options)
    if (controller.signal.aborted) return
    if (local !== null) {
      try { localStorage.removeItem(key) } catch { /* The import can be retried safely. */ }
    }
    setSavedAmount(result.monto)
    return result
  }, [key, user.id])

  useEffect(() => {
    function refresh() {
      if (!dialogRef.current?.open) loadCash().catch(() => {})
    }
    refresh()
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      request.current?.abort()
      window.removeEventListener('focus', refresh)
      window.clearInterval(timer)
    }
  }, [loadCash])

  async function open() {
    setAmount(savedAmount ?? '')
    setError('')
    dialogRef.current.showModal()
    dialogRef.current.querySelector('input')?.focus()
    try {
      const field = dialogRef.current.querySelector('input')
      const draft = field?.value
      const result = await loadCash()
      if (result && dialogRef.current?.open && field?.value === draft) setAmount(result.monto ?? '')
    } catch (requestError) {
      if (requestError.name !== 'AbortError' && dialogRef.current?.open) setError('No pudimos consultar tu efectivo. Puedes volver a abrirlo para reintentar.')
    }
  }

  async function save(event) {
    event.preventDefault()
    if (pending.current) return
    const cash = moneyAmount(amount, { allowZero: true })
    if (cash === null) {
      setError('Ingresa un monto. Si no llevas efectivo, escribe 0.')
      return
    }
    pending.current = true
    request.current?.abort()
    setBusy(true)
    try {
      const result = await api.put('/efectivo', { monto: cash }, { accountId: user.id })
      try { localStorage.removeItem(key) } catch { /* The account value takes precedence on import. */ }
      setSavedAmount(result.monto)
      dialogRef.current?.close()
    } catch {
      setError('No pudimos guardar tu efectivo. Inténtalo de nuevo.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className="saldo-shortcut" aria-haspopup="dialog" onClick={open}>
        <span className="saldo-shortcut-icon"><Banknote size={20} strokeWidth={1.8} aria-hidden="true" /></span>
        <span className="saldo-shortcut-label">Efectivo{savedAmount !== null && <small>{formatCurrency(savedAmount)}</small>}</span>
      </button>
      <ShortcutDialog
        dialogRef={dialogRef}
        headingId={`${id}-title`}
        descriptionId={`${id}-description`}
        title="Efectivo que llevo"
        description="Anota cuánto tienes en mano. Puedes consultar este monto desde tu cuenta en cualquier dispositivo."
        busy={busy}
      >
        <form onSubmit={save}>
          <MoneyField
            id={`${id}-amount`}
            name="efectivo"
            label="Efectivo actual (Q)"
            value={amount}
            onValueChange={(value) => { setAmount(value); setError('') }}
            error={error}
            placeholder="0.00"
            disabled={busy}
            required
          />
          <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar efectivo'}</Button>
        </form>
      </ShortcutDialog>
    </>
  )
}
