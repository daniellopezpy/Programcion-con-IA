import { useCallback, useEffect, useRef, useState } from 'react'
import { loadRecurringPayments } from './recurring-payments'

export function useRecurringPayments(userId) {
  const [records, setRecords] = useState({ payments: [], error: '', loading: true })
  const request = useRef(null)

  const refresh = useCallback(async () => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    try {
      const payments = await loadRecurringPayments(userId, controller.signal)
      if (!controller.signal.aborted) setRecords({ payments, error: '', loading: false })
    } catch {
      if (!controller.signal.aborted) setRecords((current) => ({ ...current, error: 'No pudimos sincronizar tus pagos.', loading: false }))
    }
  }, [userId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Read from the account when mounting.
    refresh()
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      request.current?.abort()
      window.removeEventListener('focus', refresh)
      window.clearInterval(timer)
    }
  }, [refresh])

  return { ...records, refresh }
}
