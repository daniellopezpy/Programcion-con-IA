export function BrandLogo({ compact = false, inverse = false, className = '' }) {
  return (
    <span className={`saldo-brand-logo${inverse ? ' saldo-brand-logo-inverse' : ''} ${className}`} role="img" aria-label="Saldo">
      <span className="saldo-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="saldo-brand-bar" d="M5 14.5V18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path className="saldo-brand-bar" d="M10 10V18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path className="saldo-brand-bar" d="M15 6V18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M19 6V18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.32" />
        </svg>
      </span>
      {!compact && <span aria-hidden="true">saldo<span className="saldo-brand-dot">.</span></span>}
    </span>
  )
}
