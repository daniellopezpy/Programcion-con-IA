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
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-md">
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c5ed83]">Qué bueno verte de nuevo</p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-white sm:text-5xl">Inicia sesión</h1>
        <p className="mt-3 text-sm leading-6 text-[#aaa8b5]">Entra a tu espacio y continúa con tus finanzas.</p>
      </div>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <FormMessage dark>{error}</FormMessage>
        <FormField dark id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" value={values.email} onChange={updateField} required />
        <FormField dark id="password" name="password" label="Contraseña" type="password" autoComplete="current-password" placeholder="Tu contraseña" value={values.password} onChange={updateField} required />
        <Button className="mt-1 w-full bg-[#ae7bff] text-white hover:bg-[#bd91ff]" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}{!isSubmitting && <ArrowRight size={17} />}</Button>
      </form>
      <div className="my-7 flex items-center gap-3 text-xs text-[#858290]"><span className="h-px flex-1 bg-white/10" /><span><LockKeyhole size={13} className="inline -translate-y-px" /> Acceso privado</span><span className="h-px flex-1 bg-white/10" /></div>
      <p className="text-center text-sm text-[#aaa8b5]">¿Primera vez aquí? <Link className="font-semibold text-[#c5ed83] underline decoration-[#c5ed83]/50 underline-offset-4" to="/registro">Crea tu cuenta</Link></p>
    </section>
  )
}
