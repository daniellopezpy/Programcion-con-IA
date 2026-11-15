import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { AnnualEvolutionChart, CategoryExpensesChart } from '@/components/DashboardCharts'
import { DownloadMovements } from '@/components/DownloadMovements'
import { UpcomingPayments } from '@/components/UpcomingPayments'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useGuatemalaToday } from '@/context/recurring-payments'
import { useAuth } from '@/context/useAuth'
import { api } from '@/lib/api'
import { categoryLabel } from '@/lib/category-label'
import { formatCurrency, monthName } from '@/lib/utils'
import { calculateExpenseChange, formatExplicitDateRange, getComparisonRanges } from './analytics-change'
import './analytics-page.css'

const views = [
  { id: 'egresos', label: 'Gastos' },
  { id: 'ingresos', label: 'Ingresos' },
  { id: 'balance', label: 'Balance' },
]

const months = Array.from({ length: 12 }, (_, index) => index + 1)
const years = Array.from({ length: 101 }, (_, index) => 2100 - index)

function readPeriod(candidate, fallback) {
  const anio = Number(candidate?.anio)
  const mes = Number(candidate?.mes)
  return {
    anio: years.includes(anio) ? anio : fallback.anio,
    mes: months.includes(mes) ? mes : fallback.mes,
  }
}

function useAnalyticsRequest(path) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!path) return
    let current = true

    api.get(path).then(
      (data) => { if (current) setResult({ path, revision, data }) },
      () => { if (current) setResult({ path, revision, error: true }) },
    )

    return () => { current = false }
  }, [path, revision])

  const matchingResult = result?.path === path && result.revision === revision ? result : null

  return {
    data: matchingResult?.data,
    loading: Boolean(path) && !matchingResult,
    error: Boolean(path) && Boolean(matchingResult?.error),
    retry: () => setRevision((count) => count + 1),
  }
}

function AnalyticsError({ onRetry, children }) {
  return (
    <section className="saldo-analytics-error" role="alert">
      <p>{children}</p>
      <button type="button" onClick={onRetry}>Volver a intentar</button>
    </section>
  )
}

function MonthlyAmount({ currentMonth, metric, periodLabel, loading }) {
  const showBalance = metric === 'balance'

  return (
    <section className="saldo-analytics-amount" aria-busy={loading}>
      <div>
        <h2>{showBalance ? 'Balance del mes' : 'Ingresos del mes'}</h2>
        <span>{periodLabel}</span>
      </div>
      <p data-negative={!loading && Number(currentMonth?.[metric]) < 0}>
        {loading || !currentMonth ? '—' : formatCurrency(currentMonth[metric])}
      </p>
      {showBalance && currentMonth && (
        <dl>
          <div>
            <dt>Ingresos</dt>
            <dd>{formatCurrency(currentMonth.ingresos)}</dd>
          </div>
          <div>
            <dt>Gastos</dt>
            <dd>{formatCurrency(currentMonth.egresos)}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}

function ExpenseChangeCard({ change, ranges }) {
  if (!change || !ranges) return null

  const direction = change.diffCents > 0 ? 'más' : 'menos'
  const categoryName = categoryLabel(change.name)
  const differenceText = formatCurrency(change.absDiff / 100)
  const headline = `Gastaste ${differenceText} ${direction} en ${categoryName}`
  const currentPeriodLabel = formatExplicitDateRange(
    ranges.current.startDay,
    ranges.current.endDay,
    ranges.current.month,
    ranges.current.year,
  )
  const previousPeriodLabel = formatExplicitDateRange(
    ranges.previous.startDay,
    ranges.previous.endDay,
    ranges.previous.month,
    ranges.previous.year,
  )

  return (
    <section className="saldo-analytics-change" aria-labelledby="saldo-what-changed-heading">
      <div className="saldo-analytics-change-heading">
        <h2 id="saldo-what-changed-heading">Qué cambió</h2>
      </div>
      <p className="saldo-analytics-change-highlight">
        {headline}
      </p>
      <dl className="saldo-analytics-change-periods">
        <div className="saldo-analytics-change-period">
          <dt>{currentPeriodLabel}</dt>
          <dd>{formatCurrency(change.currentCents / 100)}</dd>
        </div>
        <div className="saldo-analytics-change-period">
          <dt>{previousPeriodLabel}</dt>
          <dd>{formatCurrency(change.previousCents / 100)}</dd>
        </div>
      </dl>
    </section>
  )
}

export function AnalyticsPage() {
  const { query: homeQuery } = useDashboardPeriod()
  const { user } = useAuth()
  const { state } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedView = searchParams.get('vista')
  const view = views.find(({ id }) => id === requestedView)?.id ?? 'egresos'
  const todayDateString = useGuatemalaToday()
  const [currentYear, currentMonthNumber] = todayDateString.split('-').map(Number)
  const currentPeriod = { anio: currentYear, mes: currentMonthNumber }
  const [periods, setPeriods] = useState(() => {
    const anio = searchParams.get('anio')
    const mes = searchParams.get('mes')
    const urlPeriod = anio || mes ? { anio, mes } : null
    const linkedPeriod = state?.analyticsPeriod ?? (state?.useCurrentAnalyticsPeriod ? null : urlPeriod)
    return linkedPeriod ? { [view]: readPeriod(linkedPeriod, currentPeriod) } : {}
  })
  const { anio: year, mes: month } = periods[view] ?? currentPeriod
  const query = new URLSearchParams({ anio: year, mes: month }).toString()
  const viewLabel = views.find(({ id }) => id === view).label

  const comparisonRanges = view === 'egresos' ? getComparisonRanges(year, month, todayDateString) : null
  const currentExpensesPath = comparisonRanges
    ? `/egresos?desde=${comparisonRanges.current.desde}&hasta=${comparisonRanges.current.hasta}`
    : null
  const previousExpensesPath = comparisonRanges
    ? `/egresos?desde=${comparisonRanges.previous.desde}&hasta=${comparisonRanges.previous.hasta}`
    : null

  const categories = useAnalyticsRequest(view === 'egresos' ? `/dashboard/egresos-por-categoria?${query}` : null)
  const annual = useAnalyticsRequest(`/dashboard/resumen-anual?anio=${year}`)
  const currentExpenses = useAnalyticsRequest(currentExpensesPath)
  const previousExpenses = useAnalyticsRequest(previousExpensesPath)
  const periodLabel = `${monthName(month)} ${year}`
  const currentMonth = annual.data?.find((item) => Number(item.mes) === month)

  const expenseChange = (!currentExpenses.loading && !previousExpenses.loading && !currentExpenses.error && !previousExpenses.error && comparisonRanges)
    ? calculateExpenseChange(currentExpenses.data, previousExpenses.data, comparisonRanges.current, comparisonRanges.previous)
    : null

  function refreshExpenses() {
    categories.retry()
    annual.retry()
    currentExpenses.retry()
    previousExpenses.retry()
  }

  function changePeriod(field, value) {
    setPeriods((previous) => ({
      ...previous,
      [view]: { ...(previous[view] ?? currentPeriod), [field]: Number(value) },
    }))
  }

  function changeView(nextView) {
    if (nextView === view) return

    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      params.set('vista', nextView)
      return params
    }, { state })
  }

  return (
    <div className="saldo-analytics">
      <header className="saldo-analytics-heading">
        <Link className="saldo-analytics-icon" to={`/?${homeQuery}`} aria-label="Volver al inicio">
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <h1>Análisis</h1>
      </header>

      <div className="saldo-analytics-tabs" role="group" aria-label="Ver análisis de">
        {views.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={view === id} onClick={() => changeView(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="saldo-analytics-period" role="group" aria-label={`Período de ${viewLabel.toLowerCase()}`}>
        <label>
          Mes
          <select value={month} onChange={(event) => changePeriod('mes', event.target.value)}>
            {months.map((option) => <option key={option} value={option}>{monthName(option)}</option>)}
          </select>
        </label>
        <label>
          Año
          <select value={year} onChange={(event) => changePeriod('anio', event.target.value)}>
            {years.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <DownloadMovements key={query} query={query} filename={`${year}-${String(month).padStart(2, '0')}`} />

      <div className="saldo-analytics-grid" key={view}>
        <div className="saldo-analytics-month">
          {view === 'egresos' ? (
            <>
              {categories.error ? (
                <AnalyticsError onRetry={categories.retry}>No pudimos cargar los gastos por categoría.</AnalyticsError>
              ) : (
                <CategoryExpensesChart data={categories.data} loading={categories.loading} period={periodLabel} />
              )}
              <ExpenseChangeCard change={expenseChange} ranges={comparisonRanges} />
            </>
          ) : !annual.error && (
            <MonthlyAmount currentMonth={currentMonth} metric={view} periodLabel={periodLabel} loading={annual.loading} />
          )}
        </div>

        {annual.error ? (
          <AnalyticsError onRetry={annual.retry}>No pudimos cargar los totales por mes.</AnalyticsError>
        ) : (
          <AnnualEvolutionChart data={annual.data} loading={annual.loading} metric={view} month={month} year={year} />
        )}
      </div>
      {view === 'egresos' && (
        <UpcomingPayments key={user.id} userId={user.id} query={homeQuery} onExpenseChange={refreshExpenses} />
      )}
    </div>
  )
}
