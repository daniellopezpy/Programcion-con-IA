export function FormField({ id, label, error, hint, dark = false, className = '', ...inputProps }) {
  const labelClass = dark ? 'text-[#d6d3df]' : 'text-[#293a34]'
  const inputClass = dark ? 'border-white/10 bg-[#111116] text-white placeholder:text-[#6f6c7b] focus:border-[#ae7bff] focus:ring-[#ae7bff]/15' : 'border-[#dce4dd] bg-white text-[#20352e] placeholder:text-[#a2ada7] focus:border-[#508c72] focus:ring-[#508c72]/10'
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label className={`text-sm font-semibold ${labelClass}`} htmlFor={id}>{label}</label>
      <input
        id={id}
        className={`h-11 w-full rounded-xl border px-3.5 text-sm shadow-sm outline-none transition focus:ring-4 ${inputClass} ${error ? 'border-rose-400' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {error ? <p id={`${id}-error`} role="alert" className="text-xs leading-5 text-rose-700">{error}</p> : null}
      {!error && hint ? <p id={`${id}-hint`} className={`text-xs ${dark ? 'text-[#858290]' : 'text-[#829087]'}`}>{hint}</p> : null}
    </div>
  )
}

export function FormMessage({ children, tone = 'error', dark = false }) {
  if (!children) return null
  const color = dark
    ? tone === 'success' ? 'border-[#c5ed83]/30 bg-[#c5ed83]/10 text-[#c5ed83]' : 'border-[#ff7d8f]/30 bg-[#ff7d8f]/10 text-[#ffb6c0]'
    : tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
  return <p role="alert" className={`rounded-xl border px-3.5 py-3 text-sm ${color}`}>{children}</p>
}
