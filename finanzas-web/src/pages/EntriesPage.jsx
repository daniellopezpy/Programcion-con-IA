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
    <div className="grid gap-12 text-[#1c1917]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78716c]">Tus movimientos</p>
        <h1 className="thought-serif mt-3 text-4xl tracking-[-0.04em] text-[#1c1917]">Ingresos</h1>
        <p className="mt-3 text-base leading-7 text-[#57534e]">Consulta el dinero que has recibido.</p>
      </div>
      <section className="flex flex-col gap-6 border border-[#e7e5e4] bg-[#fafaf9] p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-[#57534e]"><CalendarDays size={17} /> Período: {monthName(period.mes)} {period.anio}</div>
        <div className="grid grid-cols-2 gap-4 sm:min-w-[330px]">
          <label className="grid gap-2 text-xs font-medium text-[#78716c]">Mes<select className="thought-focus h-12 border border-[#d6d3d1] bg-[#fafaf9] px-3 text-sm text-[#1c1917] outline-none" value={period.mes} onChange={(event) => updatePeriod('mes', event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label>
          <label className="grid gap-2 text-xs font-medium text-[#78716c]">Año<input className="thought-focus h-12 border border-[#d6d3d1] bg-[#fafaf9] px-3 text-sm text-[#1c1917] outline-none" type="number" min="2000" max="2100" value={period.anio} onChange={(event) => updatePeriod('anio', event.target.value)} /></label>
        </div>
      </section>
      <FormMessage>{error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit" onClick={retryLoading}><RefreshCw size={14} /> Reintentar</Button>}
      <section className="overflow-hidden border border-[#e7e5e4] bg-[#fafaf9]">
        <div className="border-b border-[#e7e5e4] px-6 py-5"><h2 className="text-sm font-semibold text-[#1c1917]">Ingresos del período</h2><p className="mt-1 text-xs text-[#78716c]">{loading ? 'Cargando…' : `${entries.length} ${entries.length === 1 ? 'ingreso' : 'ingresos'}`}</p></div>
        {loading ? <div className="grid gap-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse bg-[#efedeb]" />)}</div> : error ? null : entries.length === 0 ? <div className="grid justify-items-center px-6 py-16 text-center"><span className="grid size-12 place-items-center bg-[#f0fdf4] text-[#15803d]"><ArrowDownLeft size={21} /></span><h3 className="mt-5 text-base font-semibold text-[#1c1917]">Todavía no hay ingresos</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#78716c]">Cuando registres ingresos desde tu sistema, aparecerán aquí.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#f5f5f4] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716c]"><tr><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Descripción</th><th className="px-6 py-3">Categoría</th><th className="px-6 py-3 text-right">Monto</th></tr></thead><tbody className="divide-y divide-[#e7e5e4]">{entries.map((entry) => <tr key={entry.id} className="transition-colors hover:bg-[#f5f5f4]"><td className="whitespace-nowrap px-6 py-4 text-[#78716c]">{formatearFecha(entry.fecha)}</td><td className="px-6 py-4 font-medium text-[#1c1917]">{entry.descripcion}</td><td className="px-6 py-4 text-[#57534e]">{entry.categoria?.nombre || '—'}</td><td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-[#57534e]">{formatCurrency(entry.monto)}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  )
}
