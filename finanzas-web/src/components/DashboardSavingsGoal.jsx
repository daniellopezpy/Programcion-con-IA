import { Check, CircleHelp, RefreshCw, Save, Target, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatCurrency, monthName } from '@/lib/utils'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function DashboardSavingsGoal({
  data,
  loading = false,
  error = '',
  saving = false,
  notice = '',
  period,
  onRetry,
  onSave,
  onDelete,
}) {
  const [draft, setDraft] = useState(() => data?.meta?.monto_objetivo || '')
  const [validationError, setValidationError] = useState('')

  const target = Number(data?.meta?.monto_objetivo || 0)
  const accumulated = Number(data?.ingresos_acumulados || 0)
  const progress = clamp(Number(data?.porcentaje_progreso || 0), 0, 100)
  const remaining = Math.max(Number(data?.faltante || target - accumulated), 0)
  const hasGoal = Boolean(data?.meta)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Sync the form after the selected period changes.
    setDraft(data?.meta?.monto_objetivo || '')
    setValidationError('')
  }, [data?.meta?.monto_objetivo])

  function submit(event) {
    event.preventDefault()
    const amount = Number(draft)
    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError('Escribe un monto mayor que cero.')
      return
    }

    setValidationError('')
    onSave(draft)
  }

  if (loading) {
    return <section className="min-h-[320px] animate-pulse rounded-xl border border-white/10 bg-[#111116] p-5" aria-label="Cargando meta de ahorro"><div className="h-5 w-44 rounded bg-white/10" /><div className="mt-4 h-3 w-full rounded bg-white/10" /><div className="mt-5 h-10 w-full rounded-lg bg-white/10" /></section>
  }

  return (
    <section className="min-h-[320px] rounded-xl border border-white/10 bg-[#111116] p-5 text-white shadow-lg shadow-black/20 sm:p-6" aria-label="Meta de ahorro mensual">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#aaa8b5]"><Target size={16} className="text-[#c5ed83]" /> Meta de ahorro</div>
          <h2 className="mt-2 text-lg font-semibold text-white">Tu objetivo para {monthName(period?.mes)} {period?.anio}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#858290]">Comparamos tu meta con los ingresos acumulados del año hasta el período seleccionado.</p>
        </div>
        {hasGoal && <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#c5ed83]/15 px-2.5 py-1 text-xs font-semibold text-[#c5ed83]"><Check size={13} /> Meta activa</span>}
      </div>

      {error ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ff7d8f]/30 bg-[#ff7d8f]/10 px-3.5 py-3 text-sm text-[#ffb6c0]" role="alert"><span>{error}</span><button type="button" className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[#c5ed83]" onClick={onRetry}><RefreshCw size={14} /> Reintentar</button></div> : null}
      {notice ? <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#c5ed83]" role="status"><Check size={15} /> {notice}</p> : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs text-[#858290]">Ingresos acumulados</p><p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(accumulated)}</p></div><div className="text-right"><p className="text-xs text-[#858290]">Objetivo</p><p className="mt-1 text-lg font-semibold text-[#c5ed83]">{hasGoal ? formatCurrency(target) : 'Sin definir'}</p></div></div>
          {hasGoal ? <><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Progreso de la meta de ahorro" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><div className="h-full rounded-full bg-gradient-to-r from-[#c5ed83] to-[#ae7bff] transition-[width] duration-500" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between gap-3 text-xs text-[#858290]"><span>{progress.toFixed(2)}% alcanzado</span><span>{remaining > 0 ? `Faltan ${formatCurrency(remaining)}` : 'Objetivo alcanzado'}</span></div></> : <p className="mt-4 flex items-center gap-2 text-xs text-[#858290]"><CircleHelp size={14} /> Define un monto para comenzar a medir tu avance.</p>}
        </div>

        <form className="grid gap-2 lg:min-w-72" onSubmit={submit}>
          <label className="text-xs font-semibold text-[#aaa8b5]" htmlFor="savings-goal-amount">Monto objetivo mensual</label>
          <div className="flex gap-2"><input id="savings-goal-amount" className="h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-[#18181e] px-3 text-sm text-white outline-none transition placeholder:text-[#6f6c7b] focus:border-[#ae7bff] focus:ring-4 focus:ring-[#ae7bff]/15" type="number" min="0.01" step="0.01" inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ej. 500.00" aria-invalid={Boolean(validationError)} aria-describedby={validationError ? 'savings-goal-error' : undefined} /><button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ae7bff] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#bd91ff] disabled:pointer-events-none disabled:opacity-55" type="submit" disabled={saving}><Save size={16} /> {saving ? 'Guardando…' : 'Guardar'}</button></div>
          {validationError ? <p id="savings-goal-error" className="text-xs text-[#ffb6c0]" role="alert">{validationError}</p> : null}
          {hasGoal && <button type="button" className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-[#858290] hover:text-[#ffb6c0] disabled:pointer-events-none disabled:opacity-55" onClick={onDelete} disabled={saving}><Trash2 size={13} /> Quitar meta de este mes</button>}
        </form>
      </div>
    </section>
  )
}
