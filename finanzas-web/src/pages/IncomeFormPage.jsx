import { useEffect, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, Check, LoaderCircle, RefreshCw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActivityHeading } from '@/components/ActivityList'
import { FormField, FormMessage } from '@/components/FormField'
import { MoneyField } from '@/components/MoneyField'
import { MovementCategoryField } from '@/components/MovementCategoryField'
import { MovementDetails } from '@/components/MovementDetails'
import { Button } from '@/components/ui/button'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'
import { api } from '@/lib/api'
import { getSaldoPreferences } from '@/lib/saldo-preferences'
import { moneyAmount } from '@/lib/money-input'
import { localDateString } from '@/lib/utils'

export function IncomeFormPage() {
  const { id } = useParams()
  return <IncomeForm key={id ?? 'nuevo'} incomeId={id} />
}

function IncomeForm({ incomeId }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { query } = useDashboardPeriod()
  const backUrl = `/ingresos?${query}`
  const today = localDateString()
  const isEditing = Boolean(incomeId)
  const [values, setValues] = useState(() => ({
    fecha: today,
    fuente: '',
    categoria_id: '',
    monto: '',
    notas: '',
  }))
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [catalog, setCatalog] = useState({ categories: [], loading: true, error: '', originalDate: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(isEditing)
  const minDate = catalog.originalDate && catalog.originalDate < '2000-01-01' ? catalog.originalDate : '2000-01-01'
  const salaryCategory = catalog.categories.find(
    (category) => category.user_id === null && category.nombre === 'Empleo',
  )

  useEffect(() => {
    let active = true

    Promise.all([
      api.get('/categorias?tipo=ingreso'),
      incomeId ? api.get(`/ingresos/${encodeURIComponent(incomeId)}`) : null,
    ])
      .then(([categories, income]) => {
        if (!active) return
        const originalDate = income?.fecha?.slice(0, 10) ?? ''
        if (income) {
          setValues({
            fecha: originalDate,
            fuente: income.fuente,
            categoria_id: String(income.categoria_id),
            monto: String(income.monto),
            notas: income.notas ?? '',
          })
        }
        setCatalog({ categories, loading: false, error: '', originalDate })
      })
      .catch((requestError) => {
        if (active) setCatalog({
          categories: [],
          loading: false,
          error: incomeId && requestError.status === 404 ? 'Este ingreso ya no está disponible.' : requestError.message,
          originalDate: '',
        })
      })

    return () => { active = false }
  }, [incomeId, loadAttempt])

  function retryLoad() {
    setCatalog({ categories: [], loading: true, error: '', originalDate: '' })
    setLoadAttempt((attempt) => attempt + 1)
  }

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setMessage('')
  }

  function fillSalary() {
    const { salary } = getSaldoPreferences(user?.id)
    const fillAmount = !values.monto && Boolean(salary)
    setValues((current) => ({
      ...current,
      fuente: 'Salario',
      categoria_id: String(salaryCategory.id),
      monto: current.monto || salary,
    }))
    setErrors((current) => ({
      ...current,
      fuente: undefined,
      categoria_id: undefined,
      ...(fillAmount ? { monto: undefined } : {}),
    }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting || catalog.categories.length === 0) return

    const monto = moneyAmount(values.monto)
    if (!monto) {
      setErrors((current) => ({ ...current, monto: 'Escribe un monto mayor que cero.' }))
      event.currentTarget.elements.namedItem('monto')?.focus()
      return
    }

    if (!values.categoria_id) {
      setErrors((current) => ({ ...current, categoria_id: 'Elige una categoría para tu ingreso.' }))
      event.currentTarget.elements.namedItem('categoria_id')?.focus()
      return
    }

    if (!values.fecha || values.fecha < minDate || values.fecha > today) {
      setErrors({ fecha: 'Elige una fecha dentro del rango permitido.' })
      setDetailsOpen(true)
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setMessage('')

    try {
      const payload = {
        fecha: values.fecha,
        fuente: values.fuente.trim(),
        categoria_id: Number(values.categoria_id),
        monto,
        notas: values.notas.trim() || null,
      }
      if (isEditing) await api.put(`/ingresos/${encodeURIComponent(incomeId)}`, payload)
      else await api.post('/ingresos', payload)
      const [anio, mes] = values.fecha.split('-')
      const savedPeriod = new URLSearchParams({ anio, mes: String(Number(mes)) })
      navigate(`/ingresos?${savedPeriod}`, {
        replace: true,
        state: { incomeSaved: isEditing ? 'Ingreso actualizado.' : 'Ingreso guardado.' },
      })
    } catch (requestError) {
      const fieldErrors = Object.fromEntries(
        Object.entries(requestError.errors || {}).map(([field, messages]) => [field, messages[0]]),
      )
      setErrors(fieldErrors)
      if (fieldErrors.fecha || fieldErrors.notas) setDetailsOpen(true)
      setMessage(Object.keys(fieldErrors).length ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="activity-page mx-auto w-full max-w-2xl">
      <Link to={backUrl} className="activity-back">
        <ArrowLeft size={17} aria-hidden="true" /> Volver a ingresos
      </Link>
      <ActivityHeading
        title={isEditing ? 'Editar ingreso' : 'Nuevo ingreso'}
        description={isEditing ? 'Corrige los datos del ingreso.' : 'Anota cuánto recibiste y de dónde vino.'}
      />
      <FormMessage>{message}</FormMessage>

      {catalog.loading ? (
        <div className="activity-form" role="status">
          <p className="flex items-center gap-2 text-sm">
            <LoaderCircle size={17} className="motion-safe:animate-spin" aria-hidden="true" />
            {isEditing ? 'Cargando ingreso…' : 'Cargando categorías…'}
          </p>
        </div>
      ) : catalog.error ? (
        <div className="activity-form">
          <FormMessage>{catalog.error}</FormMessage>
          <Button variant="secondary" className="w-fit" onClick={retryLoad}>
            <RefreshCw size={16} aria-hidden="true" /> Reintentar
          </Button>
        </div>
      ) : (
        <form className="activity-form" onSubmit={handleSubmit}>
          {catalog.categories.length === 0 && (
            <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900" role="status">
              Aún no hay categorías disponibles para registrar un ingreso.
            </p>
          )}
          <MoneyField
            className="activity-form-field"
            id="monto"
            name="monto"
            label="Monto (Q)"
            placeholder="0.00"
            value={values.monto}
            onChange={updateField}
            error={errors.monto}
            required
          />
          <div className="grid gap-1">
            <FormField
              className="activity-form-field"
              id="fuente"
              name="fuente"
              label="Fuente del ingreso"
              placeholder="Ej. Pago de un cliente"
              maxLength={150}
              value={values.fuente}
              onChange={updateField}
              error={errors.fuente}
              required
            />
            {!isEditing && salaryCategory && (
              <button className="movement-salary-shortcut" type="button" onClick={fillSalary}>
                <BriefcaseBusiness size={16} aria-hidden="true" /> Usar «Salario»
              </button>
            )}
          </div>
          <MovementCategoryField
            label="Categoría"
            name="categoria_id"
            value={values.categoria_id}
            items={catalog.categories}
            onChange={updateField}
            error={errors.categoria_id}
          />
          <MovementDetails
            open={detailsOpen}
            onToggle={() => setDetailsOpen((open) => !open)}
            values={values}
            errors={errors}
            onChange={updateField}
            today={today}
            minDate={minDate}
          />
          <div className="activity-form-footer">
            <Button variant="secondary" type="button" onClick={() => navigate(backUrl)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || catalog.categories.length === 0}>
              {isSubmitting ? (
                <><LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" /> Guardando…</>
              ) : (
                <><Check size={16} aria-hidden="true" /> {isEditing ? 'Guardar cambios' : 'Guardar ingreso'}</>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
