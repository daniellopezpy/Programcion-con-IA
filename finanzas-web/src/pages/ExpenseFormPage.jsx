import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormField, FormMessage } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { localDateString } from '@/lib/utils'

const blankValues = {
  fecha: localDateString(),
  descripcion: '',
  categoria_id: '',
  subcategoria_id: '',
  monto: '',
  notas: '',
}

export function ExpenseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [values, setValues] = useState(blankValues)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === values.categoria_id),
    [categories, values.categoria_id],
  )
  const subcategories = selectedCategory?.subcategorias || []

  useEffect(() => {
    let active = true
    async function loadForm() {
      setLoading(true)
      setMessage('')
      try {
        const [categoryList, expense] = await Promise.all([
          api.get('/categorias?tipo=egreso'),
          id ? api.get(`/egresos/${id}`) : Promise.resolve(null),
        ])
        if (!active) return
        setCategories(categoryList)
        if (expense) {
          setValues({
            fecha: expense.fecha,
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
        if (active) setMessage(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadForm()
    return () => { active = false }
  }, [id])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value, ...(name === 'categoria_id' ? { subcategoria_id: '' } : {}) }))
    setErrors((current) => ({ ...current, [name]: undefined, ...(name === 'categoria_id' ? { subcategoria_id: undefined } : {}) }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setMessage('')
    const payload = {
      fecha: values.fecha,
      descripcion: values.descripcion,
      categoria_id: Number(values.categoria_id),
      subcategoria_id: values.subcategoria_id ? Number(values.subcategoria_id) : null,
      monto: values.monto,
      notas: values.notas || null,
    }
    try {
      if (isEditing) await api.put(`/egresos/${id}`, payload)
      else await api.post('/egresos', payload)
      navigate('/egresos', { replace: true })
    } catch (requestError) {
      const fieldErrors = Object.fromEntries(Object.entries(requestError.errors || {}).map(([field, messages]) => [field, messages[0]]))
      setErrors(fieldErrors)
      setMessage(Object.keys(fieldErrors).length ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 text-white">
      <div><Link to="/egresos" className="inline-flex items-center gap-2 text-sm font-semibold text-[#c5ed83] hover:text-white"><ArrowLeft size={16} /> Volver a egresos</Link><p className="mt-6 text-sm font-medium text-[#c5ed83]">{isEditing ? 'Actualiza tus datos' : 'Registra un movimiento'}</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-white">{isEditing ? 'Editar egreso' : 'Nuevo egreso'}</h1><p className="mt-2 text-sm text-[#aaa8b5]">Completa los detalles del movimiento.</p></div>
      <FormMessage dark>{message}</FormMessage>
      {loading ? <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111116] p-6 text-sm text-[#aaa8b5]"><LoaderCircle className="animate-spin" size={17} /> Preparando formulario…</div> : <form className="grid gap-5 rounded-2xl border border-white/10 bg-[#111116] p-5 shadow-lg shadow-black/20 sm:p-7" onSubmit={handleSubmit}>
        <FormField dark id="descripcion" name="descripcion" label="Descripción" placeholder="Ej. Servicio de agua" maxLength={150} value={values.descripcion} onChange={updateField} error={errors.descripcion} required />
        <div className="grid gap-5 sm:grid-cols-2"><FormField dark id="fecha" name="fecha" label="Fecha" type="date" max={localDateString()} value={values.fecha} onChange={updateField} error={errors.fecha} required /><FormField dark id="monto" name="monto" label="Monto (Q)" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={values.monto} onChange={updateField} error={errors.monto} required /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="grid gap-1.5"><label htmlFor="categoria_id" className="text-sm font-semibold text-[#d6d3df]">Categoría</label><select id="categoria_id" name="categoria_id" value={values.categoria_id} onChange={updateField} aria-invalid={Boolean(errors.categoria_id)} className={`h-11 rounded-xl border bg-[#18181e] px-3.5 text-sm text-white outline-none focus:border-[#ae7bff] focus:ring-4 focus:ring-[#ae7bff]/15 ${errors.categoria_id ? 'border-rose-400' : 'border-white/10'}`} required><option value="">Selecciona una categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select>{errors.categoria_id && <p role="alert" className="text-xs leading-5 text-[#ffb6c0]">{errors.categoria_id}</p>}</div><div className="grid gap-1.5"><label htmlFor="subcategoria_id" className="text-sm font-semibold text-[#d6d3df]">Subcategoría <span className="font-normal text-[#858290]">(opcional)</span></label><select id="subcategoria_id" name="subcategoria_id" value={values.subcategoria_id} onChange={updateField} disabled={!selectedCategory} aria-invalid={Boolean(errors.subcategoria_id)} className={`h-11 rounded-xl border bg-[#18181e] px-3.5 text-sm text-white outline-none focus:border-[#ae7bff] focus:ring-4 focus:ring-[#ae7bff]/15 disabled:bg-[#111116] ${errors.subcategoria_id ? 'border-rose-400' : 'border-white/10'}`}><option value="">Sin subcategoría</option>{subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.nombre}</option>)}</select>{errors.subcategoria_id && <p role="alert" className="text-xs leading-5 text-[#ffb6c0]">{errors.subcategoria_id}</p>}</div></div>
        <div className="grid gap-1.5"><label htmlFor="notas" className="text-sm font-semibold text-[#d6d3df]">Notas <span className="font-normal text-[#858290]">(opcional)</span></label><textarea id="notas" name="notas" rows={3} value={values.notas} onChange={updateField} aria-invalid={Boolean(errors.notas)} className={`resize-y rounded-xl border bg-[#18181e] px-3.5 py-3 text-sm text-white outline-none focus:border-[#ae7bff] focus:ring-4 focus:ring-[#ae7bff]/15 placeholder:text-[#6f6c7b] ${errors.notas ? 'border-rose-400' : 'border-white/10'}`} placeholder="Agrega un detalle si lo necesitas" />{errors.notas && <p role="alert" className="text-xs leading-5 text-[#ffb6c0]">{errors.notas}</p>}</div>
        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end"><Button variant="secondary" className="border-white/10 bg-[#18181e] text-white hover:bg-white/10" type="button" onClick={() => navigate('/egresos')}>Cancelar</Button><Button className="bg-[#ae7bff] text-white hover:bg-[#bd91ff]" type="submit" disabled={isSubmitting || categories.length === 0}>{isSubmitting ? <><LoaderCircle size={16} className="animate-spin" /> Guardando…</> : <><Check size={16} /> {isEditing ? 'Guardar cambios' : 'Guardar egreso'}</>}</Button></div>
      </form>}
    </div>
  )
}
