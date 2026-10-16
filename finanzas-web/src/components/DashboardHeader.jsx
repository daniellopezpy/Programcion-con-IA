import { CalendarDays } from 'lucide-react'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { monthName } from '@/lib/utils'

export function DashboardHeader() {
  const { period, setPeriod } = useDashboardPeriod()
  const selectedMonth = monthName(period.mes)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 7 }, (_, index) => currentYear - 5 + index)

  return (
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-sm font-medium text-[#c5ed83]">Tu panorama financiero</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.05em] text-white sm:text-5xl">Resumen</h1><p className="mt-3 max-w-md text-sm leading-6 text-[#aaa8b5]">Una vista clara de tu dinero para tomar decisiones con más calma.</p></div><section className="flex items-end gap-3 rounded-xl border border-white/10 bg-[#111116]/90 p-3 shadow-lg shadow-black/20" aria-label={`Período del dashboard: ${selectedMonth} ${period.anio}`}><CalendarDays size={17} className="mb-2 text-[#c5ed83]" /><label className="grid gap-1 text-[11px] font-semibold text-[#a8a5b3]">Mes<select className="h-9 rounded-lg border border-white/10 bg-[#18181e] px-2.5 text-sm text-white outline-none focus:border-[#ae7bff] focus:ring-2 focus:ring-[#ae7bff]/20" value={period.mes} onChange={(event) => setPeriod({ mes: event.target.value })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label><label className="grid gap-1 text-[11px] font-semibold text-[#a8a5b3]">Año<select className="h-9 rounded-lg border border-white/10 bg-[#18181e] px-2.5 text-sm text-white outline-none focus:border-[#ae7bff] focus:ring-2 focus:ring-[#ae7bff]/20" value={period.anio} onChange={(event) => setPeriod({ anio: event.target.value })}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label></section></div>
  )
}
