import { useCallback, useEffect, useState } from 'react'
import { ArrowDownWideNarrow, ArrowRight, CalendarDays, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/FormField'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'
import { formatCurrency, formatearFecha, monthName } from '@/lib/utils'

export function ExpensesPage() {
  const navigate = useNavigate()
  const { period, setPeriod } = useDashboardPeriod()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams(period)
      setExpenses(await api.get(`/egresos?${params}`))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [period])

  // oxlint-disable-next-line react/set-state-in-effect -- The state changes only after the API request resolves.
  useEffect(() => { loadExpenses() }, [loadExpenses])

  async function deleteExpense(expense) {
    const accepted = window.confirm(`¿Eliminar el egreso “${expense.descripcion}”?`)
    if (!accepted) return
    setNotice('')
    setError('')
    try {
      await api.delete(`/egresos/${expense.id}`)
      setNotice('El egreso se eliminó correctamente.')
      setLoading(true)
      await loadExpenses()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function retryLoading() {
    setLoading(true)
    setError('')
    await loadExpenses()
  }

  function updatePeriod(name, value) {
    setLoading(true)
    setError('')
    setPeriod({ [name]: value })
  }

  return (
    <div className="grid gap-6 text-white">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#c5ed83]">Tus movimientos</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-white">Egresos</h1><p className="mt-2 text-sm text-[#aaa8b5]">Revisa y organiza tus gastos por período.</p></div><Button className="bg-[#ae7bff] text-white hover:bg-[#bd91ff]" onClick={() => navigate(`/egresos/nuevo?anio=${period.anio}&mes=${period.mes}`)}><Plus size={17} /> Nuevo egreso</Button></div>
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#111116] p-4 shadow-lg shadow-black/20 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-center gap-2 text-sm font-semibold text-[#c5ed83]"><CalendarDays size={17} /> Período: {monthName(period.mes)} {period.anio}</div><div className="grid grid-cols-2 gap-3 sm:min-w-[330px]"><label className="grid gap-1 text-xs font-medium text-[#aaa8b5]">Mes<select className="h-10 rounded-lg border border-white/10 bg-[#18181e] px-3 text-sm text-white outline-none focus:border-[#ae7bff] focus:ring-2 focus:ring-[#ae7bff]/20" value={period.mes} onChange={(event) => updatePeriod('mes', event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label><label className="grid gap-1 text-xs font-medium text-[#aaa8b5]">Año<input className="h-10 rounded-lg border border-white/10 bg-[#18181e] px-3 text-sm text-white outline-none focus:border-[#ae7bff] focus:ring-2 focus:ring-[#ae7bff]/20" type="number" min="2000" max="2100" value={period.anio} onChange={(event) => updatePeriod('anio', event.target.value)} /></label></div></section>
      <FormMessage dark tone={notice ? 'success' : 'error'}>{notice || error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit border-white/10 bg-[#18181e] text-white hover:bg-white/10" onClick={retryLoading}><RefreshCw size={14} /> Reintentar</Button>}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111116] shadow-lg shadow-black/20"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><h2 className="text-sm font-semibold text-white">Movimientos del período</h2><p className="mt-1 text-xs text-[#858290]">{loading ? 'Cargando…' : `${expenses.length} ${expenses.length === 1 ? 'egreso' : 'egresos'}`}</p></div><span className="grid size-9 place-items-center rounded-xl bg-[#ae7bff]/10 text-[#ae7bff]"><ArrowDownWideNarrow size={17} /></span></div>
        {loading ? <div className="grid gap-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-white/5" />)}</div> : error ? null : expenses.length === 0 ? <div className="grid justify-items-center px-6 py-14 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#ae7bff]/10 text-[#ae7bff]"><CalendarDays size={21} /></span><h3 className="mt-4 text-base font-semibold text-white">Todavía no hay egresos</h3><p className="mt-1 max-w-sm text-sm leading-6 text-[#858290]">No encontramos movimientos en este mes. Cuando registres uno, aparecerá aquí.</p><Button className="mt-5 bg-[#ae7bff] text-white hover:bg-[#bd91ff]" size="sm" onClick={() => navigate(`/egresos/nuevo?anio=${period.anio}&mes=${period.mes}`)}><Plus size={15} /> Registrar primer egreso</Button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.03] text-[10px] font-bold uppercase tracking-[0.14em] text-[#858290]"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3">Categoría</th><th className="px-5 py-3">Subcategoría</th><th className="px-5 py-3 text-right">Monto</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-white/10">{expenses.map((expense) => <tr key={expense.id} className="transition hover:bg-white/[0.03]"><td className="whitespace-nowrap px-5 py-4 text-[#858290]">{formatearFecha(expense.fecha)}</td><td className="max-w-[220px] truncate px-5 py-4 font-semibold text-white" title={expense.descripcion}>{expense.descripcion}</td><td className="px-5 py-4 text-[#aaa8b5]">{expense.categoria?.nombre || '—'}</td><td className="px-5 py-4 text-[#858290]">{expense.subcategoria?.nombre || '—'}</td><td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[#c5ed83]">{formatCurrency(expense.monto)}</td><td className="px-5 py-3"><div className="flex justify-end gap-1"><Link className="inline-flex size-9 items-center justify-center rounded-lg text-[#aaa8b5] hover:bg-white/10 hover:text-[#c5ed83]" to={`/egresos/${expense.id}/editar?anio=${period.anio}&mes=${period.mes}`} aria-label={`Editar ${expense.descripcion}`}><ArrowRight size={16} /></Link><Button variant="ghost" size="icon" className="size-9 text-[#ff9aaa] hover:bg-[#ff7d8f]/10 hover:text-[#ffb6c0]" aria-label={`Eliminar ${expense.descripcion}`} onClick={() => deleteExpense(expense)}><Trash2 size={16} /></Button></div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  )
}
