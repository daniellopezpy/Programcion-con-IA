import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export function DashboardMetricCard({ label, amount, icon: Icon, tone = 'neutral', loading, to }) {
  const toneClass = tone === 'positive'
    ? 'bg-[#c5ed83]/10 text-[#c5ed83]'
    : tone === 'negative'
      ? 'bg-[#ff7d8f]/10 text-[#ff9aaa]'
      : tone === 'amber'
        ? 'bg-[#e8bd73]/10 text-[#e8bd73]'
        : 'bg-white/10 text-[#aaa8b5]'

  const card = <Card className={`border-white/10 bg-[#111116] shadow-lg shadow-black/15 ${to ? 'transition hover:-translate-y-0.5 hover:border-[#ae7bff]/50 hover:shadow-[#7f44ca]/10' : ''}`}>
    <CardHeader className="flex-row items-center justify-between gap-3 pb-0"><CardTitle className="text-sm font-medium text-[#aaa8b5]">{label}</CardTitle><span className={`grid size-10 place-items-center rounded-xl ${toneClass}`}><Icon size={18} /></span></CardHeader>
    <CardContent className="pt-6"><div className="flex items-end justify-between gap-2"><p className="text-2xl font-semibold tracking-tight text-white">{loading ? <span className="inline-block h-7 w-32 animate-pulse rounded bg-white/10" /> : formatCurrency(amount)}</p>{to && <ArrowRight size={16} className="mb-1 text-[#858290] transition group-hover:translate-x-0.5 group-hover:text-[#c5ed83]" />}</div></CardContent>
  </Card>

  return to ? <Link to={to} className="group">{card}</Link> : card
}
