import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export function DashboardMetricCard({ label, amount, icon: Icon, tone = 'neutral', loading, to }) {
  const toneClass = tone === 'positive'
    ? 'bg-[#f0fdf4] text-[#65a30d]'
    : tone === 'negative'
      ? 'bg-[#fef2f2] text-[#dc2626]'
      : tone === 'amber'
        ? 'bg-[#fefce8] text-[#ca8a04]'
        : 'bg-[#f5f5f4] text-[#78716c]'

  const card = <Card className={`border-[#e7e5e4] bg-[#fafaf9] ${to ? 'transition hover:border-[#a8a29e]' : ''}`}>
    <CardHeader className="flex-row items-center justify-between gap-3 pb-0"><CardTitle className="text-[15px] font-medium text-[#57534e]">{label}</CardTitle><span className={`grid size-10 place-items-center ${toneClass}`}><Icon size={18} /></span></CardHeader>
    <CardContent className="pt-6"><div className="flex items-end justify-between gap-2"><p className="text-2xl font-semibold tracking-tight text-[#1c1917]">{loading ? <span className="inline-block h-7 w-32 animate-pulse bg-[#efedeb]" /> : formatCurrency(amount)}</p>{to && <ArrowRight size={16} className="mb-1 text-[#a8a29e] transition group-hover:translate-x-0.5 group-hover:text-[#78716c]" />}</div></CardContent>
  </Card>

  return to ? <Link to={to} className="group">{card}</Link> : card
}
