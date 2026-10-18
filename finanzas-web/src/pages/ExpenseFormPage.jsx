import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormField, FormMessage } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { localDateString } from '@/lib/utils'

const blankValues = { fecha: localDateString(), descripcion: '', categoria_id: '', subcategoria_id: '', monto: '', notas: '' }

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

  const selectedCategory = useMemo(() => categories.find((category) => String(category.id) === values.categoria_id), [categories, values.categoria_id])
  const subcategories = selectedCategory?.subcategorias || []

  useEffect(() => {
    let active = true
    async function loadForm() {
      setLoading(true); setMessage('')
      try {
        const [categoryList, expense] = await Promise.all([api.get('/categorias?tipo=egreso'), id ? api.get(`/egresos/${id}`) : Promise.resolve(null)])
        if (!active) return
        setCategories(categoryList)
        if (expense) setValues({ fecha: expense.fecha, descripcion: expense.descripcion || '', categoria_id: String(expense.categoria_id), subcategoria_id: expense.subcategoria_id ? String(expense.subcategoria_id) : '', monto: String(expense.monto), notas: expense.notas || '' })
        else setValues({ ...blankValues, fecha: localDateString() })
      } catch (requestError) { if (active) setMessage(requestError.message) }
      finally { if (active) setLoading(false) }
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
    event.preventDefault(); setIsSubmitting(true); setErrors({}); setMessage('')
    const payload = { fecha: values.fecha, descripcion: values.descripcion, categoria_id: Number(values.categoria_id), subcategoria_id: values.subcategoria_id ? Number(values.subcategoria_id) : null, monto: values.monto, notas: values.notas || null }
    try {
      if (isEditing) await api.put(`/egresos/${id}`, payload)
      else await api.post('/egresos', payload)
      navigate('/egresos', { replace: true })
    } catch (requestError) {
      const fieldErrors = Object.fromEntries(Object.entries(requestError.errors || {}).map(([field, messages]) => [field, messages[0]]))
      setErrors(fieldErrors); setMessage(Object.keys(fieldErrors).length ? '' : requestError.message)
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-12 text-[#1c1917]">
      <div><Link to="/egresos" className="thought-focus inline-flex items-center gap-2 text-sm font-medium text-[#78716c] hover:text-[#1c1917]"><ArrowLeft size={16} /> Volver a egresos</Link><p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#78716c]">{isEditing ? 'Actualiza tus datos' : 'Registra un movimiento'}</p><h1 className="thought-serif mt-3 text-4xl tracking-[-0.04em] text-[#1c1917]">{isEditing ? 'Editar egreso' : 'Nuevo egreso'}</h1><p className="mt-3 text-base leading-7 text-[#57534e]">Completa los detalles del movimiento.</p></div>
      <FormMessage>{message}</FormMessage>
      {loading ? <div className="flex items-center gap-3 border border-[#e7e5e4] bg-[#f5f5f4] p-6 text-sm text-[#78716c]"><LoaderCircle className="animate-spin" size={17} /> Preparando formulario…</div> : <form className="grid gap-6 border border-[#e7e5e4] bg-[#fafaf9] p-6 sm:p-8" onSubmit={handleSubmit}>
        <FormField id="descripcion" name="descripcion" label="Descripción" placeholder="Ej. Servicio de agua" maxLength={150} value={values.descripcion} onChange={updateField} error={errors.descripcion} required />
        <div className="grid gap-6 sm:grid-cols-2"><FormField id="fecha" name="fecha" label="Fecha" type="date" max={localDateString()} value={values.fecha} onChange={updateField} error={errors.fecha} required /><FormField id="monto" name="monto" label="Monto (Q)" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={values.monto} onChange={updateField} error={errors.monto} required /></div>
        <div className="grid gap-6 sm:grid-cols-2"><div className="grid gap-2"><label htmlFor="categoria_id" className="text-sm font-medium text-[#57534e]">Categoría</label><select id="categoria_id" name="categoria_id" value={values.categoria_id} onChange={updateField} aria-invalid={Boolean(errors.categoria_id)} className={`thought-focus h-12 border bg-[#fafaf9] px-3.5 text-sm text-[#1c1917] outline-none ${errors.categoria_id ? 'border-[#dc2626]' : 'border-[#d6d3d1]'}`} required><option value="">Selecciona una categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select>{errors.categoria_id && <p role="alert" className="text-xs leading-5 text-[#dc2626]">{errors.categoria_id}</p>}</div><div className="grid gap-2"><label htmlFor="subcategoria_id" className="text-sm font-medium text-[#57534e]">Subcategoría <span className="font-normal text-[#a8a29e]">(opcional)</span></label><select id="subcategoria_id" name="subcategoria_id" value={values.subcategoria_id} onChange={updateField} disabled={!selectedCategory} aria-invalid={Boolean(errors.subcategoria_id)} className={`thought-focus h-12 border bg-[#fafaf9] px-3.5 text-sm text-[#1c1917] outline-none disabled:bg-[#efedeb] ${errors.subcategoria_id ? 'border-[#dc2626]' : 'border-[#d6d3d1]'}`}><option value="">Sin subcategoría</option>{subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.nombre}</option>)}</select>{errors.subcategoria_id && <p role="alert" className="text-xs leading-5 text-[#dc2626]">{errors.subcategoria_id}</p>}</div></div>
        <div className="grid gap-2"><label htmlFor="notas" className="text-sm font-medium text-[#57534e]">Notas <span className="font-normal text-[#a8a29e]">(opcional)</span></label><textarea id="notas" name="notas" rows={3} value={values.notas} onChange={updateField} aria-invalid={Boolean(errors.notas)} className={`thought-focus resize-y border bg-[#fafaf9] px-3.5 py-3 text-sm text-[#1c1917] outline-none placeholder:text-[#a8a29e] ${errors.notas ? 'border-[#dc2626]' : 'border-[#d6d3d1]'}`} placeholder="Agrega un detalle si lo necesitas" />{errors.notas && <p role="alert" className="text-xs leading-5 text-[#dc2626]">{errors.notas}</p>}</div>
        <div className="flex flex-col-reverse gap-3 border-t border-[#e7e5e4] pt-6 sm:flex-row sm:justify-end"><Button variant="secondary" type="button" onClick={() => navigate('/egresos')}>Cancelar</Button><Button type="submit" disabled={isSubmitting || categories.length === 0}>{isSubmitting ? <><LoaderCircle size={16} className="animate-spin" /> Guardando…</> : <><Check size={16} /> {isEditing ? 'Guardar cambios' : 'Guardar egreso'}</>}</Button></div>
      </form>}
    </div>
  )
}
