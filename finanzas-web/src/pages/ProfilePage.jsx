import { ChevronRight, CircleHelp, LogOut, SlidersHorizontal, Target, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useDashboardPeriod } from '@/context/dashboard-period'
import { useAuth } from '@/context/useAuth'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const { query } = useDashboardPeriod()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // AuthContext clears the session even if the server cannot be reached.
    }
    navigate('/login', { replace: true })
  }

  return (
    <section className="saldo-profile" aria-labelledby="profile-title">
      <h1 id="profile-title">Mi perfil</h1>
      <div className="saldo-profile-account">
        <span className="saldo-avatar"><UserRound size={20} aria-hidden="true" /></span>
        <div>
          <h2 className="font-bold">{user?.name || 'Mi cuenta'}</h2>
          <p>{user?.email}</p>
        </div>
      </div>
      <Link
        className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] px-4 py-3 motion-safe:transition-colors hover:bg-[var(--saldo-wash)]"
        to={`/perfil/metas?${query}`}
        aria-labelledby="profile-goals-title"
        aria-describedby="profile-goals-description"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--saldo-wash)] text-[var(--saldo-forest)]">
          <Target size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="grid min-w-0 gap-0.5">
          <span id="profile-goals-title" className="font-bold">Mis metas</span>
          <span id="profile-goals-description" className="text-sm text-[var(--saldo-muted)]">Define tu meta de ahorro y consulta el avance.</span>
        </span>
        <ChevronRight className="ml-auto shrink-0 text-[var(--saldo-muted)]" size={18} aria-hidden="true" />
      </Link>
      <Link
        className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] px-4 py-3 motion-safe:transition-colors hover:bg-[var(--saldo-wash)]"
        to={`/perfil/personalizar?${query}`}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--saldo-wash)] text-[var(--saldo-forest)]">
          <SlidersHorizontal size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="font-bold">Tarjetas y cobros</span>
        <ChevronRight className="ml-auto shrink-0 text-[var(--saldo-muted)]" size={18} aria-hidden="true" />
      </Link>
      <Link
        className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] px-4 py-3 motion-safe:transition-colors hover:bg-[var(--saldo-wash)]"
        to={`/?${query}`}
        state={{ showSaldoTour: true }}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--saldo-wash)] text-[var(--saldo-forest)]">
          <CircleHelp size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="font-bold">Ver guía de Saldo</span>
        <ChevronRight className="ml-auto shrink-0 text-[var(--saldo-muted)]" size={18} aria-hidden="true" />
      </Link>
      <Button variant="secondary" onClick={handleLogout}><LogOut size={16} aria-hidden="true" /> Cerrar sesión</Button>
    </section>
  )
}
