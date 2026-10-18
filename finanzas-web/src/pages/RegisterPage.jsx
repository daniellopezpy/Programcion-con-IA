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
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#78716c]">Empieza por aquí</p>
        <h1 className="thought-serif mt-4 text-3xl font-bold tracking-[-0.03em] text-[#1c1917] sm:text-4xl">Crea tu cuenta</h1>
        <p className="mt-4 text-[17px] leading-[1.8] text-[#57534e]">Un buen mapa de tus finanzas empieza con tus datos.</p>
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormMessage>{message}</FormMessage>
        <FormField id="name" name="name" label="Nombre" autoComplete="name" placeholder="¿Cómo te llamas?" value={values.name} onChange={updateField} error={errors.name} required />
        <FormField id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" value={values.email} onChange={updateField} error={errors.email} required />
        <FormField id="password" name="password" label="Contraseña" type="password" autoComplete="new-password" placeholder="Al menos 8 caracteres" value={values.password} onChange={updateField} error={errors.password} required />
        <FormField id="password_confirmation" name="password_confirmation" label="Confirma tu contraseña" type="password" autoComplete="new-password" placeholder="Escríbela otra vez" value={values.password_confirmation} onChange={updateField} error={errors.password_confirmation} required />
        <Button className="thought-focus mt-2 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando cuenta…' : 'Crear mi cuenta'}{!isSubmitting && <ArrowRight size={17} />}</Button>
      </form>
      <p className="mt-6 text-center text-[15px] text-[#57534e]">¿Ya tienes una cuenta? <Link className="font-semibold text-[#78716c] underline underline-offset-4" to="/login">Inicia sesión</Link></p>
      <p className="mt-4 text-center text-[13px] text-[#a8a29e]">Tus datos se usan solo para tu espacio financiero.</p>
    </section>
  )
}
