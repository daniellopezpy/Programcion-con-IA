import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'

export function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--saldo-page)] px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--saldo-line)] bg-[var(--saldo-surface)] px-5 py-4 text-sm text-[var(--saldo-muted)]" role="status">
          <span className="size-4 rounded-full border-2 border-[var(--saldo-line)] border-t-[var(--saldo-forest)] motion-safe:animate-spin" aria-hidden="true" />
          Comprobando tu sesión…
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
