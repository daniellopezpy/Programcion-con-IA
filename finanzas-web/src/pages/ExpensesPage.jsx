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
    <div className="grid gap-12 text-[#1c1917]">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78716c]">Tus movimientos</p><h1 className="thought-serif mt-3 text-4xl tracking-[-0.04em] text-[#1c1917]">Egresos</h1><p className="mt-3 text-base leading-7 text-[#57534e]">Revisa y organiza tus gastos por período.</p></div>
        <Button onClick={() => navigate(`/egresos/nuevo?anio=${period.anio}&mes=${period.mes}`)}><Plus size={17} /> Nuevo egreso</Button>
      </div>
      <section className="flex flex-col gap-6 border border-[#e7e5e4] bg-[#fafaf9] p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[#57534e]"><CalendarDays size={17} /> Período: {monthName(period.mes)} {period.anio}</div>
        <div className="grid grid-cols-2 gap-4 sm:min-w-[330px]"><label className="grid gap-2 text-xs font-medium text-[#78716c]">Mes<select className="thought-focus h-12 border border-[#d6d3d1] bg-[#fafaf9] px-3 text-sm text-[#1c1917] outline-none" value={period.mes} onChange={(event) => updatePeriod('mes', event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label><label className="grid gap-2 text-xs font-medium text-[#78716c]">Año<input className="thought-focus h-12 border border-[#d6d3d1] bg-[#fafaf9] px-3 text-sm text-[#1c1917] outline-none" type="number" min="2000" max="2100" value={period.anio} onChange={(event) => updatePeriod('anio', event.target.value)} /></label></div>
      </section>
      <FormMessage tone={notice ? 'success' : 'error'}>{notice || error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit" onClick={retryLoading}><RefreshCw size={14} /> Reintentar</Button>}
      <section className="overflow-hidden border border-[#e7e5e4] bg-[#fafaf9]">
        <div className="flex items-center justify-between border-b border-[#e7e5e4] px-6 py-5"><div><h2 className="text-sm font-semibold text-[#1c1917]">Movimientos del período</h2><p className="mt-1 text-xs text-[#78716c]">{loading ? 'Cargando…' : `${expenses.length} ${expenses.length === 1 ? 'egreso' : 'egresos'}`}</p></div><span className="grid size-9 place-items-center bg-[#fefce8] text-[#a16207]"><ArrowDownWideNarrow size={17} /></span></div>
        {loading ? <div className="grid gap-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse bg-[#efedeb]" />)}</div> : error ? null : expenses.length === 0 ? <div className="grid justify-items-center px-6 py-16 text-center"><span className="grid size-12 place-items-center bg-[#fefce8] text-[#a16207]"><CalendarDays size={21} /></span><h3 className="mt-5 text-base font-semibold text-[#1c1917]">Todavía no hay egresos</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#78716c]">No encontramos movimientos en este mes. Cuando registres uno, aparecerá aquí.</p><Button className="mt-6" size="sm" onClick={() => navigate(`/egresos/nuevo?anio=${period.anio}&mes=${period.mes}`)}><Plus size={15} /> Registrar primer egreso</Button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f5f5f4] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716c]"><tr><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Descripción</th><th className="px-6 py-3">Categoría</th><th className="px-6 py-3">Subcategoría</th><th className="px-6 py-3 text-right">Monto</th><th className="px-6 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-[#e7e5e4]">{expenses.map((expense) => <tr key={expense.id} className="transition-colors hover:bg-[#f5f5f4]"><td className="whitespace-nowrap px-6 py-4 text-[#78716c]">{formatearFecha(expense.fecha)}</td><td className="max-w-[220px] truncate px-6 py-4 font-medium text-[#1c1917]" title={expense.descripcion}>{expense.descripcion}</td><td className="px-6 py-4 text-[#57534e]">{expense.categoria?.nombre || '—'}</td><td className="px-6 py-4 text-[#78716c]">{expense.subcategoria?.nombre || '—'}</td><td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-[#57534e]">{formatCurrency(expense.monto)}</td><td className="px-6 py-3"><div className="flex justify-end gap-1"><Link className="thought-focus inline-flex size-9 items-center justify-center text-[#78716c] hover:bg-[#efedeb] hover:text-[#1c1917]" to={`/egresos/${expense.id}/editar?anio=${period.anio}&mes=${period.mes}`} aria-label={`Editar ${expense.descripcion}`}><ArrowRight size={16} /></Link><Button variant="ghost" size="icon" className="size-9 text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#b91c1c]" aria-label={`Eliminar ${expense.descripcion}`} onClick={() => deleteExpense(expense)}><Trash2 size={16} /></Button></div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  )
}
