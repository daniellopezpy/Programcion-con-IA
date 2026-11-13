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
      navigate('/', { replace: true, state: { showSaldoTour: true } })
    } catch (requestError) {
      setErrors(Object.fromEntries(Object.entries(requestError.errors || {}).map(([field, messages]) => [field, messages[0]])))
      setMessage(requestError.errors ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="saldo-auth-card" aria-labelledby="saldo-access-title">
      <header className="saldo-auth-card-title">
        <h1 id="saldo-access-title">Crea tu cuenta</h1>
        <p>Empieza a llevar tus finanzas en Saldo.</p>
      </header>
      <form className="saldo-auth-form" onSubmit={handleSubmit}>
        <FormMessage>{message}</FormMessage>
        <FormField id="name" name="name" label="Nombre" autoComplete="name" placeholder="¿Cómo te llamas?" value={values.name} onChange={updateField} error={errors.name} required />
        <FormField id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" value={values.email} onChange={updateField} error={errors.email} required />
        <FormField id="password" name="password" label="Contraseña" type="password" autoComplete="new-password" placeholder="Al menos 8 caracteres" value={values.password} onChange={updateField} error={errors.password} required />
        <FormField id="password_confirmation" name="password_confirmation" label="Confirma tu contraseña" type="password" autoComplete="new-password" placeholder="Escríbela otra vez" value={values.password_confirmation} onChange={updateField} error={errors.password_confirmation} required />
        <Button className="saldo-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando cuenta…' : 'Crear mi cuenta'}{!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}</Button>
      </form>
      <p className="saldo-auth-switch">¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
    </section>
  )
}
