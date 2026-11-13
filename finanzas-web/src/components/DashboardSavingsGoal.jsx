import { Check, Coins, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { moneyAmount } from '@/lib/money-input'
import { formatCurrency, monthName } from '@/lib/utils'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function DashboardSavingsGoal({
  data,
  loading = false,
  error = '',
  operation = '',
  notice = '',
  period,
  onRetry,
  onSave,
  onDelete,
  onAdjust,
}) {
  const [draft, setDraft] = useState(() => data?.meta?.monto_objetivo || '')
  const [validationError, setValidationError] = useState('')
  const saving = Boolean(operation)

  const target = Number(data?.meta?.monto_objetivo || 0)
  const allocated = Number(data?.monto_apartado || 0)
  const remaining = Math.max(Math.round((target - allocated) * 100) / 100, 0)
  const progress = target ? clamp(100 * allocated / target, 0, remaining > 0 ? 99.99 : 100) : 0
  const hasGoal = Boolean(data?.meta)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Sync the form after the selected period changes.
    setDraft(data?.meta?.monto_objetivo || '')
    setValidationError('')
  }, [data?.meta?.monto_objetivo])

  function submit(event) {
    event.preventDefault()
    const amount = moneyAmount(draft)
    if (!amount) {
      setValidationError('Escribe un monto mayor que cero.')
      return
    }

    setValidationError('')
    onSave(amount)
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] p-5" role="status">
        Cargando meta de ahorro…
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] p-4 sm:p-6" aria-labelledby="savings-goal-heading">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--saldo-wash)] text-[var(--saldo-forest)]"><Coins size={19} aria-hidden="true" /></span>
          <div>
            <h2 id="savings-goal-heading" className="text-lg font-bold tracking-tight">Meta de ahorro</h2>
            <p className="text-xs text-[var(--saldo-muted)]">{monthName(period?.mes)} {period?.anio}</p>
          </div>
        </div>
        {hasGoal && <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--saldo-wash)] px-2.5 py-1 text-xs font-semibold text-[var(--saldo-forest)]"><Check size={13} aria-hidden="true" /> Meta activa</span>}
      </header>

      {error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"><p role="alert">{error}</p>{!data && <Button size="sm" variant="secondary" onClick={onRetry}><RefreshCw size={14} aria-hidden="true" /> Reintentar</Button>}</div>}
      {notice && <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--saldo-forest)]" role="status"><Check size={15} aria-hidden="true" /> {notice}</p>}

      {data && <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {hasGoal && (
          <div className="rounded-xl bg-[var(--saldo-wash)] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">Progreso <strong className="text-xl">{Math.floor(progress)}%</strong></p>
              <p className="text-sm">Meta <strong>{formatCurrency(target)}</strong></p>
            </div>
            <progress className="mt-3 h-2 w-full overflow-hidden rounded-full accent-[#32704f]" aria-label="Progreso de la meta de ahorro" max="100" value={progress} />
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[var(--saldo-muted)]">
              <span>Apartado <strong>{formatCurrency(allocated)}</strong></span>
              <span>{remaining > 0 ? `Faltan ${formatCurrency(remaining)}` : 'Meta alcanzada'}</span>
            </div>
            <AllocationForm key={data.monto_apartado} allocated={allocated} saving={saving} onAdjust={onAdjust} />
          </div>
        )}

        <form className="grid content-start gap-2.5" onSubmit={submit}>
          {!hasGoal && <p className="text-sm text-[var(--saldo-muted)]">Define cuánto quieres ahorrar este mes.</p>}
          <MoneyField
            id="savings-goal-amount"
            label="Monto objetivo (Q)"
            value={draft}
            disabled={saving}
            onValueChange={(amount) => {
              setDraft(amount)
              setValidationError('')
            }}
            placeholder="Ej. 500.00"
            error={validationError}
            required
          />
          <Button className="justify-self-start" type="submit" disabled={saving}><Save size={16} aria-hidden="true" /> {operation === 'save' ? 'Guardando…' : 'Guardar'}</Button>
          {hasGoal && <Button variant="ghost" size="sm" className="w-fit" onClick={onDelete} disabled={saving}><Trash2 size={13} aria-hidden="true" /> {operation === 'delete' ? 'Quitando…' : 'Quitar meta'}</Button>}
        </form>
      </div>}
    </section>
  )
}

function AllocationForm({ allocated, saving, onAdjust }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const value = moneyAmount(amount)
    const action = event.nativeEvent.submitter?.value === 'retirar' ? 'retirar' : 'apartar'
    if (!value || (action === 'retirar' && Number(value) > allocated)) {
      setError(!value ? 'Escribe un monto mayor que cero.' : 'El monto supera el dinero apartado.')
      return
    }
    onAdjust(action, value)
  }

  return (
    <form className="mt-4 grid gap-2.5" onSubmit={submit}>
      <MoneyField id="savings-allocation" label="Monto a apartar o retirar (Q)" value={amount}
        disabled={saving} onValueChange={(value) => { setAmount(value); setError('') }} error={error} required />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" value="apartar" disabled={saving}>Apartar dinero</Button>
        {allocated > 0 && <Button type="submit" value="retirar" variant="secondary" disabled={saving}>Retirar</Button>}
      </div>
      <p className="text-xs text-[var(--saldo-muted)]">Este registro indica cuánto reservaste. El saldo del mes sigue mostrando el total de ingresos y gastos.</p>
    </form>
  )
}
