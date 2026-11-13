import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FormField, FormMessage } from '@/components/FormField'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'
import { api } from '@/lib/api'
import { moneyAmount } from '@/lib/money-input'
import { getSaldoPreferences } from '@/lib/saldo-preferences'
import { formatCurrency, formatDate } from '@/lib/utils'
import './payday-budget.css'

const endpoint = '/dashboard/presupuesto-pago'
const firstDate = '2000-01-01'
const lastDate = '2100-12-31'

function nextDate(date) {
  const day = new Date(`${date}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() + 1)
  return day.toISOString().slice(0, 10)
}

function PaydayResult({ budget, today, onEdit, onRenew }) {
  const { estado, restante, excedido, limite, gastado, fecha_inicio, fecha_pago, terminado } = budget
  const overLimit = estado === 'excedido'
  const noExpenses = estado === 'sin_gastos'
  const spentAmount = formatCurrency(gastado)
  const limitAmount = formatCurrency(limite)
  const [year, month] = today.split('-')
  const expenseQuery = new URLSearchParams({ anio: year, mes: String(Number(month)) })

  return (
    <div className="saldo-payday-result" data-over={overLimit}>
      <div className="saldo-payday-result-text" role="status">
        <p className="saldo-payday-amount">
          {overLimit && <>Te pasaste <strong>{formatCurrency(excedido)}</strong></>}
          {estado === 'al_limite' && 'Llegaste a tu límite'}
          {(estado === 'disponible' || noExpenses) && (
            <>{terminado ? 'Te quedaron' : 'Te quedan'} <strong>{formatCurrency(restante)}</strong></>
          )}
        </p>
        <p className="saldo-payday-date">
          {terminado ? 'Pago previsto' : 'Próximo pago'}{' '}
          <time dateTime={fecha_pago}>{formatDate(fecha_pago)}</time>
        </p>
      </div>
      <div className="saldo-payday-usage">
        <meter
          className="saldo-payday-meter"
          min={0}
          max={Number(limite)}
          value={Math.min(Number(gastado), Number(limite))}
          aria-label="Uso del límite de gasto"
          aria-valuetext={`${spentAmount} gastados de un límite de ${limitAmount}`}
        />
        <dl className="saldo-payday-totals">
          <div><dt>Gastado</dt><dd>{spentAmount}</dd></div>
          <div><dt>Límite</dt><dd>{limitAmount}</dd></div>
        </dl>
      </div>
      <div className="saldo-payday-context">
        <p className="saldo-payday-date">Desde <time dateTime={fecha_inicio}>{formatDate(fecha_inicio)}</time></p>
        {terminado && <p className="saldo-payday-note">Este ciclo terminó</p>}
      </div>
      {noExpenses && <p className="saldo-payday-note">Aún no registraste gastos en este ciclo.</p>}
      {terminado ? (
        onRenew && <div className="saldo-payday-actions"><Button onClick={onRenew}>Elegir próxima fecha</Button></div>
      ) : (
        <div className="saldo-payday-actions">
          <Button variant="secondary" onClick={onEdit}>Editar límite y fechas</Button>
          {noExpenses && (
            <Link className="saldo-payday-expense-link" to={`/egresos/nuevo?${expenseQuery}`}>Registrar un egreso</Link>
          )}
        </div>
      )}
    </div>
  )
}

function PaydayBudgetForm({ mode, budget, today, suggestedPayday, onSave, onCancel }) {
  const fieldId = useId()
  const titleRef = useRef(null)
  const [showStart, setShowStart] = useState(false)
  const [values, setValues] = useState(() => ({
    limite: budget?.limite ?? '',
    fecha_inicio: mode === 'edit' ? budget.fecha_inicio : today,
    fecha_pago: mode === 'edit' ? budget.fecha_pago : suggestedPayday,
  }))
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setSaveError('')
  }

  async function save(event) {
    event.preventDefault()
    if (saving) return

    const limite = moneyAmount(values.limite)
    const { fecha_inicio, fecha_pago } = values
    const fieldErrors = {}
    if (!limite) {
      fieldErrors.limite = 'Escribe un monto mayor que Q0 con hasta dos decimales.'
    }
    if (!fecha_inicio || fecha_inicio < firstDate || fecha_inicio > today) {
      fieldErrors.fecha_inicio = 'Elige hoy o una fecha anterior, desde el año 2000.'
    }
    if (!fecha_pago || fecha_pago <= today || fecha_pago <= fecha_inicio) {
      fieldErrors.fecha_pago = 'Elige una fecha posterior a hoy y al inicio del ciclo.'
    } else if (fecha_pago > lastDate) {
      fieldErrors.fecha_pago = 'Elige una fecha hasta el 31 de diciembre de 2100.'
    }
    setSaveError('')
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors)
      if (fieldErrors.fecha_inicio) setShowStart(true)
      return
    }

    setSaving(true)
    setErrors({})
    try {
      const result = await api.put(endpoint, { limite, fecha_inicio, fecha_pago })
      if (!result?.presupuesto || !result.hoy) throw new Error('Respuesta de presupuesto inválida.')
      onSave(result)
    } catch (error) {
      const validation = error.errors ?? {}
      const known = {}
      for (const field of ['limite', 'fecha_inicio', 'fecha_pago']) {
        if (validation[field]?.length) known[field] = validation[field][0]
      }
      setErrors(known)
      if (known.fecha_inicio) setShowStart(true)
      if (!Object.keys(known).length) setSaveError('No pudimos guardar tu límite. Vuelve a intentarlo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="saldo-payday-form" onSubmit={save} aria-busy={saving}>
      <h3 ref={titleRef} tabIndex={-1}>
        {mode === 'renew' ? 'Nuevo ciclo' : mode === 'edit' ? 'Editar límite y fechas' : 'Poner un límite'}
      </h3>
      <div className="saldo-payday-fields">
        <MoneyField
          id={`${fieldId}-limite`}
          label="Límite de gasto (Q)"
          name="limite"
          placeholder="Ej. 600.00"
          value={values.limite}
          onChange={updateField}
          error={errors.limite}
          disabled={saving}
          required
        />
        <FormField
          id={`${fieldId}-pago`}
          label="Fecha del próximo pago"
          name="fecha_pago"
          type="date"
          min={nextDate(today)}
          max={lastDate}
          hint="El ciclo cuenta gastos hasta el día anterior al pago."
          value={values.fecha_pago}
          onChange={updateField}
          error={errors.fecha_pago}
          disabled={saving}
          required
        />
      </div>
      <div className="saldo-payday-start">
        <button
          type="button"
          aria-expanded={showStart}
          aria-controls={`${fieldId}-start-options`}
          onClick={() => setShowStart((open) => !open)}
        >
          <span>Contar gastos desde <strong>{values.fecha_inicio === today ? 'hoy' : formatDate(values.fecha_inicio)}</strong></span>
          <span className="saldo-payday-start-edit">Cambiar <ChevronDown size={16} aria-hidden="true" /></span>
        </button>
        <div id={`${fieldId}-start-options`} hidden={!showStart}>
          <FormField
            id={`${fieldId}-inicio`}
            label="Fecha de inicio"
            name="fecha_inicio"
            type="date"
            min={firstDate}
            max={today}
            value={values.fecha_inicio}
            onChange={updateField}
            error={errors.fecha_inicio}
            disabled={saving || !showStart}
            required
          />
          {!errors.fecha_inicio && <p className="saldo-payday-note">Cambia la fecha para incluir gastos que ya registraste.</p>}
        </div>
      </div>
      <FormMessage>{saveError}</FormMessage>
      <div className="saldo-payday-actions">
        <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar límite'}</Button>
        <Button variant="ghost" disabled={saving} onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export function PaydayBudget() {
  const { user } = useAuth()
  const heading = useRef(null)
  const [request, setRequest] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  const [editor, setEditor] = useState(null)
  const budget = request.data?.presupuesto
  const savedPayday = getSaldoPreferences(user.id).payday
  const suggestedPayday = request.data && savedPayday > request.data.hoy ? savedPayday : ''

  useEffect(() => {
    let current = true
    api.get(endpoint).then(
      (data) => {
        if (!current) return
        setRequest(data?.hoy && Object.hasOwn(data, 'presupuesto') ? { data } : { error: true })
      },
      () => { if (current) setRequest({ error: true }) },
    )
    return () => { current = false }
  }, [attempt])

  function retry() {
    setRequest({ loading: true })
    setAttempt((count) => count + 1)
    heading.current?.focus({ preventScroll: true })
  }

  function closeEditor() {
    setEditor(null)
    heading.current?.focus()
  }

  function applySaved(data) {
    setRequest({ data })
    closeEditor()
  }

  return (
    <section className="saldo-payday" aria-labelledby="saldo-payday-title">
      <h2 id="saldo-payday-title" ref={heading} tabIndex={-1}>Hasta el próximo pago</h2>
      {request.loading && <p className="saldo-payday-note" role="status">Cargando tu presupuesto…</p>}
      {request.error && (
        <div className="saldo-payday-empty">
          <p role="alert">No pudimos cargar tu presupuesto.</p>
          <Button variant="secondary" onClick={retry}>Reintentar</Button>
        </div>
      )}
      {request.data && !budget && !editor && (
        <div className="saldo-payday-empty">
          <p>Define cuánto quieres gastar hasta que te paguen.</p>
          <Button onClick={() => setEditor('create')}>Poner un límite</Button>
        </div>
      )}
      {budget && (!editor || editor === 'renew') && (
        <PaydayResult
          budget={budget}
          today={request.data.hoy}
          onEdit={() => setEditor('edit')}
          onRenew={editor ? undefined : () => setEditor('renew')}
        />
      )}
      {editor && (
        <PaydayBudgetForm
          mode={editor}
          budget={budget}
          today={request.data.hoy}
          suggestedPayday={suggestedPayday}
          onSave={applySaved}
          onCancel={closeEditor}
        />
      )}
    </section>
  )
}
