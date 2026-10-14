export function FormField({ id, label, error, hint, className = '', ...inputProps }) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label className="text-sm font-semibold text-[#293a34]" htmlFor={id}>{label}</label>
      <input
        id={id}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#20352e] shadow-sm outline-none transition placeholder:text-[#a2ada7] focus:border-[#508c72] focus:ring-4 focus:ring-[#508c72]/10 ${error ? 'border-rose-400' : 'border-[#dce4dd]'}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {error ? <p id={`${id}-error`} role="alert" className="text-xs leading-5 text-rose-700">{error}</p> : null}
      {!error && hint ? <p id={`${id}-hint`} className="text-xs text-[#829087]">{hint}</p> : null}
    </div>
  )
}

export function FormMessage({ children, tone = 'error' }) {
  if (!children) return null
  const color = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
  return <p role="alert" className={`rounded-xl border px-3.5 py-3 text-sm ${color}`}>{children}</p>
}
