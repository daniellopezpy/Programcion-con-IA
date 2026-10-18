import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'

export function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fafaf9] px-6 text-[#1c1917]">
        <div className="flex items-center gap-3 border border-[#e7e5e4] bg-[#f5f5f4] px-5 py-4 text-sm text-[#78716c]">
          <span className="size-4 animate-spin rounded-full border-2 border-[#d6d3d1] border-t-[#78716c]" />
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
