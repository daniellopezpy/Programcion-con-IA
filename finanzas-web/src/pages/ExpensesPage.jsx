import { useEffect, useState } from 'react'
import { CreditCard, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ActivityHeading, ActivityList, ActivityMonthlyTotal, ActivityPeriod } from '@/components/ActivityList'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/FormField'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'
import { api } from '@/lib/api'
import { getCardExpenseIds, getExpenseCard, setCardExpense, subscribeToCardExpenses } from '@/lib/card-expenses'
import { getSaldoPreferences } from '@/lib/saldo-preferences'
import { formatCurrency } from '@/lib/utils'
import './card-expenses.css'

function expenseTotal(expenses) {
  return expenses.reduce((cents, expense) => cents + Math.round(Number(expense.monto) * 100), 0) / 100
}

function CardExpenseSummary({ expenses }) {
  return (
    <section className="card-expenses-summary" aria-labelledby="card-expenses-total">
      <CreditCard size={21} aria-hidden="true" />
      <div>
        <h2 id="card-expenses-total">Total con tarjeta</h2>
        <p className="card-expenses-amount">{formatCurrency(expenseTotal(expenses))}</p>
        <p className="card-expenses-note">Suma los egresos del período que marcaste en este navegador.</p>
      </div>
    </section>
  )
}

export function ExpensesPage() {
  const navigate = useNavigate()
  const { search, state } = useLocation()
  const { period, query, setPeriod } = useDashboardPeriod()
  const { user } = useAuth()
  const userId = user.id
  const showCards = new URLSearchParams(search).get('vista') === 'tarjeta'
  const [result, setResult] = useState(null)
  const [revision, setRevision] = useState(0)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const [cardExpenseIds, setCardExpenseIds] = useState(() => getCardExpenseIds(userId))

  useEffect(() => subscribeToCardExpenses(userId, () => setCardExpenseIds(getCardExpenseIds(userId))), [userId])

  useEffect(() => {
    let active = true
    api.get(`/egresos?${query}`).then(
      (items) => { if (active) setResult({ query, revision, items }) },
      (requestError) => { if (active) setResult({ query, revision, error: requestError.message }) },
    )
    return () => { active = false }
  }, [query, revision])

  const current = result?.query === query && result.revision === revision ? result : null
  const expenses = current?.items ?? []
  const cardExpenses = expenses.filter(({ id }) => cardExpenseIds.has(String(id)))
  const { cards } = getSaldoPreferences(userId)
  const filterSuffix = showCards ? '&vista=tarjeta' : ''
  const allExpensesUrl = `/egresos?${query}`
  const newExpenseUrl = `/egresos/nuevo?${query}${filterSuffix}`

  async function deleteExpense(expense) {
    const accepted = window.confirm(`¿Eliminar el egreso “${expense.descripcion}”?`)
    if (!accepted) return
    setNotice('')
    setDeleteError('')
    try {
      await api.delete(`/egresos/${expense.id}`)
      setCardExpense(userId, expense.id, false)
      setNotice('El egreso se eliminó correctamente.')
      setRevision((currentRevision) => currentRevision + 1)
    } catch (requestError) {
      setDeleteError(requestError.message)
    }
  }

  return (
    <div className="activity-page">
      <ActivityHeading title="Egresos" description="Revisa y organiza tus gastos.">
        <Button className="w-full sm:w-auto" onClick={() => navigate(newExpenseUrl)}>
          <Plus size={17} aria-hidden="true" /> Nuevo egreso
        </Button>
      </ActivityHeading>
      <ActivityMonthlyTotal type="egreso" amount={expenseTotal(expenses)} loading={!current} error={current?.error} />
      <ActivityPeriod period={period} onChange={(name, value) => setPeriod({ [name]: value })} />

      {notice && <FormMessage tone="success">{notice}</FormMessage>}
      {deleteError && <FormMessage>{deleteError}</FormMessage>}
      {state?.cardSaveError && (
        <FormMessage>El egreso se guardó. No pudimos guardar la marca de tarjeta en este navegador.</FormMessage>
      )}
      {current?.error && (
        <div className="grid gap-2">
          <FormMessage>{current.error}</FormMessage>
          <Button variant="secondary" className="w-fit" onClick={() => setRevision((currentRevision) => currentRevision + 1)}>
            <RefreshCw size={16} aria-hidden="true" /> Reintentar
          </Button>
        </div>
      )}

      <div className="card-expenses-view">
        <nav className="card-expenses-filter" aria-label="Filtrar egresos">
          <Link to={allExpensesUrl} aria-current={!showCards ? 'page' : undefined}>Todos</Link>
          <Link to={`${allExpensesUrl}&vista=tarjeta`} aria-current={showCards ? 'page' : undefined}>
            <CreditCard size={17} aria-hidden="true" /> Con tarjeta
          </Link>
        </nav>
        {showCards && current?.items && <CardExpenseSummary expenses={cardExpenses} />}
        <ActivityList
          type="egreso"
          items={showCards ? cardExpenses : expenses}
          loading={!current}
          error={current?.error}
          title={showCards ? 'Gastos con tarjeta' : undefined}
          emptyTitle={showCards ? 'Aún no hay gastos con tarjeta' : undefined}
          emptyDescription={showCards ? 'Marca «Pagué con tarjeta» al registrar o editar un egreso.' : undefined}
          renderBadge={(expense) => {
            if (!cardExpenseIds.has(String(expense.id))) return null
            const label = cards.find(({ id }) => id === getExpenseCard(userId, expense.id))?.label
            return (label || !showCards) && <span className="card-expense-badge"><CreditCard size={13} aria-hidden="true" /> {label || 'Tarjeta'}</span>
          }}
          renderActions={(expense) => (
            <>
              <Link
                className="activity-action"
                to={`/egresos/${expense.id}/editar?${query}${filterSuffix}`}
                aria-label={`Editar ${expense.descripcion}`}
              >
                <Pencil size={16} aria-hidden="true" />
                <span>Editar</span>
              </Link>
              <button
                type="button"
                className="activity-action activity-action-danger"
                aria-label={`Eliminar ${expense.descripcion}`}
                onClick={() => deleteExpense(expense)}
              >
                <Trash2 size={17} aria-hidden="true" />
                <span>Eliminar</span>
              </button>
            </>
          )}
        >
          {showCards && expenses.length > 0 ? (
            <Link className="activity-action" to={allExpensesUrl}>Ver todos los egresos</Link>
          ) : (
            <Button onClick={() => navigate(newExpenseUrl)}>
              <Plus size={16} aria-hidden="true" /> Registrar primer egreso
            </Button>
          )}
        </ActivityList>
      </div>
    </div>
  )
}
