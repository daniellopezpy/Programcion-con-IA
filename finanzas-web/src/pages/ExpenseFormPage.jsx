import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CreditCard, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ActivityHeading } from '@/components/ActivityList'
import { FormField, FormMessage } from '@/components/FormField'
import { MoneyField } from '@/components/MoneyField'
import { MovementCategoryField } from '@/components/MovementCategoryField'
import { MovementDetails } from '@/components/MovementDetails'
import { Button } from '@/components/ui/button'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'
import { api } from '@/lib/api'
import { getExpenseCard, setCardExpense } from '@/lib/card-expenses'
import { moneyAmount } from '@/lib/money-input'
import { getSaldoPreferences } from '@/lib/saldo-preferences'
import { localDateString } from '@/lib/utils'

const blankValues = {
  descripcion: '',
  categoria_id: '',
  subcategoria_id: '',
  monto: '',
  notas: '',
}

function matchSuggestedCategory(description, categories) {
  const normalized = (description || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
  const matchesSalud = /\b(farmacia|farmacias)\b/.test(normalized)
  const matchesTransporte = /\bgasolina\b/.test(normalized)

  if (matchesSalud === matchesTransporte) return null

  const targetName = matchesSalud ? 'salud' : 'transporte'
  return (
    categories.find(
      (category) => category.user_id == null && category.nombre?.trim().toLowerCase() === targetName,
    ) || null
  )
}

export function ExpenseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { query } = useDashboardPeriod()
  const isCardView = params.get('vista') === 'tarjeta'
  const backUrl = `/egresos?${query}${isCardView ? '&vista=tarjeta' : ''}`
  const isEditing = Boolean(id)
  const today = localDateString()
  const [values, setValues] = useState(() => ({ ...blankValues, fecha: today }))
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(isEditing)
  const [cardPayment, setCardPayment] = useState(false)
  const [cardId, setCardId] = useState('')
  const { cards } = getSaldoPreferences(user.id)

  const suggestedCategoryId = useMemo(() => {
    if (isEditing || values.categoria_id) return ''
    const match = matchSuggestedCategory(values.descripcion, categories)
    return match ? String(match.id) : ''
  }, [isEditing, values.categoria_id, values.descripcion, categories])

  const effectiveCategoryId = values.categoria_id || suggestedCategoryId
  const isSuggested = Boolean(!values.categoria_id && suggestedCategoryId)

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === effectiveCategoryId),
    [categories, effectiveCategoryId],
  )
  const subcategories = selectedCategory?.subcategorias || []
  const validSubcategory = Boolean(
    values.subcategoria_id &&
    subcategories.some((sub) => String(sub.id) === values.subcategoria_id),
  )

  useEffect(() => {
    let active = true
    async function loadForm() {
      setLoading(true)
      setMessage('')
      setErrors({})
      try {
        const [categoryList, expense] = await Promise.all([
          api.get('/categorias?tipo=egreso'),
          id ? api.get(`/egresos/${id}`) : Promise.resolve(null),
        ])
        if (!active) return
        setCategories(categoryList)
        setDetailsOpen(Boolean(expense))
        const savedCard = expense ? getExpenseCard(user.id, expense.id) : ''
        setCardPayment(Boolean(savedCard))
        setCardId(savedCard === '1' ? '' : savedCard)
        if (expense) {
          setValues({
            fecha: expense.fecha?.slice(0, 10) || '',
            descripcion: expense.descripcion || '',
            categoria_id: String(expense.categoria_id),
            subcategoria_id: expense.subcategoria_id ? String(expense.subcategoria_id) : '',
            monto: String(expense.monto),
            notas: expense.notas || '',
          })
        } else {
          setValues({ ...blankValues, fecha: localDateString() })
        }
      } catch (requestError) {
        if (active) {
          setCategories([])
          setMessage(requestError.message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadForm()
    return () => { active = false }
  }, [id, user?.id])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => {
      const next = {
        ...current,
        [name]: value,
        ...(name === 'categoria_id' ? { subcategoria_id: '' } : {}),
      }
      if (name === 'subcategoria_id' && value && !current.categoria_id && suggestedCategoryId) {
        next.categoria_id = suggestedCategoryId
      }
      return next
    })
    const clearsCategoryError = Boolean(
      name === 'descripcion' &&
      !isEditing &&
      !values.categoria_id &&
      matchSuggestedCategory(value, categories),
    )
    setErrors((current) => ({
      ...current,
      [name]: undefined,
      ...(name === 'categoria_id' ? { subcategoria_id: undefined } : {}),
      ...(clearsCategoryError ? { categoria_id: undefined } : {}),
    }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting || categories.length === 0) return

    const monto = moneyAmount(values.monto)
    if (!monto) {
      setErrors((current) => ({ ...current, monto: 'Escribe un monto mayor que cero.' }))
      event.currentTarget.elements.namedItem('monto')?.focus()
      return
    }

    if (!effectiveCategoryId) {
      setErrors((current) => ({ ...current, categoria_id: 'Elige una categoría para tu egreso.' }))
      event.currentTarget.elements.namedItem('categoria_id')?.focus()
      return
    }

    if (!values.fecha || values.fecha > today) {
      setErrors({ fecha: 'Elige una fecha que no sea futura.' })
      setDetailsOpen(true)
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setMessage('')
    const payload = {
      fecha: values.fecha,
      descripcion: values.descripcion,
      categoria_id: Number(effectiveCategoryId),
      subcategoria_id: validSubcategory ? Number(values.subcategoria_id) : null,
      monto,
      notas: values.notas || null,
    }
    try {
      const saved = isEditing
        ? await api.put(`/egresos/${id}`, payload)
        : await api.post('/egresos', payload)
      const savedId = saved?.id ?? id
      const savedCard = cardPayment ? (cardId || '1') : ''
      const changedCardPayment = savedCard !== getExpenseCard(user.id, savedId)
      const cardSaveError = changedCardPayment && !setCardExpense(user.id, savedId, cardPayment, cardId)
      const [anio, mes] = values.fecha.split('-')
      const savedPeriod = new URLSearchParams({ anio, mes: String(Number(mes)) })
      if (isCardView && cardPayment && !cardSaveError) savedPeriod.set('vista', 'tarjeta')
      navigate(`/egresos?${savedPeriod}`, {
        replace: true,
        state: cardSaveError ? { cardSaveError: true } : null,
      })
    } catch (requestError) {
      const fieldErrors = Object.fromEntries(Object.entries(requestError.errors || {}).map(([field, messages]) => [field, messages[0]]))
      setErrors(fieldErrors)
      if (fieldErrors.fecha || fieldErrors.notas || fieldErrors.subcategoria_id) setDetailsOpen(true)
      setMessage(Object.keys(fieldErrors).length ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="activity-page mx-auto w-full max-w-2xl">
      <Link to={backUrl} className="activity-back">
        <ArrowLeft size={17} aria-hidden="true" /> Volver a egresos
      </Link>
      <ActivityHeading
        title={isEditing ? 'Editar egreso' : 'Nuevo egreso'}
        description={isEditing ? 'Actualiza los datos de este gasto.' : 'Anota cuánto gastaste y en qué.'}
      />
      <FormMessage>{message}</FormMessage>
      {loading ? (
        <div className="activity-form" role="status">
          <p className="flex items-center gap-2 text-sm">
            <LoaderCircle size={17} className="motion-safe:animate-spin" aria-hidden="true" />
            Preparando formulario…
          </p>
        </div>
      ) : (
        <form className="activity-form" onSubmit={handleSubmit}>
          {!categories.length && !message && (
            <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900" role="status">
              Aún no hay categorías disponibles para registrar un egreso.
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
          <FormField
            className="activity-form-field"
            id="descripcion"
            name="descripcion"
            label="Descripción"
            placeholder="Ej. Servicio de agua"
            maxLength={150}
            value={values.descripcion}
            onChange={updateField}
            error={errors.descripcion}
            required
          />
          <div className="grid gap-1">
            <MovementCategoryField
              label="Categoría"
              name="categoria_id"
              value={effectiveCategoryId}
              items={categories}
              onChange={updateField}
              error={errors.categoria_id}
            />
            {isSuggested && (
              <p className="text-xs text-[#596b60]" role="status">
                Sugerida por la descripción
              </p>
            )}
          </div>
          <label className="movement-card-option">
            <span className="movement-category-icon"><CreditCard size={18} aria-hidden="true" /></span>
            <span>
              <span id="expense-card-label" className="text-sm font-semibold">Pagué con tarjeta</span>
              <small id="expense-card-note">Se guarda en este navegador.</small>
            </span>
            <input
              type="checkbox"
              checked={cardPayment}
              aria-labelledby="expense-card-label"
              aria-describedby="expense-card-note"
              disabled={isSubmitting}
              onChange={(event) => setCardPayment(event.target.checked)}
            />
          </label>
          {cardPayment && cards.length > 0 && (
            <fieldset className="grid gap-2">
              <legend className="activity-form-label">¿Con cuál tarjeta?</legend>
              <div className="flex flex-wrap gap-2">
                {[{ id: '', label: 'Sin especificar' }, ...cards].map((card) => (
                  <Button key={card.id} size="sm" variant={cardId === card.id ? 'primary' : 'secondary'} aria-pressed={cardId === card.id} onClick={() => setCardId(card.id)}>
                    {card.label}
                  </Button>
                ))}
              </div>
            </fieldset>
          )}
          <MovementDetails
            open={detailsOpen}
            onToggle={() => setDetailsOpen((open) => !open)}
            values={values}
            errors={errors}
            onChange={updateField}
            today={today}
          >
            {(subcategories.length > 0 || errors.subcategoria_id) && (
              <MovementCategoryField
                label="Subcategoría"
                name="subcategoria_id"
                value={validSubcategory ? values.subcategoria_id : ''}
                items={subcategories}
                onChange={updateField}
                error={errors.subcategoria_id}
                optional
              />
            )}
          </MovementDetails>
          <div className="activity-form-footer">
            <Button variant="secondary" type="button" onClick={() => navigate(backUrl)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || categories.length === 0}>
              {isSubmitting ? (
                <><LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" /> Guardando…</>
              ) : (
                <><Check size={16} aria-hidden="true" /> {isEditing ? 'Guardar cambios' : 'Guardar egreso'}</>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
