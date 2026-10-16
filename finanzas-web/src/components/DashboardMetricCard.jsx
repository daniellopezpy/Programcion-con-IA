import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export function DashboardMetricCard({ label, amount, icon: Icon, tone = 'neutral', loading, to }) {
  const toneClass = tone === 'positive'
    ? 'bg-[#e8f4e4] text-[#287152]'
    : tone === 'negative'
      ? 'bg-[#fae9e6] text-[#ad554a]'
      : tone === 'amber'
        ? 'bg-[#fbf1dc] text-[#ad7924]'
        : 'bg-[#eef1eb] text-[#647a6d]'

  const card = <Card className={to ? 'transition hover:-translate-y-0.5 hover:border-[#cbdcca] hover:shadow-md' : ''}>
    <CardHeader className="flex-row items-center justify-between gap-3 pb-0"><CardTitle className="text-sm font-medium text-[#718078]">{label}</CardTitle><span className={`grid size-10 place-items-center rounded-xl ${toneClass}`}><Icon size={18} /></span></CardHeader>
    <CardContent className="pt-6"><div className="flex items-end justify-between gap-2"><p className="text-2xl font-semibold tracking-tight text-[#20382d]">{loading ? <span className="inline-block h-7 w-32 animate-pulse rounded bg-[#edf1ea]" /> : formatCurrency(amount)}</p>{to && <ArrowRight size={16} className="mb-1 text-[#91a098] transition group-hover:translate-x-0.5 group-hover:text-[#285541]" />}</div></CardContent>
  </Card>

  return to ? <Link to={to} className="group">{card}</Link> : card
}
