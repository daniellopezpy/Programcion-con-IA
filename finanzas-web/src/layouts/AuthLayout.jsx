import { ArrowRight } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BrandLogo } from '@/components/BrandLogo'
import './saldo-auth.css'

export function AuthLayout() {
  const { pathname } = useLocation()
  const isRegister = pathname === '/registro' || pathname === '/register'

  return (
    <main className="saldo-auth">
      <section className="saldo-welcome" aria-labelledby="saldo-welcome-title">
        <Link to="/login" className="saldo-welcome-brand"><BrandLogo inverse /></Link>
        <div className="saldo-welcome-copy">
          <h2 id="saldo-welcome-title">Tu dinero.<strong>Mejores días.</strong></h2>
          <p>Organiza tus ingresos, controla tus gastos y sigue tus metas en un solo lugar.</p>
        </div>
        <div className="saldo-welcome-art" aria-hidden="true">
          <img src="/saldo-wallet.webp" alt="" width="820" height="820" fetchPriority="high" />
        </div>
        <a href="#acceso" className="saldo-welcome-action">
          {isRegister ? 'Crear mi cuenta' : pathname.endsWith('-contrasena') ? 'Continuar' : 'Iniciar sesión'}
          <ArrowRight size={18} aria-hidden="true" />
        </a>
      </section>

      <section id="acceso" className="saldo-auth-access" tabIndex="-1">
        <div className="saldo-auth-outlet"><Outlet /></div>
      </section>
    </main>
  )
}
