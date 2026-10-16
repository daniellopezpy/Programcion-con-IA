import { useCallback, useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CircleHelp, RefreshCw, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardBalancePanel } from '@/components/DashboardBalancePanel'
import { DashboardMetricCard } from '@/components/DashboardMetricCard'
import { CategoryExpensesChart, AnnualEvolutionChart } from '@/components/DashboardCharts'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/FormField'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'

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
    <div className="dashboard-stage -mx-4 -my-7 space-y-7 px-4 py-7 pb-10 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:-my-9 lg:px-8 lg:py-9">
      <DashboardHeader />
      <FormMessage dark>{error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit" onClick={retryDashboard}><RefreshCw size={14} /> Reintentar</Button>}
      <DashboardBalancePanel summary={summary} loading={loading} query={query} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Métricas del período">
        {metrics.map((metric) => <DashboardMetricCard key={metric.label} {...metric} loading={loading} to={metric.to ? `${metric.to}?${query}` : undefined} />)}
      </section>
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]" aria-label="Gráficas del dashboard">
        <CategoryExpensesChart data={categories} loading={loading} />
        <AnnualEvolutionChart data={annual} loading={loading} />
      </section>
      <section className="flex flex-col justify-between gap-5 rounded-xl border border-white/10 bg-[#111116] p-5 shadow-lg shadow-black/20 sm:flex-row sm:items-center sm:p-6"><div><p className="text-sm font-semibold text-white">¿Quieres mantener tus números al día?</p><p className="mt-1 text-sm text-[#858290]">Registra un movimiento y el resumen se actualizará automáticamente.</p></div><div className="flex flex-wrap gap-2"><Link to={`/ingresos?${query}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm font-semibold text-[#c5ed83] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ae7bff]"><ArrowDownLeft size={16} /> Ver ingresos</Link><Link to={`/egresos/nuevo?${query}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#ae7bff] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#bd91ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ae7bff]">Registrar egreso <ArrowRight size={16} /></Link></div></section>
      <p className="flex items-center gap-2 text-xs text-[#8a968f]"><CircleHelp size={14} /> Los totales se consultan desde tu cuenta y el período seleccionado.</p>
    </div>
  )
}
