import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'

export function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f4] px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e5eae5] bg-white px-5 py-4 text-sm text-[#557067] shadow-sm">
          <span className="size-4 animate-spin rounded-full border-2 border-[#d5e4dc] border-t-[#1a6955]" />
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
