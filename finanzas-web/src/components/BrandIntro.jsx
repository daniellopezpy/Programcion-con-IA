import { useEffect } from 'react'
import { BrandLogo } from '@/components/BrandLogo'

export function BrandIntro({ onComplete }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(onComplete, reducedMotion ? 180 : 3000)
    return () => window.clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="brand-intro saldo-intro" role="dialog" aria-label="Abriendo Saldo">
      <div className="saldo-intro-content">
        <BrandLogo inverse />
      </div>
      <button type="button" className="saldo-intro-skip" onClick={onComplete}>Saltar</button>
    </div>
  )
}
