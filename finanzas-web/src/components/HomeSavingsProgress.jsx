import { Check, ChevronRight, Coins } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { formatCurrency, monthName } from '@/lib/utils'
import './home-checkins.css'

const percentageFormat = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 2 })

export function HomeSavingsProgress({ result, onRetry }) {
  const { period, query } = useDashboardPeriod()
  const data = result?.data
  const meta = data?.meta
  const allocated = Number(data?.monto_apartado ?? 0)
  const target = Number(meta?.monto_objetivo ?? 0)
  const remaining = Math.max(Math.round((target - allocated) * 100) / 100, 0)
  const reached = meta && remaining === 0
  const progress = target ? Math.min(reached ? 100 : 99.99, Math.max(0, 100 * allocated / target)) : 0

  return (
    <section className="home-checkin home-savings" aria-labelledby="home-savings-title">
      <header className="home-checkin-header">
        <span className="home-checkin-icon"><Coins size={20} strokeWidth={1.8} aria-hidden="true" /></span>
        <div>
          <h2 id="home-savings-title" tabIndex={-1}>Meta de ahorro</h2>
          <p>{monthName(period.mes)} {period.anio}</p>
        </div>
      </header>

      {!result && <p className="home-checkin-note" role="status">Cargando tu meta…</p>}
      {result?.error && (
        <div className="home-checkin-feedback">
          <p role="alert">No pudimos consultar tu meta.</p>
          <button type="button" className="home-checkin-action" onClick={onRetry}>Reintentar</button>
        </div>
      )}
      {data && !meta && <p className="home-checkin-note home-savings-empty">Todavía no tienes una meta para este mes.</p>}
      {meta && (
        <div className="home-savings-overview">
          <div className="home-savings-status">
            <p className="home-savings-percentage"><strong>{percentageFormat.format(progress)}%</strong> de la meta</p>
            {reached ? (
              <p className="home-savings-reached"><Check size={16} aria-hidden="true" /> Meta alcanzada</p>
            ) : (
              <p>Faltan <strong>{formatCurrency(remaining)}</strong></p>
            )}
          </div>
          <progress className="home-savings-meter" value={progress} max="100" aria-label="Avance según el dinero apartado" />
          <dl className="home-savings-totals">
            <div><dt>Dinero apartado</dt><dd>{formatCurrency(allocated)}</dd></div>
            <div><dt>Objetivo</dt><dd>{formatCurrency(meta.monto_objetivo)}</dd></div>
          </dl>
        </div>
      )}
      <Link className="home-checkin-action" to={`/perfil/metas?${query}`}>
        {meta ? 'Apartar dinero' : data ? 'Definir una meta' : 'Ir a Mis metas'} <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </section>
  )
}
