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
    <div className="thought-page grid gap-12 pb-10">
      <DashboardHeader />
      <FormMessage>{error}</FormMessage>
      {error && <Button variant="secondary" size="sm" className="w-fit" onClick={retryDashboard}><RefreshCw size={14} /> Reintentar</Button>}
      <DashboardBalancePanel summary={summary} loading={loading} query={query} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Métricas del período">
        {metrics.map((metric) => <DashboardMetricCard key={metric.label} {...metric} loading={loading} to={metric.to ? `${metric.to}?${query}` : undefined} />)}
      </section>
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]" aria-label="Gráficas del dashboard">
        <CategoryExpensesChart data={categories} loading={loading} />
        <AnnualEvolutionChart data={annual} loading={loading} />
      </section>
      <section className="flex flex-col justify-between gap-6 border border-[#e7e5e4] bg-[#f5f5f4] p-6 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-[#1c1917]">¿Quieres mantener tus números al día?</p><p className="mt-1 text-sm text-[#57534e]">Registra un movimiento y el resumen se actualizará automáticamente.</p></div><div className="flex flex-wrap gap-3"><Link to={`/ingresos?${query}`} className="thought-focus inline-flex min-h-10 items-center gap-2 border border-[#d6d3d1] bg-[#fafaf9] px-4 py-2 text-sm font-semibold text-[#57534e] transition-colors hover:bg-[#efedeb]"><ArrowDownLeft size={16} /> Ver ingresos</Link><Link to={`/egresos/nuevo?${query}`} className="thought-focus inline-flex min-h-10 items-center gap-2 border border-[#78716c] bg-[#78716c] px-4 py-2 text-sm font-semibold text-[#fafaf9] transition-colors hover:bg-[#57534e]">Registrar egreso <ArrowRight size={16} /></Link></div></section>
      <p className="flex items-center gap-2 text-xs text-[#78716c]"><CircleHelp size={14} /> Los totales se consultan desde tu cuenta y el período seleccionado.</p>
    </div>
  )
}
