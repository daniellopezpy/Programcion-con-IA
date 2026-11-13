import { useId } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, ChevronRight, List } from 'lucide-react'
import { categoryLabel } from '@/lib/category-label'
import { formatCurrency, formatearFecha, monthName } from '@/lib/utils'
import './activity.css'

const years = Array.from({ length: 101 }, (_, index) => 2100 - index)
const months = Array.from({ length: 12 }, (_, index) => index + 1)

export function ActivityHeading({ title, description, children }) {
  return (
    <header className="activity-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  )
}

export function ActivityMonthlyTotal({ type, amount, loading, error }) {
  const titleId = useId()
  const isExpense = type === 'egreso'
  const Icon = isExpense ? ArrowUpRight : ArrowDownLeft

  return (
    <section className="activity-monthly-overview" aria-labelledby={titleId}>
      <div>
        <h2 id={titleId}>{isExpense ? 'Total de egresos del mes' : 'Total de ingresos del mes'}</h2>
        <div role="status">
          {loading ? <p>Consultando el total…</p>
            : error ? <p>No pudimos cargar el total.</p>
              : <p className="activity-monthly-total">{formatCurrency(amount)}</p>}
        </div>
      </div>
      <span className="activity-icon" data-expense={isExpense} aria-hidden="true"><Icon size={21} strokeWidth={1.8} /></span>
    </section>
  )
}

export function ActivityPeriod({ period, onChange, showPeriodName = true }) {
  const labelId = useId()

  return (
    <section className="activity-period" aria-label="Filtrar por período">
      {showPeriodName && (
        <div className="activity-period-name">
          <CalendarDays size={19} aria-hidden="true" />
          <div>
            <p>Período</p>
            <p>{monthName(period.mes)} {period.anio}</p>
          </div>
        </div>
      )}
      <div className="activity-period-fields">
        <label>
          <span id={`${labelId}-month`}>Mes</span>
          <span className="activity-period-select">
            <select aria-labelledby={`${labelId}-month`} value={period.mes} onChange={(event) => onChange('mes', event.target.value)}>
              {months.map((month) => <option key={month} value={month}>{monthName(month)}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </label>
        <label>
          <span id={`${labelId}-year`}>Año</span>
          <span className="activity-period-select">
            <select aria-labelledby={`${labelId}-year`} value={period.anio} onChange={(event) => onChange('anio', event.target.value)}>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </label>
      </div>
    </section>
  )
}

export function ActivityRow({ item, type, actions, badge, showDate = true, onOpen }) {
  const isExpense = type === 'egreso'
  const Icon = isExpense ? ArrowUpRight : ArrowDownLeft
  const description = isExpense ? item.descripcion : item.fuente
  const category = [item.categoria?.nombre, item.subcategoria?.nombre].filter(Boolean).map(categoryLabel).join(' · ')
  const amount = Number(item.monto)

  const content = (
    <>
      <span className="activity-icon" data-expense={isExpense} aria-hidden="true"><Icon size={19} /></span>
      <span className="activity-row-copy">
        <span className="activity-row-primary">{description}</span>
        {category && <span className="activity-row-category">{category}</span>}
        {badge}
      </span>
      <span className="activity-row-amount" data-expense={isExpense}>
        <span className="activity-row-primary">{isExpense ? formatCurrency(-amount) : `+${formatCurrency(amount)}`}</span>
        {showDate && <time dateTime={item.fecha}>{formatearFecha(item.fecha)}</time>}
      </span>
    </>
  )

  if (onOpen) {
    return (
      <li className="activity-row activity-row-interactive">
        <button type="button" className="activity-row-button" aria-haspopup="dialog" onClick={onOpen}>
          {content}
          <ChevronRight className="activity-row-chevron" size={16} aria-hidden="true" />
        </button>
      </li>
    )
  }

  return (
    <li className={actions ? 'activity-row activity-row-with-actions' : 'activity-row'}>
      {content}
      {actions && <div className="activity-row-actions">{actions}</div>}
    </li>
  )
}

export function ActivityList({ type, items, loading, error, title, emptyTitle, emptyDescription, renderActions, renderBadge, children }) {
  const headingId = useId()
  const isExpense = type === 'egreso'
  const plural = isExpense ? 'egresos' : 'ingresos'
  const count = items.length
  const defaultTitle = isExpense ? 'Egresos del período' : 'Ingresos del período'

  return (
    <section className="activity-list" aria-labelledby={headingId} aria-busy={loading}>
      <header>
        <h2 id={headingId}>{title ?? defaultTitle}</h2>
        {!error && <p>{loading ? 'Cargando…' : `${count} ${count === 1 ? type : plural}`}</p>}
      </header>

      {loading && (
        <div className="activity-skeleton" aria-hidden="true">
          {[1, 2, 3].map((row) => <span key={row} />)}
        </div>
      )}

      {!loading && !error && count === 0 && (
        <div className="activity-empty">
          <span className="activity-icon" aria-hidden="true"><List size={21} /></span>
          <h3>{emptyTitle ?? `Todavía no hay ${plural}`}</h3>
          <p>{emptyDescription ?? `Los ${plural} de este mes aparecerán aquí.`}</p>
          {children}
        </div>
      )}

      {!loading && !error && count > 0 && (
        <ul className="activity-feed" role="list">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} type={type} actions={renderActions?.(item)} badge={renderBadge?.(item)} />
          ))}
        </ul>
      )}
    </section>
  )
}
