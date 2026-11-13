import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { FinanceSetup } from '@/components/FinanceSetup'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'
import './preferences-page.css'

export function PreferencesPage() {
  const { user } = useAuth()
  const { query } = useDashboardPeriod()
  const navigate = useNavigate()
  const profileUrl = `/perfil?${query}`

  return (
    <section className="saldo-preferences" aria-labelledby="saldo-preferences-title">
      <Link className="saldo-preferences-back" to={profileUrl}><ChevronLeft size={19} aria-hidden="true" /> Perfil</Link>
      <h1 id="saldo-preferences-title">Tarjetas y cobros</h1>
      <p>Actualiza tus respuestas cuando lo necesites.</p>
      <div className="saldo-preferences-form">
        <FinanceSetup userId={user.id} onSaved={() => navigate(profileUrl, { replace: true })} onSkip={() => navigate(profileUrl, { replace: true })} />
      </div>
    </section>
  )
}
