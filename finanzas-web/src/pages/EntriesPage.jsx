import { useCallback, useEffect, useState } from 'react'
import { ArrowDownLeft, CalendarDays, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/FormField'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'
import { formatCurrency, formatearFecha, monthName } from '@/lib/utils'

export function EntriesPage() {
  const { period, setPeriod } = useDashboardPeriod()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams(period)
      setEntries(await api.get(`/ingresos?${params}`))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [period])

  // oxlint-disable-next-line react/set-state-in-effect -- The state changes only after the API request resolves.
  useEffect(() => { loadEntries() }, [loadEntries])

  async function retryLoading() {
    setLoading(true)
    setError('')
    await loadEntries()
  }

  function updatePeriod(name, value) {
    setLoading(true)
    setError('')
    setPeriod({ [name]: value })
  }

  return (
    <div className="grid gap-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#71877b]">Tus movimientos</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#17372c]">Ingresos</h1><p className="mt-2 text-sm text-[#7d8a82]">Consulta el dinero que has recibido.</p></div>
      <section className="flex flex-col gap-3 rounded-2xl border border-[#e5eae3] bg-white p-4 sm:flex-row sm:items-end sm:justify-between"><div className="inline-flex items-center gap-2 text-sm font-semibold text-[#536b5e]"><CalendarDays size={17} /> Período: {monthName(period.mes)} {period.anio}</div><div className="grid grid-cols-2 gap-3 sm:min-w-[330px]"><label className="grid gap-1 text-xs font-medium text-[#748178]">Mes<select className="h-10 rounded-lg border border-[#dce4dd] bg-white px-3 text-sm text-[#31463b] outline-none focus:border-[#508c72]" value={period.mes} onChange={(event) => updatePeriod('mes', event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label><label className="grid gap-1 text-xs font-medium text-[#748178]">Año<input className="h-10 rounded-lg border border-[#dce4dd] bg-white px-3 text-sm text-[#31463b] outline-none focus:border-[#508c72]" type="number" min="2000" max="2100" value={period.anio} onChange={(event) => updatePeriod('anio', event.target.value)} /></label></div></section>
      <FormMessage>{error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit" onClick={retryLoading}><RefreshCw size={14} /> Reintentar</Button>}
      <section className="overflow-hidden rounded-2xl border border-[#e5eae3] bg-white shadow-sm shadow-[#33483c]/[0.025]"><div className="border-b border-[#edf0eb] px-5 py-4"><h2 className="text-sm font-semibold text-[#294237]">Ingresos del período</h2><p className="mt-1 text-xs text-[#87938b]">{loading ? 'Cargando…' : `${entries.length} ${entries.length === 1 ? 'ingreso' : 'ingresos'}`}</p></div>{loading ? <div className="grid gap-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-[#f3f5f0]" />)}</div> : error ? null : entries.length === 0 ? <div className="grid justify-items-center px-6 py-14 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#e8f4e4] text-[#287152]"><ArrowDownLeft size={21} /></span><h3 className="mt-4 text-base font-semibold text-[#294237]">Todavía no hay ingresos</h3><p className="mt-1 max-w-sm text-sm leading-6 text-[#829087]">Cuando registres ingresos desde tu sistema, aparecerán aquí.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#f8faf6] text-[10px] font-bold uppercase tracking-[0.14em] text-[#849187]"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3">Categoría</th><th className="px-5 py-3 text-right">Monto</th></tr></thead><tbody className="divide-y divide-[#eef1ec]">{entries.map((entry) => <tr key={entry.id}><td className="whitespace-nowrap px-5 py-4 text-[#738178]">{formatearFecha(entry.fecha)}</td><td className="px-5 py-4 font-semibold text-[#30483c]">{entry.descripcion}</td><td className="px-5 py-4 text-[#61756a]">{entry.categoria?.nombre || '—'}</td><td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[#315842]">{formatCurrency(entry.monto)}</td></tr>)}</tbody></table></div>}</section>
    </div>
  )
}
