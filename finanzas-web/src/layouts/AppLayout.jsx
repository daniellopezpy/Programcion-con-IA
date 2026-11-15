import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarClock, ChartNoAxesColumnIncreasing, House, Plus, UserRound } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { BrandLogo } from '@/components/BrandLogo'
import { BrandIntro } from '@/components/BrandIntro'
import { PaymentNotifications } from '@/components/PaymentNotifications'
import { SaldoTour } from '@/components/SaldoTour'
import { useAuth } from '@/context/useAuth'
import { DashboardPeriodProvider, useDashboardPeriod } from '@/context/dashboard-period'
import { RecurringPaymentsProvider } from '@/context/recurring-payments'
import './app-shell.css'

const home = { to: '/', label: 'Inicio', icon: House, end: true }
const analytics = { to: '/analisis', label: 'Análisis', icon: ChartNoAxesColumnIncreasing }
const income = { to: '/ingresos', label: 'Ingresos', icon: ArrowDownLeft }
const expenses = { to: '/egresos', label: 'Egresos', icon: ArrowUpRight }
const profile = { to: '/perfil', label: 'Perfil', icon: UserRound }
const desktopLinks = [home, analytics, income, expenses, profile]
const movementOptions = [
  { route: '/ingresos/nuevo', label: 'Nuevo ingreso', detail: 'Sueldo, pago u otro dinero recibido', icon: ArrowDownLeft },
  { route: '/egresos/nuevo', label: 'Nuevo egreso', detail: 'Compra, factura u otro gasto', icon: ArrowUpRight },
]

function NavigationLink({ item, query }) {
  const { to, label, icon: Icon, end } = item
  return (
    <NavLink to={`${to}?${query}`} state={to === analytics.to ? { useCurrentAnalyticsPeriod: true } : undefined} end={end} className="saldo-nav-link">
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

export function AppLayout() {
  const { user } = useAuth()
  // Keyed by account: a different user starts with empty, loading payment data.
  return (
    <DashboardPeriodProvider>
      <RecurringPaymentsProvider key={user?.id} userId={user?.id}>
        <AppShell />
      </RecurringPaymentsProvider>
    </DashboardPeriodProvider>
  )
}

function AppShell() {
  const { user } = useAuth()
  const { query } = useDashboardPeriod()
  const navigate = useNavigate()
  const { pathname, search, state } = useLocation()
  const navigationType = useNavigationType()
  const movementDialog = useRef(null)
  const [showIntro, setShowIntro] = useState(true)
  const [movementOpen, setMovementOpen] = useState(false)
  const showTour = !showIntro && pathname === '/' && state?.showSaldoTour === true && navigationType !== 'POP'
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const finishIntro = useCallback(() => setShowIntro(false), [])

  function finishTour(destination) {
    const next = destination ? `${destination}?${query}` : `${pathname}${search}`
    navigate(next, {
      replace: true,
      state: destination === analytics.to ? { useCurrentAnalyticsPeriod: true } : undefined,
    })
  }

  function openMovement() {
    const dialog = movementDialog.current
    if (dialog.open) return
    dialog.showModal()
    setMovementOpen(true)
  }

  return (
    <div className="saldo-app">
      <div inert={showIntro}>
        <aside className="saldo-rail">
          <Link to={`/?${query}`}><BrandLogo /></Link>
          <nav className="saldo-rail-links" aria-label="Navegación principal">
            {desktopLinks.map((item) => <NavigationLink key={item.to} item={item} query={query} />)}
          </nav>
          <button type="button" className="saldo-rail-action" data-tour="add-movement" aria-haspopup="dialog" aria-controls="saldo-movement-dialog" aria-expanded={movementOpen} onClick={openMovement}>
            <Plus size={19} aria-hidden="true" /> Registrar movimiento
          </button>
        </aside>

        <div className="saldo-app-body">
          <header className="saldo-topbar">
            <Link to={`/?${query}`} className="saldo-topbar-brand"><BrandLogo /></Link>
            <div className="saldo-topbar-actions">
              <Link to={`/analisis?${query}`} state={{ useCurrentAnalyticsPeriod: true }} className="saldo-topbar-shortcut" aria-label="Análisis">
                <ChartNoAxesColumnIncreasing size={20} aria-hidden="true" />
                <span>Análisis</span>
              </Link>
              <Link to={`/analisis?${query}&vista=egresos#saldo-upcoming-title`} className="saldo-topbar-shortcut" aria-label="Próximos pagos">
                <CalendarClock size={20} aria-hidden="true" />
                <span>Próximos pagos</span>
              </Link>
              <PaymentNotifications query={query} />
              <Link to={`/perfil?${query}`} className="saldo-topbar-profile" aria-label="Abrir mi perfil">
                <span className="saldo-topbar-name">{user?.name}</span>
                <span className="saldo-avatar" aria-hidden="true">{initials}</span>
              </Link>
            </div>
          </header>
          <main className="saldo-main"><Outlet /></main>
        </div>

        <nav className="saldo-dock" aria-label="Navegación principal">
          <NavigationLink item={home} query={query} />
          <NavigationLink item={{ ...income, end: true }} query={query} />
          <button type="button" className="saldo-dock-action" data-tour="add-movement" aria-label="Registrar movimiento" aria-haspopup="dialog" aria-controls="saldo-movement-dialog" aria-expanded={movementOpen} onClick={openMovement}>
            <Plus size={23} aria-hidden="true" />
          </button>
          <NavigationLink item={{ ...expenses, end: true }} query={query} />
          <NavigationLink item={profile} query={query} />
        </nav>
      </div>
      <dialog id="saldo-movement-dialog" ref={movementDialog} className="saldo-movement-dialog" aria-labelledby="saldo-movement-title" onClose={() => setMovementOpen(false)}>
        <h2 id="saldo-movement-title">Registrar movimiento</h2>
        <div className="saldo-movement-options">
          {movementOptions.map(({ route, label, detail, icon: Icon }) => (
            <Link key={route} to={`${route}?${query}`} className="saldo-movement-option" onClick={() => movementDialog.current.close()}>
              <Icon size={21} aria-hidden="true" />
              <span><strong>{label}</strong><small>{detail}</small></span>
            </Link>
          ))}
        </div>
        <button type="button" className="saldo-movement-cancel" onClick={() => movementDialog.current.close()}>Cancelar</button>
      </dialog>
      {showIntro && <BrandIntro onComplete={finishIntro} />}
      {showTour && <SaldoTour
        onFinish={() => {
          finishTour()
          document.getElementById('saldo-home-heading')?.focus({ preventScroll: true })
        }}
        onAddMovement={() => {
          finishTour()
          // Give the next dialog a stable focus return point when it closes.
          const trigger = [...document.querySelectorAll('[data-tour="add-movement"]')].find((item) => item.getClientRects().length)
          trigger?.focus({ preventScroll: true })
          openMovement()
        }}
        onAnalysis={() => finishTour('/analisis')}
      />}
    </div>
  )
}
