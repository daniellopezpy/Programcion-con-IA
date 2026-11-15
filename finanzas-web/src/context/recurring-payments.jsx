import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { dateInGuatemala } from '@/lib/period-recap'
import { loadRecurringPayments } from '@/lib/recurring-payments'

// oxlint-disable react/only-export-components -- The provider and its hook are intentionally colocated.

const RecurringPaymentsContext = createContext(null)

// Single owner of the recurring payments requests for the signed-in account.
// Mount it with `key={userId}` so a new account always starts empty and loading.
export function RecurringPaymentsProvider({ userId, children }) {
  const [records, setRecords] = useState({ payments: [], error: '', loading: true })
  const [today, setToday] = useState(dateInGuatemala)
  const request = useRef(null)

  const refresh = useCallback(async () => {
    if (userId == null) return
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
    const sync = () => {
      setToday(dateInGuatemala())
      refresh()
    }
    // oxlint-disable-next-line react/set-state-in-effect -- Read from the account when mounting.
    refresh()
    window.addEventListener('focus', sync)
    const timer = window.setInterval(sync, 60_000)
    return () => {
      request.current?.abort()
      window.removeEventListener('focus', sync)
      window.clearInterval(timer)
    }
  }, [refresh])

  const { payments, error, loading } = records
  const value = useMemo(() => ({ payments, error, loading, today, refresh }), [payments, error, loading, today, refresh])

  return <RecurringPaymentsContext.Provider value={value}>{children}</RecurringPaymentsContext.Provider>
}

export function useRecurringPayments() {
  const value = useContext(RecurringPaymentsContext)
  if (!value) throw new Error('useRecurringPayments debe usarse dentro de RecurringPaymentsProvider')
  return value
}

// Guatemala's date shared by the reminders and the queries that depend on "today".
export function useGuatemalaToday() {
  return useRecurringPayments().today
}
