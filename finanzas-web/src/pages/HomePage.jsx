import { useEffect, useRef, useState } from 'react'
import { ArrowDownUp, CalendarClock, CalendarDays, ChartNoAxesColumnIncreasing, ChevronDown, ChevronRight, HandCoins, RefreshCw, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActivityRow } from '@/components/ActivityList'
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardBalancePanel } from '@/components/DashboardBalancePanel'
import { CashOnHandShortcut, QuickExpenseShortcut } from '@/components/HomeMoneyShortcuts'
import { HomePeriodRecap } from '@/components/HomePeriodRecap'
import { HomeSavingsProgress } from '@/components/HomeSavingsProgress'
import { HomeTransactionSheet } from '@/components/HomeTransactionSheet'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'
import { FormField, FormMessage } from '@/components/FormField'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'
import { categoryLabel } from '@/lib/category-label'
import { dateInGuatemala } from '@/lib/period-recap'
import { tomorrowDate, upcomingRecurringPayments } from '@/lib/recurring-payments'
import { useRecurringPayments } from '@/lib/use-recurring-payments'
import { formatCurrency, formatDate, monthName } from '@/lib/utils'

const previewCount = 6
const movementFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'egreso', label: 'Gastos' },
]

function searchText(value = '') {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function matchesSearch({ item, type }, terms, movementType) {
  if (movementType !== 'all' && type !== movementType) return false
  if (!terms.length) return true

  const categories = [item.categoria?.nombre, item.subcategoria?.nombre].filter(Boolean)
  const text = [item.fuente, item.descripcion, ...categories, ...categories.map(categoryLabel)].join(' ')
  const normalized = searchText(text)
  return terms.every((term) => normalized.includes(term))
}

async function loadMovements(query, options) {
  const [incomes, expenses] = await Promise.all([
    api.get(`/ingresos?${query}`, options),
    api.get(`/egresos?${query}`, options),
  ])

  return sortMovements([
    ...incomes.map((item) => ({ item, type: 'ingreso' })),
    ...expenses.map((item) => ({ item, type: 'egreso' })),
  ])
}

function movementDateLabel(date, today) {
  if (date === today) return 'Hoy'
  const [year, month, day] = date.split('-')
  const label = `${Number(day)} de ${monthName(month).toLowerCase()}`
  return year === today.slice(0, 4) ? label : `${label} de ${year}`
}

function sortMovements(items) {
  return items.sort((a, b) => b.item.fecha.localeCompare(a.item.fecha)
    || (b.item.created_at || '').localeCompare(a.item.created_at || ''))
}

function PaymentReminder({ query }) {
  const { user } = useAuth()
  const { payments, error } = useRecurringPayments(user.id)
  const today = dateInGuatemala()
  const due = upcomingRecurringPayments(payments, today, 1)[0]
  const urgent = !error && due && due.date <= tomorrowDate(today)
  return (
    <Link className="saldo-payment-reminder" to={`/analisis?${query}&vista=egresos#saldo-upcoming-title`} state={{ useCurrentAnalyticsPeriod: true }}>
      <CalendarClock size={20} aria-hidden="true" />
      <span><strong>Próximos pagos</strong>{urgent && <time dateTime={due.date}>{due.payment.name} vence {due.date === today ? 'hoy' : 'mañana'}</time>}</span>
      <ChevronRight size={18} aria-hidden="true" />
    </Link>
  )
}

function HomeActivity({ activity, period, movementRevision, onRetry, onMutation }) {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [movementType, setMovementType] = useState('all')
  const [datesOpen, setDatesOpen] = useState(false)
  const [dateRange, setDateRange] = useState(null)
  const [dateError, setDateError] = useState('')
  const [rangeResult, setRangeResult] = useState(null)
  const trigger = useRef(null)
  const heading = useRef(null)
  const searchInput = useRef(null)
  const datesToggle = useRef(null)
  const today = dateInGuatemala()
  const activeRange = expanded ? dateRange : null
  const rangeQuery = activeRange ? new URLSearchParams(activeRange).toString() : ''
  const rangeKey = `${rangeQuery}:${movementRevision}`
  const result = activeRange ? (rangeResult?.key === rangeKey ? rangeResult : null) : activity
  const items = result?.items ?? []
  const terms = searchText(search).split(/\s+/).filter(Boolean)
  const visible = expanded ? items.filter((item) => matchesSearch(item, terms, movementType)) : items.slice(0, previewCount)
  const days = new Map()

  useEffect(() => {
    if (!rangeQuery) return

    const controller = new AbortController()
    loadMovements(rangeQuery, { signal: controller.signal }).then(
      (items) => { if (!controller.signal.aborted) setRangeResult({ key: rangeKey, items }) },
      () => { if (!controller.signal.aborted) setRangeResult({ key: rangeKey, error: 'No pudimos cargar las transacciones de esas fechas.' }) },
    )
    return () => controller.abort()
  }, [rangeQuery, rangeKey])

  for (const movement of visible) {
    const date = movement.item.fecha.slice(0, 10)
    if (!days.has(date)) days.set(date, [])
    days.get(date).push(movement)
  }

  function closeDetail() {
    setSelected(null)
    const focusTarget = trigger.current?.isConnected ? trigger.current : heading.current
    focusTarget?.focus({ preventScroll: true })
    trigger.current = null
  }

  function handleMutation(next, { removed, repeated, refunded } = {}) {
    const inMonth = onMutation(repeated || refunded ? null : selected, next)
    const date = next?.item.fecha.slice(0, 10)
    const inPeriod = activeRange ? Boolean(date && date >= activeRange.desde && date <= activeRange.hasta) : inMonth
    const stillVisible = next && inPeriod && (!expanded || matchesSearch(next, terms, movementType))
    const label = selected.type === 'egreso' ? 'Gasto' : 'Ingreso'
    if (refunded) {
      setNotice(`Devolución de ${formatCurrency(next.item.monto)} registrada como ingreso el ${formatDate(date)}.`)
      return false
    }
    if (repeated) {
      setNotice(`${label} repetido. El nuevo movimiento quedó registrado el ${formatDate(date)}.`)
      return false
    }
    if (stillVisible) {
      setSelected(next)
    } else {
      trigger.current = null
    }
    if (removed) {
      setNotice(removed === 'missing' ? 'Esta transacción ya se había eliminado.' : `${label} eliminado.`)
    } else if (!inPeriod) {
      const [year, month] = next.item.fecha.split('-')
      setNotice(`${label} guardado en ${monthName(month).toLowerCase()} de ${year}.`)
    } else if (!stillVisible) {
      setNotice(`${label} actualizado.`)
    }
    return Boolean(stillVisible)
  }

  function applyDates(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const desde = fields.get('desde')
    const hasta = fields.get('hasta')
    if (!desde || !hasta) {
      setDateError('Elige ambas fechas para aplicar el rango.')
      return
    }
    if (hasta < desde) {
      setDateError('La fecha final debe ser igual o posterior a la inicial.')
      return
    }
    setDateError('')
    setDateRange({ desde, hasta })
    setDatesOpen(false)
    datesToggle.current?.focus({ preventScroll: true })
  }

  function clearDates() {
    setDateRange(null)
    setDateError('')
  }

  return (
    <section className="saldo-recent" aria-labelledby="saldo-recent-title">
      <header className="saldo-recent-header">
        <h2 id="saldo-recent-title" ref={heading} tabIndex={-1}>Transacciones</h2>
        <button type="button" aria-expanded={expanded} aria-controls="saldo-recent-list" onClick={() => {
          if (expanded) {
            setSearch('')
            setMovementType('all')
            setDatesOpen(false)
            clearDates()
          }
          setExpanded(!expanded)
        }}>
          {expanded ? 'Ver recientes' : 'Ver todas'}
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </header>
      <p className="saldo-transaction-notice" role="status">{notice}</p>
      <div id="saldo-recent-list" className="saldo-recent-body">
        {expanded && (
          <div className="saldo-transaction-filters" role="search" aria-label="Buscar transacciones">
            <div className="saldo-transaction-searchbox">
              <Search size={19} aria-hidden="true" />
              <label htmlFor="saldo-transaction-search" className="sr-only">Buscar por nombre o categoría</label>
              <input id="saldo-transaction-search" ref={searchInput} type="search" value={search}
                onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o categoría" />
              {search && <button type="button" aria-label="Borrar búsqueda" onClick={() => { setSearch(''); searchInput.current?.focus() }}><X size={17} aria-hidden="true" /></button>}
            </div>
            <div className="saldo-transaction-toolbar">
              <div className="saldo-transaction-types" role="group" aria-label="Tipo de movimiento">
                {movementFilters.map(({ value, label }) => (
                  <button key={value} type="button" aria-pressed={movementType === value} onClick={() => setMovementType(value)}>{label}</button>
                ))}
              </div>
              <button type="button" ref={datesToggle} className="saldo-transaction-dates-toggle" aria-expanded={datesOpen} aria-controls="saldo-transaction-date-form"
                onClick={() => setDatesOpen((open) => !open)}>
                <CalendarDays size={16} aria-hidden="true" /> Fechas <ChevronDown size={14} aria-hidden="true" />
              </button>
            </div>
            <form id="saldo-transaction-date-form" className="saldo-transaction-dates" hidden={!datesOpen}
              onSubmit={applyDates} onReset={clearDates} onChange={() => setDateError('')}>
              <FormField id="saldo-transaction-from" name="desde" className="activity-form-field" label="Desde" type="date" />
              <FormField id="saldo-transaction-to" name="hasta" className="activity-form-field" label="Hasta" type="date" />
              <div className="saldo-transaction-filter-actions">
                <Button type="submit" size="sm" variant="secondary">Aplicar fechas</Button>
                <Button type="reset" size="sm" variant="ghost">Quitar fechas</Button>
              </div>
              <FormMessage>{dateError}</FormMessage>
            </form>
            <div className="saldo-transaction-filter-summary">
              <p role="status">
                {activeRange ? `${formatDate(activeRange.desde)} – ${formatDate(activeRange.hasta)}` : `${monthName(period.mes)} ${period.anio}`}
                {result && !result.error && ` · ${visible.length} ${visible.length === 1 ? 'resultado' : 'resultados'}`}
              </p>
              {activeRange && !datesOpen && (
                <button type="reset" form="saldo-transaction-date-form" onClick={() => datesToggle.current?.focus({ preventScroll: true })}>Quitar fechas</button>
              )}
            </div>
          </div>
        )}
        {!result && <p className="saldo-recent-status" role="status">Cargando transacciones…</p>}
        {result?.error && <div className="saldo-recent-status"><p role="alert">{result.error}</p><Button size="sm" variant="secondary" onClick={onRetry}>Reintentar</Button></div>}
        {result && !result.error && visible.length === 0 && (
          <p className="saldo-recent-status saldo-recent-empty"><ArrowDownUp size={20} aria-hidden="true" />
            {expanded && (terms.length > 0 || activeRange || movementType !== 'all') ? 'No encontramos transacciones con esos filtros.' : 'Todavía no hay transacciones este mes.'}
          </p>
        )}
        {Array.from(days, ([date, movements]) => (
          <div key={date} className="saldo-recent-day" data-today={date === today}>
            <h3><time dateTime={date}>{movementDateLabel(date, today)}</time>{date === today && <span>{formatDate(date)}</span>}</h3>
            <ul className="activity-feed" role="list">
              {movements.map((movement) => (
                <ActivityRow
                  key={`${movement.type}-${movement.item.id}`}
                  item={movement.item}
                  type={movement.type}
                  showDate={false}
                  onOpen={(event) => {
                    trigger.current = event.currentTarget
                    setNotice('')
                    setSelected(movement)
                  }}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <HomeTransactionSheet transaction={selected} onClose={closeDetail} onMutation={handleMutation} />
    </section>
  )
}

export function HomePage() {
  const { period, query } = useDashboardPeriod()
  const [quickExpense, setQuickExpense] = useState(null)
  const [overview, setOverview] = useState(null)
  const [savings, setSavings] = useState(null)
  const [activity, setActivity] = useState(null)
  const [reload, setReload] = useState(0)
  const requestKey = `${query}:${reload}`
  const currentOverview = overview?.key === requestKey ? overview : null
  const currentSavings = savings?.key === requestKey ? savings : null
  const currentActivity = activity?.query === query ? activity : null

  useEffect(() => {
    let active = true

    api.get(`/dashboard/resumen?${query}`)
      .then((summary) => {
        if (active) setOverview({ key: requestKey, summary })
      })
    api.get(`/dashboard/meta-ahorro?${query}`).then(
      (data) => { if (active) setSavings({ key: requestKey, data }) },
      () => { if (active) setSavings({ key: requestKey, error: true }) },
    )
      .catch((error) => {
        if (active) setOverview({ key: requestKey, error: error.message })
      })

    loadMovements(query)
      .then((items) => { if (active) setActivity({ query, items }) })
      .catch((error) => {
        if (active) setActivity((current) => ({ query, items: current?.query === query ? current.items : undefined, error: error.message }))
      })

    return () => { active = false }
  }, [query, requestKey])

  const summary = currentOverview?.summary
  const retry = () => setReload((current) => current + 1)

  function refreshMovement(previous, next) {
    const [year, month] = next?.item.fecha.split('-') ?? []
    const inPeriod = Number(year) === Number(period.anio) && Number(month) === Number(period.mes)
    const changed = previous ?? next
    setActivity((current) => {
      if (current?.query !== query || !current.items) return current
      const items = current.items.filter(({ type, item }) => type !== changed.type || item.id !== changed.item.id)
      if (inPeriod) items.push(next)
      return { query, items: sortMovements(items) }
    })
    setQuickExpense(null)
    retry()
    return inPeriod
  }

  return (
    <div className="saldo-home">
      <DashboardHeader balance={summary?.balance_mes} savings={currentSavings?.data} loading={!currentOverview} expenseRevision={reload} />
      <FormMessage>{currentOverview?.error}</FormMessage>
      {currentOverview?.error && <Button variant="secondary" size="sm" className="w-fit" onClick={retry}><RefreshCw size={14} /> Reintentar</Button>}

      <nav className="saldo-shortcuts" aria-label="Accesos rápidos">
        <Link className="saldo-shortcut saldo-shortcut-analysis" data-tour="analysis" to={`/analisis?${query}`} state={{ useCurrentAnalyticsPeriod: true }}>
          <span className="saldo-shortcut-icon"><ChartNoAxesColumnIncreasing size={20} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="saldo-shortcut-label">Análisis</span>
        </Link>
        <QuickExpenseShortcut onSaved={(expense) => { setQuickExpense(expense); retry() }} />
        <CashOnHandShortcut />
        <Link className="saldo-shortcut saldo-shortcut-planning" to={`/por-cobrar?${query}`}>
          <span className="saldo-shortcut-icon"><HandCoins size={20} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="saldo-shortcut-label">Por cobrar</span>
        </Link>
        <Link className="saldo-shortcut saldo-shortcut-planning" to={`/pagos-recurrentes?${query}`}>
          <span className="saldo-shortcut-icon"><CalendarClock size={20} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="saldo-shortcut-label">Pagos recurrentes</span>
        </Link>
      </nav>
      {quickExpense && <p className="text-sm font-semibold text-[var(--saldo-forest)]" role="status">Gasto hormiga de {formatCurrency(quickExpense.monto)} registrado.</p>}
      <PaymentReminder query={query} />

      <HomeActivity key={query} activity={currentActivity} period={period} movementRevision={reload} onRetry={retry} onMutation={refreshMovement} />
      <DashboardBalancePanel summary={summary} loading={!currentOverview} query={query} />
      <HomePeriodRecap movementRevision={reload} />
      <HomeSavingsProgress result={currentSavings} onRetry={retry} />
    </div>
  )
}
