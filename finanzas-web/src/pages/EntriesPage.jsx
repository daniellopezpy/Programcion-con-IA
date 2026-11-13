import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ActivityHeading, ActivityList, ActivityMonthlyTotal, ActivityPeriod } from '@/components/ActivityList'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/FormField'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function EntriesPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { period, query, setPeriod } = useDashboardPeriod()
  const newIncomeUrl = `/ingresos/nuevo?${query}`
  const deleteDialog = useRef(null)
  const cancelDeleteButton = useRef(null)
  const newIncomeButton = useRef(null)
  const [entriesResult, setEntriesResult] = useState(null)
  const [overviewResult, setOverviewResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [incomeToDelete, setIncomeToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteNotice, setDeleteNotice] = useState(null)
  const requestKey = `${query}:${attempt}`
  const currentEntries = entriesResult?.key === requestKey ? entriesResult : null
  const currentOverview = overviewResult?.key === requestKey ? overviewResult : null

  useEffect(() => {
    let active = true

    api.get(`/ingresos?${query}`).then(
      (data) => { if (active) setEntriesResult({ key: requestKey, data }) },
      (error) => { if (active) setEntriesResult({ key: requestKey, error: error.message }) },
    )

    api.get(`/dashboard/resumen?${query}`).then(
      (data) => {
        if (!active) return
        setOverviewResult(data?.ingresos_mes != null ? { key: requestKey, data } : { key: requestKey, error: true })
      },
      () => { if (active) setOverviewResult({ key: requestKey, error: true }) },
    )

    return () => { active = false }
  }, [query, requestKey])

  function updatePeriod(name, value) {
    setPeriod({ [name]: value })
  }

  function requestDelete(income) {
    setIncomeToDelete(income)
    setDeleteError('')
    deleteDialog.current.showModal()
    cancelDeleteButton.current?.focus()
  }

  async function deleteIncome(event) {
    event.preventDefault()
    if (!incomeToDelete || deleting) return

    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/ingresos/${incomeToDelete.id}`)
      setDeleteNotice({ query, text: 'Ingreso eliminado.' })
    } catch (error) {
      if (error.status !== 404) {
        setDeleteError('No pudimos eliminar el ingreso. Vuelve a intentarlo.')
        return
      }
      setDeleteNotice({ query, text: 'Este ingreso ya se había eliminado.' })
    } finally {
      setDeleting(false)
    }

    setAttempt((count) => count + 1)
    deleteDialog.current?.close()
    newIncomeButton.current?.focus({ preventScroll: true })
  }

  return (
    <div className="activity-page">
      <ActivityHeading title="Ingresos" description="Revisa y organiza el dinero que recibes.">
        <Button ref={newIncomeButton} className="w-full sm:w-auto" onClick={() => navigate(newIncomeUrl)}>
          <Plus size={17} aria-hidden="true" /> Nuevo ingreso
        </Button>
      </ActivityHeading>
      <ActivityMonthlyTotal
        type="ingreso"
        amount={currentOverview?.data?.ingresos_mes}
        loading={!currentOverview}
        error={currentOverview?.error}
      />
      <ActivityPeriod period={period} onChange={updatePeriod} />

      {deleteNotice?.query === query
        ? <FormMessage tone="success">{deleteNotice.text}</FormMessage>
        : state?.incomeSaved && <FormMessage tone="success">{state.incomeSaved}</FormMessage>}
      {(currentEntries?.error || currentOverview?.error) && (
        <div className="grid gap-2">
          <FormMessage>{currentEntries?.error}</FormMessage>
          <Button variant="secondary" className="w-fit" onClick={() => setAttempt((count) => count + 1)}>
            <RefreshCw size={16} /> Reintentar
          </Button>
        </div>
      )}

      <ActivityList
        type="ingreso"
        items={currentEntries?.data ?? []}
        loading={!currentEntries}
        error={currentEntries?.error}
        renderActions={(income) => (
          <>
            <Link
              className="activity-action"
              to={`/ingresos/${income.id}/editar?${query}`}
              aria-label={`Editar ${income.fuente}`}
            >
              <Pencil size={16} aria-hidden="true" />
              <span>Editar</span>
            </Link>
            <button
              type="button"
              className="activity-action activity-action-danger"
              aria-label={`Eliminar ${income.fuente}`}
              aria-haspopup="dialog"
              onClick={() => requestDelete(income)}
            >
              <Trash2 size={17} aria-hidden="true" />
              <span>Eliminar</span>
            </button>
          </>
        )}
      />
      <dialog
        ref={deleteDialog}
        className="saldo-movement-dialog"
        aria-labelledby="delete-income-title"
        aria-describedby="delete-income-description"
        onCancel={(event) => { if (deleting) event.preventDefault() }}
      >
        <form onSubmit={deleteIncome} className="grid gap-3" aria-busy={deleting}>
          <div>
            <h2 id="delete-income-title">¿Eliminar este ingreso?</h2>
            <p id="delete-income-description" className="text-sm text-[var(--saldo-muted)]">
              Quitarás <strong className="break-words">{incomeToDelete?.fuente}</strong> por <strong>{formatCurrency(incomeToDelete?.monto)}</strong> de tus movimientos.
            </p>
          </div>
          <FormMessage>{deleteError}</FormMessage>
          <div className="flex flex-wrap justify-end gap-2">
            <Button ref={cancelDeleteButton} variant="secondary" disabled={deleting} onClick={() => deleteDialog.current.close()}>Cancelar</Button>
            <Button type="submit" variant="danger" disabled={deleting}>
              {deleting && <LoaderCircle size={17} className="motion-safe:animate-spin" aria-hidden="true" />}
              {deleting ? 'Eliminando…' : 'Eliminar ingreso'}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
