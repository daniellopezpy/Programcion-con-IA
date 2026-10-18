import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency, shortMonthName } from '@/lib/utils'

const categoryConfig = {
  total: { label: 'Egresos', color: 'var(--chart-2)' },
}

const annualConfig = {
  ingresos: { label: 'Ingresos', color: 'var(--chart-1)' },
  egresos: { label: 'Egresos', color: 'var(--chart-2)' },
  balance: { label: 'Balance', color: 'var(--chart-3)' },
}

function ChartCard({ title, description, children }) {
  return <section className="border border-[#e7e5e4] bg-[#fafaf9] p-6"><div><h2 className="text-base font-semibold text-[#1c1917]">{title}</h2><p className="mt-1 text-sm text-[#57534e]">{description}</p></div><div className="mt-6">{children}</div></section>
}

export function CategoryExpensesChart({ data, loading }) {
  if (loading) return <ChartCard title="Egresos por categoría" description="Dónde se concentra tu gasto este mes."><div className="h-[290px] animate-pulse bg-[#efedeb]" /></ChartCard>
  if (!data?.length) return <ChartCard title="Egresos por categoría" description="Dónde se concentra tu gasto este mes."><div className="grid h-[290px] place-items-center bg-[#f5f5f4] px-5 text-center text-sm text-[#78716c]">No hay egresos registrados en este período.</div></ChartCard>

  return <ChartCard title="Egresos por categoría" description="Dónde se concentra tu gasto este mes."><ChartContainer id="category-expenses" config={categoryConfig} className="h-[290px]"><BarChart data={data} layout="vertical" margin={{ left: 8, right: 70, top: 6, bottom: 4 }}><CartesianGrid horizontal={false} stroke="var(--chart-grid)" /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 11 }} tickFormatter={(value) => `Q${Math.round(value)}`} /><YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} width={104} tick={{ fill: '#78716c', fontSize: 11 }} /><RechartsTooltip cursor={{ fill: '#f5f5f4' }} content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} /><Bar dataKey="total" name="Egresos" fill="var(--color-total)" barSize={22}><LabelList dataKey="total" position="right" formatter={(value) => formatCurrency(value)} fill="#57534e" fontSize={10} /></Bar></BarChart></ChartContainer></ChartCard>
}

export function AnnualEvolutionChart({ data, loading }) {
  if (loading) return <ChartCard title="Evolución anual" description="Comparación de tus movimientos mes a mes."><div className="h-[290px] animate-pulse bg-[#efedeb]" /></ChartCard>
  if (!data?.length) return <ChartCard title="Evolución anual" description="Comparación de tus movimientos mes a mes."><div className="grid h-[290px] place-items-center bg-[#f5f5f4] px-5 text-center text-sm text-[#78716c]">No hay datos anuales disponibles.</div></ChartCard>

  const chartData = data.map((item) => ({ ...item, periodo: shortMonthName(item.mes) }))
  return <ChartCard title="Evolución anual" description="Comparación de tus movimientos mes a mes."><ChartContainer id="annual-evolution" config={annualConfig} className="h-[290px]"><LineChart data={chartData} margin={{ left: 2, right: 12, top: 8, bottom: 4 }}><CartesianGrid vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Q${Math.round(value / 1000)}k`} tick={{ fill: '#78716c', fontSize: 11 }} /><RechartsTooltip cursor={{ stroke: '#d6d3d1' }} content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} /><ChartLegendContent verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ color: '#57534e', fontSize: 11 }} /><Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--color-ingresos)" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="egresos" name="Egresos" stroke="var(--color-egresos)" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="balance" name="Balance" stroke="var(--color-ingresos)" strokeWidth={2.5} dot={({ cx, cy, payload }) => payload.balance < 0 ? <circle cx={cx} cy={cy} r={4} fill="var(--chart-3)" stroke="#fafaf9" strokeWidth={2} /> : null} activeDot={{ r: 5 }} /></LineChart></ChartContainer></ChartCard>
}
