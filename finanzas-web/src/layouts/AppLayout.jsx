import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChartNoAxesColumnIncreasing, CircleHelp, LogOut, Menu, Plus, Wallet, X } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'

const navigation = [
  { to: '/', label: 'Resumen', icon: ChartNoAxesColumnIncreasing, end: true },
  { to: '/ingresos', label: 'Ingresos', icon: ArrowDownLeft },
  { to: '/egresos', label: 'Egresos', icon: ArrowUpRight },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // The local session is cleared even if the API is temporarily unreachable.
    }
    navigate('/login', { replace: true })
  }

  const initials = (user?.name || 'U').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#1e332c]">
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#e6ebe5] bg-white/95 px-4 backdrop-blur sm:px-6 lg:hidden">
        <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"><span className="grid size-8 place-items-center rounded-lg bg-[#c5ed83] text-[#103d33]"><ChartNoAxesColumnIncreasing size={18} /></span>saldo<span className="text-[#79aa4c]">.</span></Link>
        <button className="grid size-10 place-items-center rounded-xl text-[#476158] hover:bg-[#edf2ed]" type="button" aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </header>

      {menuOpen && <button className="fixed inset-0 z-30 bg-[#102f27]/20 lg:hidden" aria-label="Cerrar navegación" type="button" onClick={() => setMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-[#e5eae4] bg-white px-4 py-6 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/" className="mb-10 inline-flex items-center gap-2.5 px-2 text-lg font-bold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-[#c5ed83] text-[#103d33]"><ChartNoAxesColumnIncreasing size={20} /></span>saldo<span className="-ml-2 text-[#79aa4c]">.</span></Link>
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#9aa79f]">Tu espacio</p>
        <nav className="mt-3 grid gap-1" aria-label="Navegación principal">
          {navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${isActive ? 'bg-[#e9f2e7] text-[#164c3c]' : 'text-[#687a70] hover:bg-[#f3f6f1] hover:text-[#24483b]'}`}><Icon size={18} strokeWidth={1.8} />{label}</NavLink>)}
        </nav>
        <div className="mt-auto rounded-2xl border border-[#e4ebe3] bg-[#f7f9f5] p-4">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#d9e9d2] text-sm font-bold text-[#285541]">{initials}</div>
          <p className="truncate text-sm font-semibold text-[#263d33]">{user?.name || 'Mi cuenta'}</p>
          <p className="mt-0.5 truncate text-xs text-[#829087]">{user?.email}</p>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start px-2" onClick={handleLogout}><LogOut size={15} /> Cerrar sesión</Button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[250px]">
        <header className="hidden h-[68px] items-center justify-between border-b border-[#e6ebe5] bg-white/85 px-8 backdrop-blur lg:flex">
          <div className="inline-flex items-center gap-2 text-xs text-[#87948c]"><Wallet size={15} /> Finanzas personales</div>
          <div className="flex items-center gap-4"><button type="button" className="grid size-9 place-items-center rounded-full text-[#8a9790] hover:bg-[#f1f4ef]" aria-label="Ayuda"><CircleHelp size={18} /></button><div className="h-5 w-px bg-[#e3e8e1]" /><span className="text-sm font-medium text-[#52655b]">{user?.name}</span><span className="grid size-8 place-items-center rounded-full bg-[#d9e9d2] text-xs font-bold text-[#285541]">{initials}</span></div>
        </header>
        <main className="mx-auto w-full max-w-[1320px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><Outlet /></main>
      </div>
      <NavLink to="/egresos/nuevo" className="fixed bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full bg-[#153f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#163d32]/20 hover:bg-[#0f342b] lg:hidden"><Plus size={18} /> Nuevo egreso</NavLink>
    </div>
  )
}
