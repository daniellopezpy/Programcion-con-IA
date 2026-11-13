import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, LoaderCircle } from 'lucide-react'
import { FormField, FormMessage } from '@/components/FormField'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { categoryLabel } from '@/lib/category-label'
import { moneyAmount } from '@/lib/money-input'
import { localDateString } from '@/lib/utils'
import './home-transaction-editor.css'

function withCurrentOption(options, currentId, currentName) {
  if (!currentId || options.some(({ id }) => String(id) === currentId)) return options
  return [...options, { id: currentId, nombre: currentName }]
}

function CategorySelect({ id, name, label, value, options, onChange, error, optional, disabled }) {
  return (
    <div className="saldo-transaction-editor-field">
      <label className="activity-form-label" htmlFor={id}>{label}</label>
      <span className="activity-period-select">
        <select
          className="activity-form-control"
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          required={!optional}
        >
          <option value="" disabled={!optional}>{optional ? 'Sin subcategoría' : 'Elige una categoría'}</option>
          {options.map((option) => <option key={option.id} value={option.id}>{categoryLabel(option.nombre)}</option>)}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </span>
      {error && <p id={`${id}-error`} className="text-xs text-rose-700" role="alert">{error}</p>}
    </div>
  )
}

export function HomeTransactionEditor({ transaction, repeating = false, busy, error, onSave, onCancel }) {
  const { item, type } = transaction
  const isExpense = type === 'egreso'
  const conceptField = isExpense ? 'descripcion' : 'fuente'
  const savedCategory = String(item.categoria_id ?? item.categoria?.id ?? '')
  const savedSubcategory = String(item.subcategoria_id ?? item.subcategoria?.id ?? '')
  const today = localDateString()
  const initialDate = repeating ? today : item.fecha?.slice(0, 10)
  const fieldId = useId()
  const form = useRef(null)
  const [values, setValues] = useState(() => ({
    [conceptField]: item[conceptField] ?? '',
    monto: String(item.monto ?? ''),
    fecha: initialDate || '',
    categoria_id: savedCategory,
    subcategoria_id: savedSubcategory,
    notas: item.notas ?? '',
  }))
  const [catalog, setCatalog] = useState({ options: [], loading: true, error: false })
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  const [localErrors, setLocalErrors] = useState({})
  const [hiddenErrors, setHiddenErrors] = useState({})
  const serverErrors = error?.errors
  const firstServerField = Object.keys(serverErrors ?? {}).find((name) => Object.hasOwn(values, name))
  const category = catalog.options.find(({ id }) => String(id) === values.categoria_id)
  const categories = withCurrentOption(catalog.options, savedCategory, item.categoria?.nombre ?? 'Categoría actual')
  const subcategories = withCurrentOption(
    category?.subcategorias ?? [],
    values.categoria_id === savedCategory ? savedSubcategory : '',
    item.subcategoria?.nombre ?? 'Subcategoría actual',
  )

  useEffect(() => {
    let active = true
    api.get(`/categorias?tipo=${type}`).then(
      (options) => { if (active) setCatalog({ options, loading: false, error: false }) },
      () => { if (active) setCatalog({ options: [], loading: false, error: true }) },
    )
    return () => { active = false }
  }, [type, catalogAttempt])

  useEffect(() => {
    if (!busy && firstServerField) form.current?.elements.namedItem(firstServerField)?.focus()
  }, [busy, error, firstServerField])

  function fieldError(name) {
    return localErrors[name] || (!hiddenErrors[name] ? serverErrors?.[name]?.[0] : undefined)
  }

  function retryCatalog() {
    setCatalog({ options: [], loading: true, error: false })
    setCatalogAttempt((attempt) => attempt + 1)
  }

  function changeField(event) {
    const { name, value } = event.target
    const changeCategory = name === 'categoria_id'
    setValues((current) => ({ ...current, [name]: value, ...(changeCategory ? { subcategoria_id: '' } : {}) }))
    setLocalErrors((current) => ({ ...current, [name]: undefined, ...(changeCategory ? { subcategoria_id: undefined } : {}) }))
    setHiddenErrors((current) => ({ ...current, [name]: true, ...(changeCategory ? { subcategoria_id: true } : {}) }))
  }

  function submit(event) {
    event.preventDefault()
    if (busy) return
    const concept = values[conceptField].trim()
    const amount = moneyAmount(values.monto)
    const date = new FormData(event.currentTarget).get('fecha')
    const errors = {}
    if (!concept) errors[conceptField] = isExpense ? 'Escribe una descripción.' : 'Escribe la fuente del ingreso.'
    if (!amount) errors.monto = 'Escribe un monto mayor que cero, con hasta dos decimales.'
    if (!date || date > today) errors.fecha = 'Elige hoy o una fecha anterior.'
    if (!values.categoria_id) errors.categoria_id = 'Elige una categoría.'
    setLocalErrors(errors)
    const firstField = Object.keys(errors)[0]
    if (firstField) {
      event.currentTarget.elements.namedItem(firstField)?.focus()
      return
    }

    setHiddenErrors({})
    onSave({
      [conceptField]: concept,
      monto: amount,
      fecha: date,
      categoria_id: Number(values.categoria_id),
      ...(isExpense ? { subcategoria_id: values.subcategoria_id ? Number(values.subcategoria_id) : null } : {}),
      notas: values.notas.trim() || null,
    })
  }

  return (
    <form ref={form} className="saldo-transaction-editor" onSubmit={submit}>
      <fieldset className="saldo-transaction-editor-fields" disabled={busy}>
        <FormField
          className="activity-form-field"
          id={`${fieldId}-concept`}
          name={conceptField}
          label={isExpense ? 'Descripción' : 'Fuente de ingreso'}
          maxLength={150}
          value={values[conceptField]}
          onChange={changeField}
          error={fieldError(conceptField)}
          required
        />
        <div className="saldo-transaction-editor-pair">
          <MoneyField
            className="activity-form-field"
            id={`${fieldId}-amount`}
            name="monto"
            label="Monto (Q)"
            value={values.monto}
            onChange={changeField}
            error={fieldError('monto')}
            required
          />
          <FormField
            className="activity-form-field"
            id={`${fieldId}-date`}
            name="fecha"
            label="Fecha"
            type="date"
            max={today}
            defaultValue={initialDate}
            onChange={changeField}
            error={fieldError('fecha')}
            required
          />
        </div>
        <CategorySelect
          id={`${fieldId}-category`}
          name="categoria_id"
          label="Categoría"
          value={values.categoria_id}
          options={categories}
          onChange={changeField}
          error={fieldError('categoria_id')}
          disabled={catalog.loading && !values.categoria_id}
        />
        {catalog.loading && <p className="saldo-transaction-editor-status" role="status">Cargando categorías…</p>}
        {catalog.error && (
          <div className="saldo-transaction-editor-catalog">
            <p className="saldo-transaction-editor-status" role="status">No se pudieron cargar las opciones de categoría.</p>
            <Button size="sm" variant="secondary" onClick={retryCatalog}>Reintentar</Button>
          </div>
        )}
        {isExpense && (subcategories.length > 0 || fieldError('subcategoria_id')) && (
          <CategorySelect
            id={`${fieldId}-subcategory`}
            name="subcategoria_id"
            label="Subcategoría"
            value={values.subcategoria_id}
            options={subcategories}
            onChange={changeField}
            error={fieldError('subcategoria_id')}
            optional
          />
        )}
        <div className="saldo-transaction-editor-field">
          <label className="activity-form-label" htmlFor={`${fieldId}-notes`}>Notas <span>(opcional)</span></label>
          <textarea
            id={`${fieldId}-notes`}
            name="notas"
            className="activity-form-control"
            rows={2}
            value={values.notas}
            onChange={changeField}
            aria-invalid={Boolean(fieldError('notas'))}
            aria-describedby={fieldError('notas') ? `${fieldId}-notes-error` : undefined}
          />
          {fieldError('notas') && <p id={`${fieldId}-notes-error`} className="text-xs text-rose-700" role="alert">{fieldError('notas')}</p>}
        </div>
      </fieldset>
      {error && !firstServerField && <FormMessage>{error.message || 'No se pudieron guardar los cambios.'}</FormMessage>}
      <div className="saldo-transaction-editor-actions">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</Button>
        <Button type="submit" disabled={busy || !values.categoria_id && categories.length === 0}>
          {busy ? <LoaderCircle size={17} className="motion-safe:animate-spin" aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
          {busy ? 'Guardando…' : repeating ? (isExpense ? 'Guardar gasto' : 'Guardar ingreso') : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
