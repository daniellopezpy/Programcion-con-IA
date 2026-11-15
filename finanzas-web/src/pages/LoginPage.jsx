import { useState } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FormField, FormMessage } from '@/components/FormField'
import { useAuth } from '@/context/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await login(values)
      const from = location.state?.from
      const destination = from?.pathname
        ? { pathname: from.pathname, search: from.search, hash: from.hash }
        : '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="saldo-auth-card" aria-labelledby="saldo-access-title">
      <header className="saldo-auth-card-title">
        <h1 id="saldo-access-title">Inicia sesión</h1>
        <p>Consulta tus movimientos, saldos y metas.</p>
      </header>
      <form className="saldo-auth-form" onSubmit={handleSubmit}>
        {location.state?.passwordReset && <FormMessage tone="success">Contraseña actualizada. Inicia sesión con la nueva.</FormMessage>}
        <FormMessage>{error}</FormMessage>
        <FormField id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" value={values.email} onChange={updateField} required />
        <FormField id="password" name="password" label="Contraseña" type="password" autoComplete="current-password" placeholder="Tu contraseña" value={values.password} onChange={updateField} required />
        <Button className="saldo-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}{!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}</Button>
      </form>
      <p className="saldo-auth-switch"><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></p>
      <p className="saldo-auth-switch">¿Primera vez aquí? <Link to="/registro">Crea tu cuenta</Link></p>
      <p className="saldo-auth-privacy"><LockKeyhole size={14} aria-hidden="true" /> Acceso privado</p>
    </section>
  )
}
