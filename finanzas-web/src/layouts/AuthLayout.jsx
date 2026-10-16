import { ArrowUpRight, ChartNoAxesColumnIncreasing, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="auth-stage grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-white/10 bg-[#0d0d11]/55 px-12 py-10 text-white lg:flex lg:flex-col xl:px-20">
        <div className="pointer-events-none absolute -right-36 top-52 size-[34rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-20 top-[17rem] size-[25rem] rounded-full border border-white/10" />
        <Link to="/login" className="relative z-10 inline-flex w-fit items-center gap-2.5 text-lg font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-[#c5ed83] text-[#103d33]"><ChartNoAxesColumnIncreasing size={20} /></span>
          saldo<span className="text-[#c5ed83]">.</span>
        </Link>

        <div className="relative z-10 my-auto max-w-xl py-14">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6d3df]">
            <span className="size-1.5 rounded-full bg-[#c5ed83]" /> Finanzas personales, a tu ritmo
          </div>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.06] tracking-[-0.055em] xl:text-6xl">Que tus números cuenten <span className="font-serif italic text-[#c5ed83]">tu historia.</span></h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#aaa8b5]">Un espacio sencillo para entender tus hábitos y decidir con más calma.</p>

          <div className="mt-10 max-w-sm rounded-2xl border border-white/15 bg-[#111116]/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aaa8b5]"><span>Vista previa</span><ArrowUpRight size={16} className="text-[#c5ed83]" /></div>
            <div className="mt-6 flex items-end justify-between"><div><p className="text-xs text-[#aaa8b5]">Balance disponible</p><p className="mt-1 text-3xl font-semibold tracking-tight">Q 8,420<span className="text-lg text-[#aaa8b5]">.50</span></p></div><span className="rounded-full bg-[#c5ed83]/15 px-2.5 py-1 text-[10px] font-semibold text-[#c5ed83]">al día</span></div>
            <div className="mt-6 flex h-20 items-end gap-2" aria-hidden="true">{[28, 43, 35, 58, 47, 68, 56, 74, 62, 84, 68, 77].map((height, index) => <span key={index} className={`flex-1 rounded-t-sm ${index === 9 ? 'bg-[#edbd58]' : 'bg-[#9acb64]'}`} style={{ height: `${height}%`, opacity: index % 3 === 0 ? 1 : 0.7 }} />)}</div>
            <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.13em] text-[#858290]"><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span></div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#858290]"><ShieldCheck size={14} className="text-[#c5ed83]" /> Claridad para cada decisión</div>
        <div className="pointer-events-none absolute bottom-10 right-12 opacity-10"><Sparkles size={56} /></div>
      </section>

      <section className="relative z-10 flex min-h-screen flex-col px-6 py-8 text-white sm:px-10 lg:px-12 xl:px-20">
        <div className="mb-6 flex items-center justify-between lg:justify-end">
          <Link to="/login" className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-white lg:hidden">Saldo<span className="text-[#c5ed83]">.</span></Link>
          <p className="text-xs text-[#aaa8b5]">¿Ya tienes una cuenta? <Link to="/login" className="ml-1 font-semibold text-[#c5ed83] underline decoration-[#c5ed83]/50 underline-offset-4">Inicia sesión</Link></p>
        </div>
        <div className="grid flex-1 place-items-center py-4"><Outlet /></div>
        <div className="flex items-center justify-between pt-6 text-[9px] font-medium uppercase tracking-[0.15em] text-[#858290]"><span>© 2026 Saldo</span><span className="hidden sm:block">Hecho para verlo claro</span></div>
      </section>
    </main>
  )
}
