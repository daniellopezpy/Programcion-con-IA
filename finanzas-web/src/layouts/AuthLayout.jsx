import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="grid min-h-screen bg-[#fafaf9] text-[#1c1917] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden min-h-screen border-r border-[#e7e5e4] bg-[#f5f5f4] px-12 py-10 lg:flex lg:flex-col xl:px-20">
        <Link to="/login" className="thought-serif inline-flex w-fit items-center gap-2 text-xl font-bold">Saldo<span className="text-[#78716c]">.</span></Link>
        <div className="my-auto max-w-lg py-14">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#78716c]">Finanzas personales, a tu ritmo</p>
          <h1 className="thought-serif max-w-md text-4xl font-bold leading-[1.25] tracking-[-0.03em] text-[#1c1917] xl:text-5xl">Que tus números cuenten tu historia.</h1>
          <p className="mt-6 max-w-md text-[17px] leading-[1.8] text-[#57534e]">Un espacio sencillo para entender tus hábitos y decidir con más calma.</p>
          <div className="mt-12 max-w-sm border border-[#d6d3d1] bg-[#fafaf9] p-8">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a8a29e]"><span>Vista previa</span><ArrowUpRight size={16} className="text-[#78716c]" /></div>
            <div className="mt-10 flex items-end justify-between"><div><p className="text-[13px] text-[#57534e]">Balance disponible</p><p className="thought-serif mt-2 text-3xl font-bold text-[#1c1917]">Q 8,420<span className="text-lg font-normal text-[#78716c]">.50</span></p></div><span className="border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[11px] font-semibold text-[#65a30d]">al día</span></div>
            <div className="mt-10 flex h-20 items-end gap-2" aria-hidden="true">{[28, 43, 35, 58, 47, 68, 56, 74, 62, 84, 68, 77].map((height, index) => <span key={index} className={`${index === 9 ? 'bg-[#ca8a04]' : 'bg-[#78716c]'}`} style={{ height: `${height}%`, opacity: index % 3 === 0 ? 1 : 0.55 }} />)}</div>
            <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.08em] text-[#a8a29e]"><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#78716c]"><ShieldCheck size={14} /> Claridad para cada decisión</div>
      </section>
      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16 xl:px-24">
        <div className="mb-6 flex items-center justify-between lg:justify-end"><Link to="/login" className="thought-serif inline-flex items-center gap-2 text-lg font-bold lg:hidden">Saldo<span className="text-[#78716c]">.</span></Link><p className="text-[13px] text-[#a8a29e]">¿Ya tienes una cuenta? <Link to="/login" className="ml-1 font-semibold text-[#78716c] underline underline-offset-4">Inicia sesión</Link></p></div>
        <div className="grid flex-1 place-items-center py-4"><Outlet /></div>
        <div className="flex items-center justify-between border-t border-[#e7e5e4] pt-6 text-[11px] text-[#a8a29e]"><span>© 2026 Saldo</span><span className="hidden sm:block">Hecho para verlo claro</span></div>
      </section>
    </main>
  )
}
