import { ArrowDownLeft, ArrowUpRight, CircleCheck, CircleX, Plus, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'

export function DashboardBalancePanel({ summary, loading, query }) {
  const balance = Number(summary?.balance_mes || 0)
  const spent = Math.min(Math.max(Number(summary?.porcentaje_gastado || 0), 0), 100)
  const isNegative = balance < 0

  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#111116] text-white shadow-2xl shadow-black/30" aria-label="Balance mensual">
      <div className="pointer-events-none absolute -left-28 -top-36 size-96 rounded-full bg-[#7f44ca]/20 blur-3xl" />
      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden p-6 sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-4 -top-12 size-44 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-medium text-[#aaa8b5]"><Wallet size={15} className="text-[#c5ed83]" /> Balance del mes</div>
            <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-3">
              {loading ? <span className="h-12 w-48 animate-pulse rounded-lg bg-white/10" /> : <p className={`text-5xl font-semibold tracking-[-0.06em] sm:text-6xl ${isNegative ? 'text-[#ffb6a9]' : 'text-[#f5faee]'}`}>{formatCurrency(summary?.balance_mes)}</p>}
              {!loading && <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isNegative ? 'bg-[#c45c53]/20 text-[#ffb6a9]' : 'bg-[#c5ed83]/15 text-[#c5ed83]'}`}>{isNegative ? <CircleX size={13} /> : <CircleCheck size={13} />}{isNegative ? 'Revisa tus gastos' : 'Balance positivo'}</span>}
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#aaa8b5]">El resultado de tus ingresos y egresos durante el período que elegiste.</p>
            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3.5"><div className="flex items-center gap-2 text-xs text-[#aaa8b5]"><ArrowDownLeft size={14} className="text-[#c5ed83]" /> Ingresos</div><p className="mt-2 text-lg font-semibold">{loading ? '—' : formatCurrency(summary?.ingresos_mes)}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3.5"><div className="flex items-center gap-2 text-xs text-[#aaa8b5]"><ArrowUpRight size={14} className="text-[#e8bd73]" /> Egresos</div><p className="mt-2 text-lg font-semibold">{loading ? '—' : formatCurrency(summary?.egresos_mes)}</p></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-8 border-t border-white/10 bg-[#0d0d11] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
          <div><p className="text-xs font-medium text-[#aaa8b5]">Uso de tus ingresos</p><div className="mt-4 flex items-end justify-between gap-3"><p className="text-4xl font-semibold tracking-tight text-white">{loading ? '—' : `${summary?.porcentaje_gastado ?? '0.00'}%`}</p><p className="pb-1 text-xs text-[#858290]">del mes gastado</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#c5ed83] transition-[width] duration-500" style={{ width: loading ? '0%' : `${spent}%` }} /></div><p className="mt-3 text-xs leading-5 text-[#858290]">{isNegative ? 'Tus egresos superan tus ingresos este mes.' : 'Mantén este ritmo para cuidar tu balance.'}</p></div>
          <Link to={`/egresos/nuevo?${query}`} className="inline-flex min-h-11 items-center justify-between rounded-xl bg-[#ae7bff] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#bd91ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ae7bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d11]"><span className="inline-flex items-center gap-2"><Plus size={17} /> Registrar egreso</span><span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  )
}
