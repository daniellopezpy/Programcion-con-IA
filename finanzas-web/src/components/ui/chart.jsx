import { createContext, useContext } from 'react'
import { Legend, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

const ChartContext = createContext(null)

export function ChartContainer({ id, config, className, children }) {
  const variables = Object.fromEntries(
    Object.entries(config || {}).map(([key, value]) => [`--color-${key}`, value.color || 'currentColor']),
  )

  return (
    <ChartContext.Provider value={config || {}}>
      <div data-chart={id} className={cn('h-full w-full text-xs', className)} style={variables}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export function ChartTooltipContent({ active, payload, label, formatter }) {
  const config = useContext(ChartContext)
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-white/10 bg-[#18181e] px-3 py-2.5 shadow-xl shadow-black/30">
      {label && <p className="mb-1.5 text-[11px] font-semibold text-[#aaa8b5]">{label}</p>}
      <div className="grid gap-1.5">
        {payload.map((entry) => {
          const item = config[entry.dataKey] || {}
          const rendered = formatter ? formatter(entry.value, entry.dataKey) : entry.value
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-5 text-xs">
              <span className="flex items-center gap-1.5 text-[#aaa8b5]"><span className="size-2 rounded-full" style={{ backgroundColor: `var(--color-${entry.dataKey})` }} />{item.label || entry.name}</span>
              <strong className="font-semibold text-white">{rendered}</strong>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChartLegendContent(props) {
  return <Legend {...props} />
}

export { Tooltip }
