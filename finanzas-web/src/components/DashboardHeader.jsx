import { CalendarDays } from 'lucide-react'
import { DashboardMetricCard } from '@/components/DashboardMetricCard'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { monthName } from '@/lib/utils'

export function DashboardHeader({ metrics, loading }) {
  const { period, query, setPeriod } = useDashboardPeriod()
  const selectedMonth = monthName(period.mes)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 7 }, (_, index) => currentYear - 5 + index)

  return (
    <>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#71877b]">Tu panorama financiero</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#17372c]">Resumen</h1><p className="mt-2 text-sm text-[#7d8a82]">Una mirada clara a tus movimientos.</p></div><section className="flex items-end gap-3 rounded-2xl border border-[#e1e8e0] bg-white p-3" aria-label="Período del dashboard"><CalendarDays size={17} className="mb-2 text-[#648171]" /><label className="grid gap-1 text-[11px] font-semibold text-[#748178]">Mes<select className="h-9 rounded-lg border border-[#dce4dd] bg-white px-2.5 text-sm text-[#31463b] outline-none focus:border-[#508c72]" value={period.mes} onChange={(event) => setPeriod({ mes: event.target.value })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label><label className="grid gap-1 text-[11px] font-semibold text-[#748178]">Año<select className="h-9 rounded-lg border border-[#dce4dd] bg-white px-2.5 text-sm text-[#31463b] outline-none focus:border-[#508c72]" value={period.anio} onChange={(event) => setPeriod({ anio: event.target.value })}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label></section></div>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={`Métricas de ${selectedMonth} ${period.anio}`}>
        {metrics.map((metric) => <DashboardMetricCard key={metric.label} {...metric} loading={loading} to={metric.to ? `${metric.to}?${query}` : undefined} />)}
      </section>
    </>
  )
}
