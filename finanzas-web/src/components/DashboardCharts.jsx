import {
  Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart,
  ReferenceLine, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { categoryLabel } from '@/lib/category-label'
import { formatCurrency, monthName, shortMonthName } from '@/lib/utils'
import './dashboard-charts.css'

const categoryColors = ['#123c30', '#3e835f', '#abc7a8', '#779d82', '#557463', '#c3d5bd']
const series = {
  egresos: { label: 'Gastos', color: '#123c30', title: 'Gastos por mes' },
  ingresos: { label: 'Ingresos', color: '#4c876d', title: 'Ingresos por mes' },
  balance: { label: 'Balance', color: '#78967f', title: 'Balance por mes' },
}
const compactCurrency = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const percent = new Intl.NumberFormat('es-GT', { style: 'percent', maximumFractionDigits: 1 })
const axisTick = { fill: '#596b60', fontSize: 11 }

function ChartCard({ title, period, loading, children }) {
  return (
    <section className="saldo-chart-card" aria-label={title} aria-busy={Boolean(loading)}>
      <div className="saldo-chart-heading">
        <h2>{title}</h2>
        {period && <span>{period}</span>}
      </div>
      {children}
    </section>
  )
}

function TrendTooltip({ active, payload, year }) {
  if (!active || !payload?.length) return null

  return (
    <div className="saldo-chart-tooltip">
      <p>{monthName(payload[0].payload.mes)}{year && ` ${year}`}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey}>
          <span>{series[entry.dataKey]?.label}</span>
          <strong>{formatCurrency(entry.value)}</strong>
        </div>
      ))}
    </div>
  )
}

function getCategoryBreakdown(data) {
  const categories = (data ?? [])
    .map(({ categoria_id, nombre, total }) => ({
      id: categoria_id,
      name: nombre === 'Otro Egreso' ? 'Otros gastos' : categoryLabel(nombre),
      cents: Math.round(Number(total) * 100),
    }))
    .filter(({ cents }) => Number.isFinite(cents) && cents > 0)
    .sort((a, b) => b.cents - a.cents)

  if (categories.length > categoryColors.length) {
    const grouped = categories.splice(categoryColors.length - 1)
    const cents = grouped.reduce((sum, item) => sum + item.cents, 0)
    categories.push({ id: 'others', name: 'Otras categorías', cents })
  }

  const total = categories.reduce((sum, item) => sum + item.cents, 0)
  return { total, categories: categories.map((item, index) => ({ ...item, fill: categoryColors[index] })) }
}

export function CategoryExpensesChart({ data, loading, period }) {
  const { total, categories } = getCategoryBreakdown(data)
  const hasExpenses = total > 0

  return (
    <ChartCard title="Gastos por categoría" period={period} loading={loading}>
      <div className="saldo-chart-donut">
        {hasExpenses && !loading ? (
          <div className="saldo-chart-donut-visual" aria-hidden="true">
            <ChartContainer id="category-expenses" config={{}}>
              <PieChart accessibilityLayer={false}>
                <Pie
                  data={categories}
                  dataKey="cents"
                  nameKey="name"
                  innerRadius="69%"
                  outerRadius="98%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={categories.length > 1 ? 2.2 : 0}
                  cornerRadius={7}
                  stroke="none"
                  isAnimationActive={false}
                />
              </PieChart>
            </ChartContainer>
          </div>
        ) : <div className="saldo-chart-donut-empty" aria-hidden="true" />}
        <div className="saldo-chart-donut-label">
          <strong>{loading ? '—' : formatCurrency(total / 100)}</strong>
          <span>Total de gastos</span>
        </div>
      </div>
      {loading && <p className="saldo-chart-empty" role="status">Cargando categorías…</p>}
      {!loading && !hasExpenses && <p className="saldo-chart-empty">Aún no hay gastos en este mes.</p>}
      {!loading && hasExpenses && (
        <ul className="saldo-chart-categories" aria-label="Participación por categoría">
          {categories.map(({ id, name, cents, fill }) => (
            <li key={id}>
              <span aria-hidden="true" style={{ backgroundColor: fill }} />
              <span>{name}</span>
              <strong title={formatCurrency(cents / 100)}>{percent.format(cents / total)}</strong>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}

export function AnnualEvolutionChart({ data, loading, metric, month, year }) {
  const title = series[metric]?.title ?? 'Totales por mes'
  const period = metric ? `Hasta ${monthName(month).toLowerCase()} de ${year}` : year
  const chartData = (data ?? [])
    .filter(({ mes }) => !metric || (Number(mes) > month - 6 && Number(mes) <= month))
    .map((item) => ({
      mes: item.mes,
      periodo: shortMonthName(item.mes),
      ingresos: Number(item.ingresos),
      egresos: Number(item.egresos),
      balance: Number(item.balance),
      fill: Number(item.mes) === month ? '#123c30' : '#a9c2ad',
    }))
  const hasValues = chartData.some((item) => metric && metric !== 'balance'
    ? item[metric] !== 0
    : item.ingresos !== 0 || item.egresos !== 0)
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--saldo-line, #dfe6db)" />
      <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={axisTick} />
      <YAxis
        orientation="right"
        width={48}
        axisLine={false}
        tickLine={false}
        tickFormatter={(value) => compactCurrency.format(value)}
        tick={axisTick}
        tickCount={4}
      />
      <Tooltip cursor={{ fill: '#dfe6db70' }} content={<TrendTooltip year={year} />} />
    </>
  )

  return (
    <ChartCard title={title} period={period} loading={loading}>
      {loading ? (
        <div className="saldo-chart-placeholder" role="status">Cargando gráfica…</div>
      ) : !hasValues ? (
        <p className="saldo-chart-placeholder">
          {metric === 'egresos' || metric === 'ingresos'
            ? `Aún no hay ${series[metric].label.toLowerCase()} en estos meses.`
            : 'Aún no hay movimientos en estos meses.'}
        </p>
      ) : (
        <>
          <div className="saldo-chart-trend">
            <ChartContainer id="annual-evolution" config={series}>
              {metric ? (
                <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  {axes}
                  {metric === 'balance' && <ReferenceLine y={0} stroke="#a2b4a4" />}
                  <Bar dataKey={metric} radius={[4, 4, 4, 4]} maxBarSize={36} isAnimationActive={false} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  {axes}
                  {Object.entries(series).map(([key, item]) => (
                    <Line
                      key={key}
                      dataKey={key}
                      name={item.label}
                      stroke={item.color}
                      type="monotone"
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              )}
            </ChartContainer>
          </div>
          {!metric && (
            <ul className="saldo-chart-series" aria-label="Series de la gráfica">
              {Object.values(series).map(({ label, color }) => (
                <li key={label}><span style={{ backgroundColor: color }} aria-hidden="true" />{label}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </ChartCard>
  )
}
