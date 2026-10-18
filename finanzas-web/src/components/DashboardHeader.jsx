import { CalendarDays } from 'lucide-react'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { monthName } from '@/lib/utils'

export function DashboardHeader() {
  const { period, setPeriod } = useDashboardPeriod()
  const selectedMonth = monthName(period.mes)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 7 }, (_, index) => currentYear - 5 + index)

  return (
    <div className="flex flex-col justify-between gap-8 border-b border-[#e7e5e4] pb-8 lg:flex-row lg:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#78716c]">Tu panorama financiero</p><h1 className="thought-serif mt-4 text-4xl font-bold tracking-[-0.03em] text-[#1c1917] sm:text-5xl">Resumen</h1><p className="mt-4 max-w-md text-[17px] leading-[1.8] text-[#57534e]">Una vista clara de tu dinero para tomar decisiones con más calma.</p></div><section className="flex items-end gap-3 border border-[#d6d3d1] bg-[#fafaf9] p-4" aria-label={`Período del dashboard: ${selectedMonth} ${period.anio}`}><CalendarDays size={17} className="mb-2 text-[#78716c]" /><label className="grid gap-2 text-[13px] font-semibold text-[#57534e]">Mes<select className="thought-focus h-12 border border-[#d6d3d1] bg-[#fafaf9] px-3 text-[15px] text-[#1c1917] outline-none focus:border-[#78716c]" value={period.mes} onChange={(event) => setPeriod({ mes: event.target.value })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label><label className="grid gap-2 text-[13px] font-semibold text-[#57534e]">Año<select className="thought-focus h-12 border border-[#d6d3d1] bg-[#fafaf9] px-3 text-[15px] text-[#1c1917] outline-none focus:border-[#78716c]" value={period.anio} onChange={(event) => setPeriod({ anio: event.target.value })}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label></section></div>
  )
}
