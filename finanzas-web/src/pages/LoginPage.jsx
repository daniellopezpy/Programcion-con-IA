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
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#78716c]">Qué bueno verte de nuevo</p>
        <h1 className="thought-serif mt-4 text-3xl font-bold tracking-[-0.03em] text-[#1c1917] sm:text-4xl">Inicia sesión</h1>
        <p className="mt-4 text-[17px] leading-[1.8] text-[#57534e]">Entra a tu espacio y continúa con tus finanzas.</p>
      </div>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <FormMessage>{error}</FormMessage>
        <FormField id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" value={values.email} onChange={updateField} required />
        <FormField id="password" name="password" label="Contraseña" type="password" autoComplete="current-password" placeholder="Tu contraseña" value={values.password} onChange={updateField} required />
        <Button className="thought-focus mt-2 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}{!isSubmitting && <ArrowRight size={17} />}</Button>
      </form>
      <div className="my-8 flex items-center gap-3 text-[13px] text-[#a8a29e]"><span className="h-px flex-1 bg-[#e7e5e4]" /><span><LockKeyhole size={13} className="inline -translate-y-px" /> Acceso privado</span><span className="h-px flex-1 bg-[#e7e5e4]" /></div>
      <p className="text-center text-[15px] text-[#57534e]">¿Primera vez aquí? <Link className="font-semibold text-[#78716c] underline underline-offset-4" to="/registro">Crea tu cuenta</Link></p>
    </section>
  )
}
