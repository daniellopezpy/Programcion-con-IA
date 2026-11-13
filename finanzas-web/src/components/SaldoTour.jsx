import { useId, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import './saldo-tour.css'

const steps = [
  {
    target: 'wallet',
    title: 'Tu saldo del mes',
    description: 'Aquí ves lo que recibiste menos lo que gastaste. Puedes cambiar el mes arriba.',
  },
  {
    target: 'add-movement',
    title: 'Registra desde +',
    description: 'Usa + para registrar un ingreso o un egreso.',
    actionLabel: 'Registrar movimiento',
  },
  {
    target: 'analysis',
    title: 'Entiende tus gastos',
    description: 'En Análisis ves en qué gastaste y comparas ingresos, egresos y balance.',
    actionLabel: 'Abrir Análisis',
  },
]

const margin = 14
const halo = 4
const gap = 12

function getVisibleTarget(selector) {
  return Array.from(document.querySelectorAll(`[data-tour="${selector}"]`))
    .find((element) => element.getClientRects().length > 0)
}

function getViewport() {
  const viewport = window.visualViewport
  const left = viewport?.offsetLeft ?? 0
  const top = viewport?.offsetTop ?? 0
  const width = viewport?.width ?? document.documentElement.clientWidth
  const height = viewport?.height ?? window.innerHeight

  return { left, top, right: left + width, bottom: top + height, width, height }
}

function locatePanel(panel, bounds, target) {
  panel.style.maxWidth = `${Math.max(0, bounds.width - 2 * margin)}px`
  panel.style.maxHeight = `${Math.max(0, bounds.height - 2 * margin)}px`

  const { width, height } = panel.getBoundingClientRect()
  let left = bounds.left + (bounds.width - width) / 2
  let top = bounds.top + (bounds.height - height) / 2

  if (target) {
    const below = bounds.bottom - target.bottom - gap
    const above = target.top - bounds.top - gap
    left = target.left + (target.width - width) / 2

    if (below >= height + margin) {
      top = target.bottom + gap
    } else if (above >= height + margin) {
      top = target.top - gap - height
    } else if (bounds.right - target.right >= width + gap + margin) {
      left = target.right + gap
    } else if (target.left - bounds.left >= width + gap + margin) {
      left = target.left - width - gap
    } else {
      top = below >= above ? bounds.bottom - height - margin : bounds.top + margin
    }
  }

  panel.style.left = `${Math.max(bounds.left + margin, Math.min(left, bounds.right - width - margin))}px`
  panel.style.top = `${top}px`
}

function measureSpotlight(spotlight, target, bounds) {
  const rect = target?.getBoundingClientRect()
  if (!rect || rect.bottom <= bounds.top || rect.top >= bounds.bottom
    || rect.right <= bounds.left || rect.left >= bounds.right) return null

  const left = Math.max(bounds.left + 2, rect.left - halo)
  const top = Math.max(bounds.top + 2, rect.top - halo)
  const right = Math.min(bounds.right - 2, rect.right + halo)
  const bottom = Math.min(bounds.bottom - 2, rect.bottom + halo)
  const width = right - left
  const height = bottom - top

  if (width <= 0 || height <= 0) return null

  spotlight.style.left = `${left}px`
  spotlight.style.top = `${top}px`
  spotlight.style.width = `${width}px`
  spotlight.style.height = `${height}px`
  spotlight.style.borderRadius = getComputedStyle(target).borderRadius

  return { left, top, right, bottom, width, height }
}

export function SaldoTour({ onFinish, onAddMovement, onAnalysis }) {
  const [step, setStep] = useState(0)
  const dialogRef = useRef(null)
  const panelRef = useRef(null)
  const spotlightRef = useRef(null)
  const headingRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const current = steps[step]
  const isLast = step === steps.length - 1
  const targetAction = { 'add-movement': onAddMovement, analysis: onAnalysis }[current.target]

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const panel = panelRef.current
    const spotlight = spotlightRef.current
    const viewport = window.visualViewport
    const dock = document.querySelector('.saldo-dock')
    let frame = 0

    function targetViewport(bounds) {
      const dockRect = dock?.getBoundingClientRect()
      const bottom = current.target !== 'add-movement' && dockRect?.height > 0
        ? Math.min(bounds.bottom, dockRect.top)
        : bounds.bottom
      return { ...bounds, bottom }
    }

    function position() {
      const bounds = getViewport()
      const target = getVisibleTarget(current.target)
      const spot = measureSpotlight(spotlight, target, targetViewport(bounds))
      dialog.toggleAttribute('data-spotlight', Boolean(spot))
      locatePanel(panel, bounds, spot)

      if (spotlight instanceof HTMLButtonElement) {
        const panelRect = panel.getBoundingClientRect()
        const separated = spot && (spot.top >= panelRect.bottom || spot.bottom <= panelRect.top
          || spot.left >= panelRect.right || spot.right <= panelRect.left)
        const clickable = Boolean(separated && spot.width >= 44 && spot.height >= 44)
        spotlight.disabled = !clickable
        dialog.toggleAttribute('data-target-action', clickable)
      }
    }

    function schedulePosition() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(position)
    }

    const target = getVisibleTarget(current.target)
    const rect = target?.getBoundingClientRect()
    const bounds = targetViewport(getViewport())
    if (rect && (rect.top < bounds.top || rect.bottom > bounds.bottom)) {
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
    }

    position()
    headingRef.current.focus({ preventScroll: true })
    const observer = new ResizeObserver(schedulePosition)
    observer.observe(panel)
    observer.observe(document.body)
    document.querySelectorAll(`[data-tour="${current.target}"]`).forEach((element) => observer.observe(element))
    window.addEventListener('scroll', schedulePosition, true)
    window.addEventListener('resize', schedulePosition)
    viewport?.addEventListener('scroll', schedulePosition)
    viewport?.addEventListener('resize', schedulePosition)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedulePosition, true)
      window.removeEventListener('resize', schedulePosition)
      viewport?.removeEventListener('scroll', schedulePosition)
      viewport?.removeEventListener('resize', schedulePosition)
      cancelAnimationFrame(frame)
    }
  }, [current])

  function finish(action = onFinish) {
    dialogRef.current.close()
    action()
  }

  return (
    <dialog
      className="saldo-tour"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        finish()
      }}
    >
      <section className="saldo-tour-panel" ref={panelRef}>
        <div className="saldo-tour-meta">
          <span>Paso {step + 1} de {steps.length}</span>
          <button type="button" className="saldo-tour-link" onClick={() => finish()}>Omitir guía</button>
        </div>
        <h2 id={titleId} ref={headingRef} tabIndex={-1} aria-describedby={descriptionId}>{current.title}</h2>
        <p id={descriptionId}>{current.description}</p>
        {targetAction && (
          <button type="button" className="saldo-tour-link saldo-tour-fallback" onClick={() => finish(targetAction)}>
            {current.actionLabel}
          </button>
        )}
        <div className="saldo-tour-actions">
          {step > 0 && (
            <button type="button" className="saldo-tour-link" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} aria-hidden="true" /> Atrás
            </button>
          )}
          <button type="button" className="saldo-tour-next" onClick={() => isLast ? finish() : setStep(step + 1)}>
            {isLast ? 'Terminar' : 'Siguiente'}
            {!isLast && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </section>
      {targetAction ? (
        <button
          type="button"
          className="saldo-tour-spotlight"
          ref={spotlightRef}
          aria-label={current.actionLabel}
          onClick={() => finish(targetAction)}
        />
      ) : (
        <div className="saldo-tour-spotlight" ref={spotlightRef} aria-hidden="true" />
      )}
    </dialog>
  )
}
