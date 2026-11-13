import { createContext, useCallback, useContext, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCurrentPeriod } from '@/lib/utils'

// oxlint-disable react/only-export-components -- The provider and its hook are intentionally colocated.

const DashboardPeriodContext = createContext(null)

function normalizePeriod(searchParams) {
  const current = getCurrentPeriod()
  const year = Number(searchParams.get('anio'))
  const month = Number(searchParams.get('mes'))

  return {
    anio: Number.isInteger(year) && year >= 2000 && year <= 2100 ? String(year) : current.anio,
    mes: Number.isInteger(month) && month >= 1 && month <= 12 ? String(month) : current.mes,
  }
}

export function DashboardPeriodProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = useMemo(() => normalizePeriod(searchParams), [searchParams])
  const query = useMemo(() => new URLSearchParams(period).toString(), [period])

  const setPeriod = useCallback((updates) => {
    setSearchParams((current) => {
      const next = { ...period, ...updates }
      const params = new URLSearchParams(current)
      params.set('anio', next.anio)
      params.set('mes', next.mes)
      return params
    }, { replace: true })
  }, [period, setSearchParams])

  const value = useMemo(() => ({ period, query, setPeriod }), [period, query, setPeriod])

  return <DashboardPeriodContext.Provider value={value}>{children}</DashboardPeriodContext.Provider>
}

export function useDashboardPeriod() {
  const value = useContext(DashboardPeriodContext)
  if (!value) throw new Error('useDashboardPeriod debe usarse dentro de DashboardPeriodProvider')
  return value
}
