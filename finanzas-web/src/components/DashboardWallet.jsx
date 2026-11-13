import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChartNoAxesColumnIncreasing, ChevronsDown, ChevronsUp, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import { dateInGuatemala, sumPeriodAmounts } from '@/lib/period-recap'
import { formatCurrency, formatDate } from '@/lib/utils'
import './dashboard-wallet.css'

const swipeThreshold = 38
const travelRatio = 0.7

function currentPosition(stack, travel) {
  const transform = getComputedStyle(stack.querySelector('.saldo-wallet-month')).transform
  if (transform === 'none') return 0
  return Math.max(0, Math.min(1, -new DOMMatrixReadOnly(transform).m42 / travel))
}

function endDrag(stack) {
  stack.removeAttribute('data-dragging')
  stack.style.removeProperty('--wallet-position')
}

function WalletAmount({ amount, loading, visible, negative = false }) {
  const [whole, cents] = amount.split('.')
  return (
    <p className="saldo-wallet-amount" aria-live="polite" aria-busy={visible && loading} data-negative={visible && negative} data-wide={visible && whole.length > 12 ? '' : undefined}>
      {visible ? <>{whole}{cents && <span className="saldo-wallet-cents">.{cents}</span>}</> : <><span aria-hidden="true">••••</span><span className="sr-only">Importe oculto</span></>}
    </p>
  )
}

function WalletVisibility({ visible, label, onToggle }) {
  const VisibilityIcon = visible ? Eye : EyeOff
  return (
    <button
      type="button"
      className="saldo-wallet-visibility"
      aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      onClick={onToggle}
    >
      <VisibilityIcon size={16} aria-hidden="true" />
    </button>
  )
}

export function DashboardWallet({ name, balance, savings, loading, expenseRevision = 0 }) {
  const swipeStart = useRef(null)
  const [visible, setVisible] = useState(true)
  const [view, setView] = useState(null)
  const [today, setToday] = useState(dateInGuatemala)
  const [dailyRequested, setDailyRequested] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [dailyResult, setDailyResult] = useState(null)
  const showExpenses = view === 'expenses'
  const requestKey = `${today}:${expenseRevision}:${attempt}`
  const daily = dailyResult?.key === requestKey ? dailyResult : null
  const amount = loading ? '…' : balance == null ? '—' : formatCurrency(balance)
  const dailyAmount = !daily ? '…' : daily.error ? '—' : formatCurrency(daily.total)
  const SwitchIcon = showExpenses ? ChevronsDown : ChevronsUp

  function swap() {
    setToday(dateInGuatemala())
    setDailyRequested(true)
    setView((current) => current === 'expenses' ? 'balance' : 'expenses')
  }

  function startSwipe(event) {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    if (!event.isPrimary || event.target.closest('button, a, input')) {
      clearSwipe(event.currentTarget)
      return
    }
    swipeStart.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      view,
      drag: null,
    }
  }

  function clearSwipe(stack) {
    swipeStart.current = null
    endDrag(stack)
  }

  function moveSwipe(event) {
    const start = swipeStart.current
    if (start?.id !== event.pointerId || start.view !== view) return

    const stack = event.currentTarget
    const dx = Math.abs(event.clientX - start.x)
    const dy = start.y - event.clientY
    if (!start.drag) {
      if (Math.max(dx, Math.abs(dy)) < 5) return
      if (dx >= Math.abs(dy)) {
        clearSwipe(stack)
        return
      }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const travel = stack.getBoundingClientRect().height * travelRatio
      if (travel <= 0) return
      start.drag = { travel, position: currentPosition(stack, travel) }
      stack.setAttribute('data-dragging', '')
      if (!showExpenses && dy > 0) {
        setToday(dateInGuatemala())
        setDailyRequested(true)
      }
    }

    const { position, travel } = start.drag
    const progress = Math.max(0, Math.min(1, position + dy / travel))
    stack.style.setProperty('--wallet-position', String(progress))
  }

  function cancelSwipe(event) {
    if (swipeStart.current?.id === event.pointerId) clearSwipe(event.currentTarget)
  }

  function finishSwipe(event) {
    const start = swipeStart.current
    if (start?.id !== event.pointerId) return
    const dx = Math.abs(event.clientX - start.x)
    const dy = event.clientY - start.y
    const distance = showExpenses ? dy : -dy
    // Resolve the dragged pose before starting the transition, even on a quick release.
    if (start.drag) currentPosition(event.currentTarget, start.drag.travel)
    if (start.view === view && distance >= swipeThreshold && distance > dx) swap()
    clearSwipe(event.currentTarget)
  }

  useEffect(() => {
    if (!showExpenses) return
    function refreshDay() { setToday(dateInGuatemala()) }
    const clock = setInterval(refreshDay, 60_000)
    document.addEventListener('visibilitychange', refreshDay)
    return () => {
      clearInterval(clock)
      document.removeEventListener('visibilitychange', refreshDay)
    }
  }, [showExpenses])

  useEffect(() => {
    if (!dailyRequested) return
    const [year, month] = today.split('-')
    const query = new URLSearchParams({ anio: year, mes: String(Number(month)) })
    let active = true

    api.get(`/egresos?${query}`).then(
      (expenses) => {
        if (active) setDailyResult({ key: requestKey, total: sumPeriodAmounts(expenses, { start: today, end: today }) / 100 })
      },
      () => { if (active) setDailyResult({ key: requestKey, error: true }) },
    )
    return () => { active = false }
  }, [dailyRequested, requestKey, today])

  function toggleVisible() { setVisible((current) => !current) }

  return (
    <div className="saldo-wallet-deck">
      <div
        className="saldo-wallet-stack"
        data-tour="wallet"
        data-view={view}
        onPointerDown={startSwipe}
        onPointerMove={moveSwipe}
        onPointerUp={finishSwipe}
        onPointerCancel={cancelSwipe}
        onLostPointerCapture={cancelSwipe}
      >
        <section
          className="saldo-wallet saldo-wallet-month"
          id="saldo-wallet-month"
          aria-labelledby="saldo-wallet-title"
          aria-hidden={showExpenses || undefined}
          inert={showExpenses}
        >
          <div className="saldo-wallet-top">
            <h2 id="saldo-wallet-title">Saldo del mes</h2>
            <WalletVisibility visible={visible} label="saldo" onToggle={toggleVisible} />
            <ChartNoAxesColumnIncreasing className="saldo-wallet-mark" size={24} aria-hidden="true" />
          </div>
          <WalletAmount amount={amount} loading={loading} visible={visible} negative={Number(balance) < 0} />
          <div className="saldo-wallet-footer">
            <span>{name?.trim() || 'Mi billetera'}</span>
          </div>
        </section>
        <section
          className="saldo-wallet saldo-wallet-daily"
          id="saldo-wallet-daily"
          aria-labelledby="saldo-wallet-daily-title"
          aria-hidden={!showExpenses || undefined}
          inert={!showExpenses}
        >
          <div className="saldo-wallet-top">
            <h2 id="saldo-wallet-daily-title">Gastos de hoy</h2>
            <WalletVisibility visible={visible} label="gastos" onToggle={toggleVisible} />
            <ArrowUpRight className="saldo-wallet-mark" size={24} aria-hidden="true" />
          </div>
          <WalletAmount amount={dailyAmount} loading={!daily} visible={visible} />
          <div className="saldo-wallet-footer">
            {daily?.error
              ? <><span role="status">No pudimos cargar tus gastos.</span><button type="button" className="saldo-wallet-retry" onClick={() => setAttempt((current) => current + 1)}>Reintentar</button></>
              : <time dateTime={today}>{formatDate(today)}</time>}
          </div>
        </section>
      </div>
      {savings && balance != null && (
        <dl className="saldo-wallet-available">
          <div><dt>Apartado este mes</dt><dd>{visible ? formatCurrency(savings.monto_apartado) : '••••'}</dd></div>
          <div><dt>Disponible tras apartar</dt><dd>{visible ? formatCurrency((Math.round(Number(balance) * 100) - Math.round(Number(savings.monto_apartado ?? 0) * 100)) / 100) : '••••'}</dd></div>
        </dl>
      )}
      <button type="button" className="saldo-wallet-switch" aria-controls={showExpenses ? 'saldo-wallet-month' : 'saldo-wallet-daily'} onClick={swap}>
        <SwitchIcon size={18} aria-hidden="true" />
        {showExpenses ? 'Volver al saldo del mes' : 'Ver gastos de hoy'}
      </button>
    </div>
  )
}
