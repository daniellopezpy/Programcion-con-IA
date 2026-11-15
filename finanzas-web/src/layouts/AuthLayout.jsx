import { useEffect, useRef } from 'react'
import { ArrowRight, ChartNoAxesColumnIncreasing } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BrandLogo } from '@/components/BrandLogo'
import './saldo-auth.css'

export function AuthLayout() {
  const { pathname, hash, key, state } = useLocation()
  const accessRef = useRef(null)
  const isLogin = pathname === '/login'
  const isRegister = pathname === '/registro' || pathname === '/register'

  useEffect(() => {
    if (hash === '#acceso' && (isLogin || isRegister)) {
      accessRef.current?.focus({ preventScroll: true })
      accessRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
  }, [hash, isLogin, isRegister, key])

  return (
    <main className="saldo-auth">
      <section className="saldo-welcome" aria-labelledby="saldo-welcome-title">
        <Link to="/login" className="saldo-welcome-brand"><BrandLogo inverse /></Link>
        <div className="saldo-welcome-copy">
          <h2 id="saldo-welcome-title">Tu dinero.<strong>Mejores días.</strong></h2>
          <p>Organiza tus ingresos, controla tus gastos y sigue tus metas en un solo lugar.</p>
        </div>
        {isLogin ? (
          <>
            <div className="saldo-welcome-preview-space">
              <div className="saldo-welcome-preview">
                <dl>
                  <dt>Saldo del mes <ChartNoAxesColumnIncreasing size={22} aria-hidden="true" /></dt>
                  <dd>Q 2,450.00</dd>
                </dl>
                <p className="saldo-welcome-preview-note">Datos de ejemplo</p>
              </div>
            </div>
            <div className="saldo-welcome-actions">
              <Link to="/registro#acceso" className="saldo-welcome-action saldo-welcome-register">
                Crea tu cuenta <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="#acceso" state={state} className="saldo-welcome-sign-in">Iniciar sesión</Link>
            </div>
          </>
        ) : (
          <>
            <div className="saldo-welcome-art" aria-hidden="true">
              <img src="/saldo-wallet.webp" alt="" width="820" height="820" fetchPriority="high" />
            </div>
            <a href="#acceso" className="saldo-welcome-action">
              {isRegister ? 'Crear mi cuenta' : 'Continuar'}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </>
        )}
      </section>

      <section ref={accessRef} id="acceso" className="saldo-auth-access" aria-labelledby="saldo-access-title" tabIndex="-1">
        <div className="saldo-auth-outlet"><Outlet /></div>
      </section>
    </main>
  )
}
