import { ArrowDownLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { formatCurrency, monthName } from '@/lib/utils'
import './dashboard-wallet.css'

const percent = new Intl.NumberFormat('es-GT', { style: 'percent', maximumFractionDigits: 1 })

function displayAmount(amount) {
  return amount == null ? '—' : formatCurrency(amount)
}

export function DashboardBalancePanel({ summary, loading, query }) {
  const { period } = useDashboardPeriod()
  const periodLabel = `${monthName(period.mes)} ${period.anio}`
  const expenseRatio = Number(summary?.ingresos_mes) > 0 && summary.porcentaje_gastado != null
    ? percent.format(Number(summary.porcentaje_gastado) / 100)
    : null

  return (
    <section className="saldo-monthly-summary" aria-labelledby="monthly-movements-heading" aria-busy={loading}>
      <header>
        <h2 id="monthly-movements-heading">Ingresos y gastos</h2>
        <p>{periodLabel}</p>
      </header>
      <div className="saldo-monthly-totals">
        <MovementTotal title="Ingresos" amount={summary?.ingresos_mes} icon={ArrowDownLeft} to={`/ingresos?${query}`} />
        <MovementTotal title="Gastos" amount={summary?.egresos_mes} icon={ArrowUpRight} to={`/egresos?${query}`} />
      </div>
      <dl className="saldo-monthly-balances">
        <div className="saldo-monthly-accumulated">
          <dt>Saldo acumulado del año <small>Hasta {monthName(period.mes).toLowerCase()}</small></dt>
          <dd data-negative={Number(summary?.balance_acumulado) < 0}>{displayAmount(summary?.balance_acumulado)}</dd>
        </div>
      </dl>
      {expenseRatio && <p className="saldo-monthly-context">Tus gastos equivalen al <strong>{expenseRatio}</strong> de tus ingresos del mes.</p>}
    </section>
  )
}

function MovementTotal({ title, amount, icon: Icon, to }) {
  return (
    <Link to={to} className="saldo-monthly-link">
      <Icon size={17} aria-hidden="true" />
      <span>{title}</span>
      <strong>{displayAmount(amount)}</strong>
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  )
}
