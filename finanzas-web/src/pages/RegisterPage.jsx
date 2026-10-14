import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FormField, FormMessage } from '@/components/FormField'
import { useAuth } from '@/context/useAuth'

const initialValues = { name: '', email: '', password: '', password_confirmation: '' }

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    setErrors((current) => ({ ...current, [event.target.name]: undefined }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setMessage('')
    try {
      await register(values)
      navigate('/', { replace: true })
    } catch (requestError) {
      setErrors(Object.fromEntries(Object.entries(requestError.errors || {}).map(([field, messages]) => [field, messages[0]])))
      setMessage(requestError.errors ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-md">
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#688076]">Empieza por aquí</p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#152f27] sm:text-5xl">Crea tu cuenta</h1>
        <p className="mt-3 text-sm leading-6 text-[#77857e]">Un buen mapa de tus finanzas empieza con tus datos.</p>
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormMessage>{message}</FormMessage>
        <FormField id="name" name="name" label="Nombre" autoComplete="name" placeholder="¿Cómo te llamas?" value={values.name} onChange={updateField} error={errors.name} required />
        <FormField id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" value={values.email} onChange={updateField} error={errors.email} required />
        <FormField id="password" name="password" label="Contraseña" type="password" autoComplete="new-password" placeholder="Al menos 8 caracteres" value={values.password} onChange={updateField} error={errors.password} required />
        <FormField id="password_confirmation" name="password_confirmation" label="Confirma tu contraseña" type="password" autoComplete="new-password" placeholder="Escríbela otra vez" value={values.password_confirmation} onChange={updateField} error={errors.password_confirmation} required />
        <Button className="mt-1 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando cuenta…' : 'Crear mi cuenta'}{!isSubmitting && <ArrowRight size={17} />}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-[#718078]">¿Ya tienes una cuenta? <Link className="font-semibold text-[#174e40] underline decoration-[#b6cdbf] underline-offset-4" to="/login">Inicia sesión</Link></p>
      <p className="mt-4 text-center text-[11px] text-[#98a29c]">Tus datos se usan solo para tu espacio financiero.</p>
    </section>
  )
}
