import { useEffect, useState } from 'react'
import { CalendarCheck, ChevronRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DownloadMovements } from '@/components/DownloadMovements'
import { useAuth } from '@/context/useAuth'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'
import { dateInGuatemala, recentClosedPeriod, sumPeriodAmounts } from '@/lib/period-recap'
import { getSaldoPreferences } from '@/lib/saldo-preferences'
import { formatCurrency, monthName } from '@/lib/utils'
import './home-checkins.css'

function hasDismissed(key) {
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

async function loadRecap(period, query) {
  if (period.kind === 'month') {
    const result = await api.get(`/dashboard/resumen?${query}`)
    return { income: result.ingresos_mes, expenses: result.egresos_mes, balance: result.balance_mes }
  }

  const [incomes, expenses] = await Promise.all([api.get(`/ingresos?${query}`), api.get(`/egresos?${query}`)])
  const incomeCents = sumPeriodAmounts(incomes, period)
  const expenseCents = sumPeriodAmounts(expenses, period)
  return { income: incomeCents / 100, expenses: expenseCents / 100, balance: (incomeCents - expenseCents) / 100 }
}

export function HomePeriodRecap({ movementRevision = 0 }) {
  const { user } = useAuth()
  const userId = user.id
  const [cadence, setCadence] = useState(() => getSaldoPreferences(userId).cadence)

  useEffect(() => {
    function updateCadence(event) {
      if (event.detail === String(userId)) setCadence(getSaldoPreferences(userId).cadence)
    }
    window.addEventListener('saldo:preferences-updated', updateCadence)
    return () => window.removeEventListener('saldo:preferences-updated', updateCadence)
  }, [userId])

  const period = recentClosedPeriod(dateInGuatemala(), cadence)

  const created = new Date(user.created_at)
  if (!Number.isNaN(created.getTime()) && dateInGuatemala(created) > period.end) return null

  const storageKey = `saldo.period-recap:${userId}:${period.end}`
  return <RecapCard key={storageKey} period={period} storageKey={storageKey} movementRevision={movementRevision} />
}

function RecapCard({ period, storageKey, movementRevision }) {
  const { query: homeQuery } = useDashboardPeriod()
  const [dismissed, setDismissed] = useState(() => hasDismissed(storageKey))
  const [request, setRequest] = useState(null)
  const [revision, setRevision] = useState(0)
  const { kind, year, month: monthNumber, start, end } = period
  const query = new URLSearchParams({ anio: year, mes: monthNumber }).toString()
  const month = monthName(monthNumber).toLowerCase()
  const endDay = Number(end.slice(-2))
  const dateLabel = `Del 1 al ${endDay} de ${month} de ${year}`
  const heading = kind === 'month' ? `Cierre de ${month}` : 'Cierre de la primera quincena'

  useEffect(() => {
    if (dismissed) return

    let active = true
    loadRecap({ kind, start, end }, query).then(
      (data) => { if (active) setRequest({ revision, movementRevision, data }) },
      () => { if (active) setRequest({ revision, movementRevision, error: true }) },
    )
    return () => { active = false }
  }, [dismissed, kind, start, end, query, revision, movementRevision])

  function dismiss() {
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // Dismiss the card for the current page even when storage is unavailable.
    }
    setDismissed(true)
  }

  if (dismissed) return null
  const result = request?.revision === revision && request.movementRevision === movementRevision ? request : null
  const data = result?.data

  return (
    <section className="home-checkin home-recap" aria-labelledby="home-recap-title">
      <header className="home-checkin-header">
        <span className="home-checkin-icon"><CalendarCheck size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="home-recap-title">{heading}</h2>
          <p>{dateLabel}</p>
        </div>
        <button className="home-checkin-dismiss" type="button" aria-label="Ocultar este cierre" onClick={() => {
          dismiss()
          document.getElementById('home-savings-title')?.focus()
        }}><X size={18} aria-hidden="true" /></button>
      </header>
      {!result && <p className="home-checkin-note" role="status">Calculando tu cierre…</p>}
      {result?.error && (
        <div className="home-checkin-feedback">
          <p role="alert">No pudimos cargar el cierre.</p>
          <button type="button" className="home-checkin-action" onClick={() => setRevision((count) => count + 1)}>Reintentar</button>
        </div>
      )}
      {data && (
        <>
          <dl className="home-recap-totals">
            <div className="home-recap-balance"><dt>Saldo del período</dt><dd data-negative={Number(data.balance) < 0}>{formatCurrency(data.balance)}</dd></div>
            <div><dt>Ingresos</dt><dd>{formatCurrency(data.income)}</dd></div>
            <div><dt>Gastos</dt><dd>{formatCurrency(data.expenses)}</dd></div>
          </dl>
          {Number(data.income) === 0 && Number(data.expenses) === 0 && <p className="home-checkin-note">No hay movimientos registrados en estas fechas.</p>}
          <div className="flex flex-wrap items-start gap-2">
            <Link className="home-checkin-action" to={`/analisis?${homeQuery}`} state={{ analyticsPeriod: { anio: year, mes: monthNumber } }} onClick={dismiss}>
              Ver análisis del mes <ChevronRight size={16} aria-hidden="true" />
            </Link>
            <DownloadMovements key={end} query={new URLSearchParams({ desde: start, hasta: end }).toString()} filename={`${start}-a-${end}`} />
          </div>
        </>
      )}
    </section>
  )
}
