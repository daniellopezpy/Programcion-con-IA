import { useCallback, useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CircleHelp, RefreshCw, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardHeader } from '@/components/DashboardHeader'
import { CategoryExpensesChart, AnnualEvolutionChart } from '@/components/DashboardCharts'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/FormField'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function HomePage() {
  const { period, query } = useDashboardPeriod()
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [annual, setAnnual] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, categoryData, annualData] = await Promise.all([
        api.get(`/dashboard/resumen?${query}`),
        api.get(`/dashboard/egresos-por-categoria?${query}`),
        api.get(`/dashboard/resumen-anual?anio=${period.anio}`),
      ])
      setSummary(summaryData)
      setCategories(categoryData)
      setAnnual(annualData)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [period.anio, query])

  // oxlint-disable-next-line react/set-state-in-effect -- The state changes only after the API request resolves.
  useEffect(() => { loadDashboard() }, [loadDashboard])

  async function retryDashboard() {
    await loadDashboard()
  }

  const balanceIsNegative = Number(summary?.balance_mes || 0) < 0
  const accumulatedIsNegative = Number(summary?.balance_acumulado || 0) < 0
  const metrics = [
    { label: 'Ingresos del mes', amount: summary?.ingresos_mes, icon: ArrowDownLeft, tone: 'positive', to: '/ingresos' },
    { label: 'Egresos del mes', amount: summary?.egresos_mes, icon: ArrowUpRight, tone: 'amber', to: '/egresos' },
    { label: 'Balance del mes', amount: summary?.balance_mes, icon: Wallet, tone: balanceIsNegative ? 'negative' : 'positive' },
    { label: 'Acumulado del año', amount: summary?.balance_acumulado, icon: Wallet, tone: accumulatedIsNegative ? 'negative' : 'positive' },
  ]

  return (
    <div className="grid gap-7">
      <DashboardHeader metrics={metrics} loading={loading} />
      <FormMessage>{error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit" onClick={retryDashboard}><RefreshCw size={14} /> Reintentar</Button>}

      <section className="grid gap-5 xl:grid-cols-2" aria-label="Gráficas del dashboard">
        <CategoryExpensesChart data={categories} loading={loading} />
        <AnnualEvolutionChart data={annual} loading={loading} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-[#e5eae3] bg-white p-6 shadow-sm shadow-[#33483c]/[0.025]"><div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-semibold text-[#243c31]">Tu balance</h2><p className="mt-1 text-sm text-[#829087]">Ingresos menos egresos durante el mes seleccionado.</p></div><span className="grid size-9 place-items-center rounded-xl bg-[#f0f4ed] text-[#628171]"><Wallet size={17} /></span></div>{loading ? <div className="mt-7 h-28 animate-pulse rounded-xl bg-[#f3f5f0]" /> : <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs text-[#89968e]">Resultado</p><p className={`mt-1 text-3xl font-semibold tracking-tight ${balanceIsNegative ? 'text-[#a85347]' : 'text-[#1c6047]'}`}>{formatCurrency(summary?.balance_mes)}</p></div><div className="flex items-center gap-2 rounded-xl bg-[#f4f7f1] px-3.5 py-2.5 text-xs text-[#65766c]"><span className="size-2 rounded-full bg-[#9bc66c]" /> Gastaste <strong className="text-[#344d3e]">{summary?.porcentaje_gastado ?? '0.00'}%</strong> de tus ingresos</div></div>}</div>
        <div className="flex flex-col justify-between gap-6 rounded-2xl bg-[#123f35] p-6 text-white"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#c5ed83]">Un paso a la vez</p><h2 className="mt-3 max-w-xs font-serif text-2xl leading-tight">Registrar tus movimientos te ayuda a ver el panorama completo.</h2></div><div className="grid gap-2"><Link to={`/egresos/nuevo?${query}`} className="inline-flex items-center justify-between rounded-xl bg-[#c5ed83] px-4 py-3 text-sm font-semibold text-[#153d32] hover:bg-[#d3f29b]">Agregar un egreso <ArrowRight size={17} /></Link><Link to={`/egresos?${query}`} className="inline-flex items-center justify-between rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5">Ver mis egresos <ArrowRight size={17} /></Link></div></div>
      </section>
      <p className="flex items-center gap-2 text-xs text-[#8a968f]"><CircleHelp size={14} /> Los totales se consultan desde tu cuenta y el período seleccionado.</p>
    </div>
  )
}
