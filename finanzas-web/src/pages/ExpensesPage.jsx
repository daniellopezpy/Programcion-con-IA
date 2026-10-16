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
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#71877b]">Tus movimientos</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#17372c]">Egresos</h1><p className="mt-2 text-sm text-[#7d8a82]">Revisa y organiza tus gastos por período.</p></div><Button onClick={() => navigate('/egresos/nuevo')}><Plus size={17} /> Nuevo egreso</Button></div>
      <section className="flex flex-col gap-3 rounded-2xl border border-[#e5eae3] bg-white p-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-center gap-2 text-sm font-semibold text-[#536b5e]"><CalendarDays size={17} /> Período: {monthName(period.mes)} {period.anio}</div><div className="grid grid-cols-2 gap-3 sm:min-w-[330px]"><label className="grid gap-1 text-xs font-medium text-[#748178]">Mes<select className="h-10 rounded-lg border border-[#dce4dd] bg-white px-3 text-sm text-[#31463b] outline-none focus:border-[#508c72]" value={period.mes} onChange={(event) => updatePeriod('mes', event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label><label className="grid gap-1 text-xs font-medium text-[#748178]">Año<input className="h-10 rounded-lg border border-[#dce4dd] bg-white px-3 text-sm text-[#31463b] outline-none focus:border-[#508c72]" type="number" min="2000" max="2100" value={period.anio} onChange={(event) => updatePeriod('anio', event.target.value)} /></label></div></section>
      <FormMessage>{notice} {error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit" onClick={retryLoading}><RefreshCw size={14} /> Reintentar</Button>}
      <section className="overflow-hidden rounded-2xl border border-[#e5eae3] bg-white shadow-sm shadow-[#33483c]/[0.025]">
        <div className="flex items-center justify-between border-b border-[#edf0eb] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#294237]">Movimientos del período</h2><p className="mt-1 text-xs text-[#87938b]">{loading ? 'Cargando…' : `${expenses.length} ${expenses.length === 1 ? 'egreso' : 'egresos'}`}</p></div><span className="grid size-9 place-items-center rounded-xl bg-[#f0f4ed] text-[#668071]"><ArrowDownWideNarrow size={17} /></span></div>
        {loading ? <div className="grid gap-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-[#f3f5f0]" />)}</div> : error ? null : expenses.length === 0 ? <div className="grid justify-items-center px-6 py-14 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#f0f4ed] text-[#6f8e7b]"><CalendarDays size={21} /></span><h3 className="mt-4 text-base font-semibold text-[#294237]">Todavía no hay egresos</h3><p className="mt-1 max-w-sm text-sm leading-6 text-[#829087]">No encontramos movimientos en este mes. Cuando registres uno, aparecerá aquí.</p><Button className="mt-5" size="sm" onClick={() => navigate(`/egresos/nuevo?anio=${period.anio}&mes=${period.mes}`)}><Plus size={15} /> Registrar primer egreso</Button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f8faf6] text-[10px] font-bold uppercase tracking-[0.14em] text-[#849187]"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3">Categoría</th><th className="px-5 py-3">Subcategoría</th><th className="px-5 py-3 text-right">Monto</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-[#eef1ec]">{expenses.map((expense) => <tr key={expense.id} className="transition hover:bg-[#fbfcfa]"><td className="whitespace-nowrap px-5 py-4 text-[#738178]">{formatearFecha(expense.fecha)}</td><td className="max-w-[220px] truncate px-5 py-4 font-semibold text-[#30483c]" title={expense.descripcion}>{expense.descripcion}</td><td className="px-5 py-4 text-[#61756a]">{expense.categoria?.nombre || '—'}</td><td className="px-5 py-4 text-[#87938b]">{expense.subcategoria?.nombre || '—'}</td><td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[#315842]">{formatCurrency(expense.monto)}</td><td className="px-5 py-3"><div className="flex justify-end gap-1"><Link className="inline-flex size-9 items-center justify-center rounded-lg text-[#657c6d] hover:bg-[#edf3eb] hover:text-[#24553e]" to={`/egresos/${expense.id}/editar?anio=${period.anio}&mes=${period.mes}`} aria-label={`Editar ${expense.descripcion}`}><ArrowRight size={16} /></Link><Button variant="ghost" size="icon" className="size-9 text-[#a16c65] hover:bg-rose-50 hover:text-rose-700" aria-label={`Eliminar ${expense.descripcion}`} onClick={() => deleteExpense(expense)}><Trash2 size={16} /></Button></div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  )
}
