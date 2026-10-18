import { ArrowDownLeft, ArrowUpRight, CircleCheck, CircleX, Plus, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'

export function DashboardBalancePanel({ summary, loading, query }) {
  const balance = Number(summary?.balance_mes || 0)
  const spent = Math.min(Math.max(Number(summary?.porcentaje_gastado || 0), 0), 100)
  const isNegative = balance < 0

  return (
    <section className="relative overflow-hidden border border-[#d6d3d1] bg-[#f5f5f4] text-[#1c1917]" aria-label="Balance mensual">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden p-6 sm:p-8 lg:p-9">
          <div className="relative">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#57534e]"><Wallet size={15} className="text-[#78716c]" /> Balance del mes</div>
            <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-3">
              {loading ? <span className="h-12 w-48 animate-pulse bg-[#efedeb]" /> : <p className={`thought-serif text-5xl font-bold tracking-[-0.06em] sm:text-6xl ${isNegative ? 'text-[#dc2626]' : 'text-[#1c1917]'}`}>{formatCurrency(summary?.balance_mes)}</p>}
              {!loading && <span className={`mb-2 inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold ${isNegative ? 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]' : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#65a30d]'}`}>{isNegative ? <CircleX size={13} /> : <CircleCheck size={13} />}{isNegative ? 'Revisa tus gastos' : 'Balance positivo'}</span>}
            </div>
            <p className="mt-3 max-w-md text-[15px] leading-7 text-[#57534e]">El resultado de tus ingresos y egresos durante el período que elegiste.</p>
            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              <div className="border border-[#d6d3d1] bg-[#fafaf9] p-4"><div className="flex items-center gap-2 text-[13px] text-[#57534e]"><ArrowDownLeft size={14} className="text-[#78716c]" /> Ingresos</div><p className="mt-2 text-lg font-semibold">{loading ? '—' : formatCurrency(summary?.ingresos_mes)}</p></div>
              <div className="border border-[#d6d3d1] bg-[#fafaf9] p-4"><div className="flex items-center gap-2 text-[13px] text-[#57534e]"><ArrowUpRight size={14} className="text-[#ca8a04]" /> Egresos</div><p className="mt-2 text-lg font-semibold">{loading ? '—' : formatCurrency(summary?.egresos_mes)}</p></div>
            </div>
          </div>
        </div>
        <div className="relative flex flex-col justify-between gap-8 border-t border-[#e7e5e4] bg-[#fafaf9] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
          <div><p className="text-[13px] font-semibold text-[#57534e]">Uso de tus ingresos</p><div className="mt-4 flex items-end justify-between gap-3"><p className="thought-serif text-4xl font-bold tracking-tight text-[#1c1917]">{loading ? '—' : `${summary?.porcentaje_gastado ?? '0.00'}%`}</p><p className="pb-1 text-[13px] text-[#a8a29e]">del mes gastado</p></div><div className="mt-4 h-1 overflow-hidden bg-[#e7e5e4]"><div className="h-full bg-[#78716c] transition-[width] duration-500" style={{ width: loading ? '0%' : `${spent}%` }} /></div><p className="mt-3 text-[13px] leading-5 text-[#57534e]">{isNegative ? 'Tus egresos superan tus ingresos este mes.' : 'Mantén este ritmo para cuidar tu balance.'}</p></div>
          <Link to={`/egresos/nuevo?${query}`} className="thought-focus inline-flex min-h-12 items-center justify-between border border-[#78716c] bg-[#78716c] px-5 py-3 text-[15px] font-semibold text-[#fafaf9] hover:bg-[#57534e]"><span className="inline-flex items-center gap-2"><Plus size={17} /> Registrar egreso</span><span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  )
}
