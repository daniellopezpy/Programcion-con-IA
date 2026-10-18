export function FormField({ id, label, error, hint, dark: _dark = false, className = '', ...inputProps }) {
  const labelClass = 'text-[#57534e]'
  const inputClass = 'border-[#d6d3d1] bg-[#fafaf9] text-[#1c1917] placeholder:text-[#a8a29e] focus:border-[#78716c] focus:ring-[#78716c]/15'
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label className={`text-sm font-semibold ${labelClass}`} htmlFor={id}>{label}</label>
      <input
        id={id}
        className={`thought-focus h-12 w-full border px-4 text-[15px] outline-none transition focus:ring-2 ${inputClass} ${error ? 'border-[#dc2626]' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {error ? <p id={`${id}-error`} role="alert" className="text-[13px] leading-5 text-[#dc2626]">{error}</p> : null}
      {!error && hint ? <p id={`${id}-hint`} className="text-[13px] text-[#a8a29e]">{hint}</p> : null}
    </div>
  )
}

export function FormMessage({ children, tone = 'error', dark: _dark = false }) {
  if (!children) return null
  const color = tone === 'success' ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#65a30d]' : 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]'
  return <p role="alert" className={`border px-4 py-3 text-sm ${color}`}>{children}</p>
}
