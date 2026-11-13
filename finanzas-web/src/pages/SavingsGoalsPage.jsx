import { useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActivityHeading, ActivityPeriod } from '@/components/ActivityList'
import { DashboardSavingsGoal } from '@/components/DashboardSavingsGoal'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'
import { newOperationId } from '@/lib/utils'

const endpoint = '/dashboard/meta-ahorro'

export function SavingsGoalsPage() {
  const { period, query, setPeriod } = useDashboardPeriod()
  const [operation, setOperation] = useState('')

  return (
    <div className="activity-page mx-auto w-full max-w-3xl">
      <Link to={`/perfil?${query}`} className="activity-back">
        <ChevronLeft size={19} aria-hidden="true" /> Volver al perfil
      </Link>
      <ActivityHeading
        title="Mis metas"
        description="Registra el dinero que apartaste para ver cuánto te falta para tu meta del mes."
      />
      <fieldset className="min-w-0 disabled:opacity-65" disabled={Boolean(operation)}>
        <legend className="sr-only">Período de la meta</legend>
        <ActivityPeriod period={period} onChange={(name, value) => setPeriod({ [name]: value })} />
      </fieldset>
      <SavingsGoalForPeriod
        key={query}
        period={period}
        query={query}
        operation={operation}
        setOperation={setOperation}
      />
    </div>
  )
}

function SavingsGoalForPeriod({ period, query, operation, setOperation }) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  const [mutationError, setMutationError] = useState('')
  const [notice, setNotice] = useState('')
  const pending = useRef(false)
  const attempt = useRef(null)
  const path = `${endpoint}?${query}`
  const currentResult = result?.revision === revision ? result : null
  const data = currentResult?.data

  useEffect(() => {
    let active = true

    api.get(path).then(
      (data) => { if (active) setResult({ revision, data }) },
      (error) => { if (active) setResult({ revision, error: error.message }) },
    )

    return () => { active = false }
  }, [path, revision])

  function retry() {
    setMutationError('')
    setNotice('')
    setRevision((current) => current + 1)
  }

  async function updateGoal(action, amount) {
    if (operation || pending.current || !data) return
    pending.current = true
    setOperation(action)
    setMutationError('')
    setNotice('')

    try {
      if (action === 'delete') {
        await api.delete(path)
        setResult({ revision, data: { ...data, meta: null, monto_apartado: '0.00' } })
        setNotice('Meta eliminada para este período.')
      } else if (action === 'apartar' || action === 'retirar') {
        const key = `${action}:${amount}`
        if (attempt.current?.key !== key) attempt.current = { key, id: newOperationId() }
        const saved = await api.post(`${endpoint}/${data.meta.id}/apartados`, {
          monto: amount, accion: action, operacion: attempt.current.id,
        })
        attempt.current = null
        setResult({ revision, data: saved })
        setNotice(action === 'apartar' ? 'Dinero apartado.' : 'Retiro registrado.')
      } else {
        const saved = await api.put(endpoint, {
          anio: Number(period.anio),
          mes: Number(period.mes),
          monto_objetivo: amount,
        })
        setResult({ revision, data: saved })
        setNotice('Meta guardada para este período.')
      }
    } catch (error) {
      if (error.status === 422) attempt.current = null
      setMutationError(error.errors?.monto?.[0] || error.errors?.meta?.[0] || error.errors?.monto_objetivo?.[0] || error.message)
    } finally {
      pending.current = false
      setOperation('')
    }
  }

  return (
    <DashboardSavingsGoal
      data={data}
      period={period}
      loading={!currentResult}
      error={currentResult?.error || mutationError}
      notice={notice}
      operation={operation}
      onRetry={retry}
      onSave={(amount) => updateGoal('save', amount)}
      onDelete={() => updateGoal('delete')}
      onAdjust={(action, amount) => updateGoal(action, amount)}
    />
  )
}
