import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FormField, FormMessage } from '@/components/FormField'
import { api } from '@/lib/api'
import { useAuth } from '@/context/useAuth'

export function PasswordRecoveryPage({ reset = false }) {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const params = new URLSearchParams(hash.slice(1))
  const token = params.get('token')
  const [email, setEmail] = useState(() => params.get('email') ?? '')
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const invalid = reset && (!token || !params.get('email'))

  async function submit(event) {
    event.preventDefault()
    if (busy || invalid) return
    const fields = new FormData(event.currentTarget)
    setBusy(true)
    setStatus(null)
    try {
      if (reset) {
        await api.post('/restablecer-contrasena', {
          email, token, password: fields.get('password'), password_confirmation: fields.get('password_confirmation'),
        }, { auth: false })
        await logout().catch(() => {})
        navigate('/login', { replace: true, state: { passwordReset: true } })
      } else {
        const result = await api.post('/solicitar-contrasena', { email }, { auth: false })
        setStatus({ message: result.message, sent: true })
      }
    } catch (error) {
      const message = error.status === 429
        ? 'Hiciste varias solicitudes seguidas. Espera un minuto y vuelve a intentar.'
        : Object.values(error.errors ?? {})[0]?.[0] || error.message
      setStatus({ message, renew: reset && error.status === 422 && !Object.keys(error.errors ?? {}).length })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="saldo-auth-card" aria-labelledby="saldo-access-title">
      <header className="saldo-auth-card-title">
        <h1 id="saldo-access-title">{reset ? 'Elige una contraseña nueva' : 'Recupera tu contraseña'}</h1>
        {!reset && <p>Escribe el correo que usas en Saldo.</p>}
      </header>
      {status?.sent ? <p role="status">{status.message}</p> : (
        <form className="saldo-auth-form" onSubmit={submit}>
          <FormMessage>{invalid ? 'Abre el enlace completo del correo de recuperación.' : status?.message}</FormMessage>
          {!invalid && (
            <>
              <FormField id="recovery-email" label="Correo electrónico" type="email" autoComplete="email"
                value={email} onChange={(event) => setEmail(event.target.value)} readOnly={reset} disabled={busy} required />
              {reset && (
                <>
                  <FormField id="recovery-password" name="password" label="Contraseña nueva" type="password"
                    autoComplete="new-password" minLength={8} maxLength={72} disabled={busy} required />
                  <FormField id="recovery-confirm" name="password_confirmation" label="Confirma tu contraseña" type="password"
                    autoComplete="new-password" disabled={busy} required />
                </>
              )}
              <Button className="saldo-auth-submit" type="submit" disabled={busy}>
                {busy ? 'Procesando…' : reset ? 'Guardar contraseña' : 'Enviar enlace'}
              </Button>
            </>
          )}
        </form>
      )}
      {(invalid || status?.renew) && <p className="saldo-auth-switch"><Link to="/recuperar-contrasena">Solicitar otro enlace</Link></p>}
      <p className="saldo-auth-switch"><Link to="/login">Volver a iniciar sesión</Link></p>
    </section>
  )
}
