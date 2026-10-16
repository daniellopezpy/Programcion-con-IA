import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'

export function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08080b] px-6 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111116] px-5 py-4 text-sm text-[#aaa8b5] shadow-lg shadow-black/20">
          <span className="size-4 animate-spin rounded-full border-2 border-white/10 border-t-[#c5ed83]" />
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
