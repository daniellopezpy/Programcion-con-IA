import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChartNoAxesColumnIncreasing, CircleHelp, LogOut, Menu, Plus, Wallet, X } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'
import { DashboardPeriodProvider, useDashboardPeriod } from '@/context/dashboard-period'

const navigation = [
  { to: '/', label: 'Resumen', icon: ChartNoAxesColumnIncreasing, end: true },
  { to: '/ingresos', label: 'Ingresos', icon: ArrowDownLeft },
  { to: '/egresos', label: 'Egresos', icon: ArrowUpRight },
]

export function AppLayout() {
  return <DashboardPeriodProvider><AppShell /></DashboardPeriodProvider>
}

function AppShell() {
  const { user, logout } = useAuth()
  const { query } = useDashboardPeriod()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    try { await logout() } catch { /* The local session is cleared even if the API is unreachable. */ }
    navigate('/login', { replace: true })
  }

  const initials = (user?.name || 'U').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafaf9] text-[#1c1917]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e7e5e4] bg-[#fafaf9] px-4 sm:px-6 lg:hidden">
        <Link to="/" className="thought-serif inline-flex items-center gap-2 text-lg font-bold"><span className="grid size-8 place-items-center border border-[#78716c] text-[#78716c]"><ChartNoAxesColumnIncreasing size={17} /></span>Saldo</Link>
        <button className="thought-focus grid size-10 place-items-center text-[#78716c] hover:bg-[#f5f5f4]" type="button" aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </header>

      {menuOpen && <button className="fixed inset-0 z-30 bg-[#1c1917]/20 lg:hidden" aria-label="Cerrar navegación" type="button" onClick={() => setMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-[#e7e5e4] bg-[#fafaf9] px-5 py-7 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/" className="thought-serif mb-16 inline-flex items-center gap-2 text-xl font-bold">Saldo<span className="text-[#78716c]">.</span></Link>
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a8a29e]">Tu espacio</p>
        <nav className="mt-4 grid" aria-label="Navegación principal">
          {navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={`${to}?${query}`} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `thought-focus flex h-11 items-center gap-3 border-l-2 px-3 text-[15px] font-semibold transition ${isActive ? 'border-[#78716c] bg-[#efedeb] text-[#1c1917]' : 'border-transparent text-[#78716c] hover:bg-[#f5f5f4] hover:text-[#1c1917]'}`}><Icon size={18} strokeWidth={1.7} />{label}</NavLink>)}
        </nav>
        <div className="mt-auto border-t border-[#e7e5e4] pt-5">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#efedeb] text-sm font-semibold text-[#78716c]">{initials}</div>
          <p className="truncate text-[15px] font-semibold text-[#1c1917]">{user?.name || 'Mi cuenta'}</p>
          <p className="mt-1 truncate text-[13px] text-[#a8a29e]">{user?.email}</p>
          <Button variant="ghost" size="sm" className="thought-focus mt-4 w-full justify-start px-0" onClick={handleLogout}><LogOut size={15} /> Cerrar sesión</Button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[240px]">
        <header className="hidden h-16 items-center justify-between border-b border-[#e7e5e4] bg-[#fafaf9] px-10 lg:flex">
          <div className="inline-flex items-center gap-2 text-[13px] text-[#a8a29e]"><Wallet size={15} /> Finanzas personales</div>
          <div className="flex items-center gap-4"><button type="button" className="thought-focus grid size-8 place-items-center text-[#78716c] hover:bg-[#f5f5f4]" aria-label="Ayuda"><CircleHelp size={17} /></button><div className="h-5 w-px bg-[#e7e5e4]" /><span className="text-[15px] text-[#57534e]">{user?.name}</span><span className="grid size-8 place-items-center rounded-full bg-[#efedeb] text-xs font-semibold text-[#78716c]">{initials}</span></div>
        </header>
        <main className="mx-auto w-full max-w-[1240px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><Outlet /></main>
      </div>
      <NavLink to={`/egresos/nuevo?${query}`} className="thought-focus fixed bottom-5 right-5 z-20 inline-flex items-center gap-2 border border-[#78716c] bg-[#78716c] px-4 py-3 text-[15px] font-semibold text-[#fafaf9] hover:bg-[#57534e] lg:hidden"><Plus size={18} /> Nuevo egreso</NavLink>
    </div>
  )
}
