import { useCallback, useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, CircleHelp, RefreshCw, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/FormField'
import { api } from '@/lib/api'
import { formatCurrency, getCurrentPeriod } from '@/lib/utils'

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function HomePage() {
  const [period] = useState(getCurrentPeriod)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams(period)
      setSummary(await api.get(`/dashboard/resumen?${params}`))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [period])

  // oxlint-disable-next-line react/set-state-in-effect -- The state changes only after the API request resolves.
  useEffect(() => { loadSummary() }, [loadSummary])

  async function retrySummary() {
    setLoading(true)
    setError('')
    await loadSummary()
  }

  const cards = [
    { label: 'Ingresos del mes', amount: summary?.ingresos_mes, icon: ArrowDownLeft, tone: 'green' },
    { label: 'Egresos del mes', amount: summary?.egresos_mes, icon: ArrowUpRight, tone: 'amber' },
    { label: 'Balance del mes', amount: summary?.balance_mes, icon: Wallet, tone: 'neutral' },
  ]

  return (
    <div className="grid gap-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#71877b]">Tu panorama financiero</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#17372c]">Resumen</h1><p className="mt-2 text-sm text-[#7d8a82]">Una mirada clara a tus movimientos.</p></div><div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#e1e8e0] bg-white px-3.5 py-2.5 text-sm text-[#5d7166]"><CalendarDays size={16} />{monthNames[Number(period.mes) - 1]} {period.anio}</div></div>
      <FormMessage>{error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit" onClick={retrySummary}><RefreshCw size={14} /> Reintentar</Button>}
      <section className="grid gap-4 md:grid-cols-3" aria-label="Totales del mes">
        {cards.map(({ label, amount, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-[#e5eae3] bg-white p-5 shadow-sm shadow-[#33483c]/[0.025]"><div className="flex items-center justify-between"><p className="text-sm font-medium text-[#718078]">{label}</p><span className={`grid size-10 place-items-center rounded-xl ${tone === 'green' ? 'bg-[#e8f4e4] text-[#287152]' : tone === 'amber' ? 'bg-[#fbf1dc] text-[#ad7924]' : 'bg-[#eef1eb] text-[#647a6d]'}`}><Icon size={18} /></span></div><p className="mt-6 text-2xl font-semibold tracking-tight text-[#20382d]">{loading ? <span className="inline-block h-7 w-32 animate-pulse rounded bg-[#edf1ea]" /> : formatCurrency(amount)}</p><p className="mt-1 text-xs text-[#98a39b]">{monthNames[Number(period.mes) - 1]} {period.anio}</p></article>)}
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-[#e5eae3] bg-white p-6 shadow-sm shadow-[#33483c]/[0.025]"><div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-semibold text-[#243c31]">Tu balance</h2><p className="mt-1 text-sm text-[#829087]">Ingresos menos egresos durante el mes seleccionado.</p></div><span className="grid size-9 place-items-center rounded-xl bg-[#f0f4ed] text-[#628171]"><Wallet size={17} /></span></div>{loading ? <div className="mt-7 h-28 animate-pulse rounded-xl bg-[#f3f5f0]" /> : <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs text-[#89968e]">Resultado</p><p className={`mt-1 text-3xl font-semibold tracking-tight ${Number(summary?.balance_mes || 0) < 0 ? 'text-[#a85347]' : 'text-[#1c6047]'}`}>{formatCurrency(summary?.balance_mes)}</p></div><div className="flex items-center gap-2 rounded-xl bg-[#f4f7f1] px-3.5 py-2.5 text-xs text-[#65766c]"><span className="size-2 rounded-full bg-[#9bc66c]" /> Gastaste <strong className="text-[#344d3e]">{summary?.porcentaje_gastado ?? '0.00'}%</strong> de tus ingresos</div></div>}</div>
        <div className="flex flex-col justify-between gap-6 rounded-2xl bg-[#123f35] p-6 text-white"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#c5ed83]">Un paso a la vez</p><h2 className="mt-3 max-w-xs font-serif text-2xl leading-tight">Registrar tus movimientos te ayuda a ver el panorama completo.</h2></div><div className="grid gap-2"><Link to="/egresos/nuevo" className="inline-flex items-center justify-between rounded-xl bg-[#c5ed83] px-4 py-3 text-sm font-semibold text-[#153d32] hover:bg-[#d3f29b]">Agregar un egreso <ArrowRight size={17} /></Link><Link to="/egresos" className="inline-flex items-center justify-between rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5">Ver mis egresos <ArrowRight size={17} /></Link></div></div>
      </section>
      <p className="flex items-center gap-2 text-xs text-[#8a968f]"><CircleHelp size={14} /> Los totales se consultan desde tu cuenta y el período actual.</p>
    </div>
  )
}
