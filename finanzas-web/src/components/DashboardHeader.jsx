import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ActivityPeriod } from '@/components/ActivityList'
import { DashboardWallet } from '@/components/DashboardWallet'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'
import { dateInGuatemala } from '@/lib/period-recap'
import { monthName } from '@/lib/utils'

const todayFormat = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', timeZone: 'America/Guatemala' })

export function DashboardHeader({ balance, savings, loading, expenseRevision }) {
  const { user } = useAuth()
  const { period, setPeriod } = useDashboardPeriod()
  const [periodOpen, setPeriodOpen] = useState(false)
  const firstName = user?.name?.trim().split(/\s+/)[0]
  const periodLabel = `${monthName(period.mes)} ${period.anio}`
  const today = new Date()

  return (
    <div className="saldo-home-intro">
      <header className="saldo-greeting">
        <h1 id="saldo-home-heading" tabIndex={-1} title={firstName}>{firstName ? `Hola, ${firstName}` : 'Inicio'}</h1>
        <time className="saldo-today" dateTime={dateInGuatemala(today)}>
          <strong>Hoy,</strong> {todayFormat.format(today)}
        </time>
        <button type="button" className="saldo-period-toggle" aria-expanded={periodOpen} aria-controls="saldo-home-period" aria-label={`Cambiar período, ${periodLabel}`} onClick={() => setPeriodOpen((open) => !open)}>
          <span>{periodLabel}</span>
          <ChevronDown className="saldo-period-chevron" size={15} aria-hidden="true" />
        </button>
      </header>
      <div className="saldo-home-period" id="saldo-home-period" hidden={!periodOpen}>
        <ActivityPeriod period={period} showPeriodName={false} onChange={(name, value) => setPeriod({ [name]: value })} />
      </div>
      <DashboardWallet name={user?.name} balance={balance} savings={savings} loading={loading} expenseRevision={expenseRevision} />
    </div>
  )
}
