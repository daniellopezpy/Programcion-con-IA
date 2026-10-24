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
  return <section className="rounded-[1.25rem] border border-white/10 bg-[#111116] p-5 shadow-lg shadow-black/20"><div><h2 className="text-base font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-[#858290]">{description}</p></div><div className="mt-5">{children}</div></section>
}

export function CategoryExpensesChart({ data, loading }) {
  if (loading) return <ChartCard title="Egresos por categoría" description="Dónde se concentra tu gasto este mes."><div className="h-[290px] animate-pulse rounded-xl bg-white/5" /></ChartCard>
  if (!data?.length) return <ChartCard title="Egresos por categoría" description="Dónde se concentra tu gasto este mes."><div className="grid h-[290px] place-items-center rounded-xl bg-white/[0.03] px-5 text-center text-sm text-[#858290]">No hay egresos registrados en este período.</div></ChartCard>

  return <ChartCard title="Egresos por categoría" description="Dónde se concentra tu gasto este mes."><ChartContainer id="category-expenses" config={categoryConfig} className="h-[290px]"><BarChart data={data} layout="vertical" margin={{ left: 8, right: 70, top: 6, bottom: 4 }}><CartesianGrid horizontal={false} stroke="var(--chart-grid)" /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#858290', fontSize: 11 }} tickFormatter={(value) => `Q${Math.round(value)}`} /><YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} width={104} tick={{ fill: '#858290', fontSize: 11 }} /><RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} /><Bar dataKey="total" name="Egresos" fill="var(--color-total)" radius={[0, 6, 6, 0]} barSize={22}><LabelList dataKey="total" position="right" formatter={(value) => formatCurrency(value)} fill="#aaa8b5" fontSize={10} /></Bar></BarChart></ChartContainer></ChartCard>
}

export function AnnualEvolutionChart({ data, loading }) {
  if (loading) return <ChartCard title="Evolución anual" description="Comparación de tus movimientos mes a mes."><div className="h-[290px] animate-pulse rounded-xl bg-white/5" /></ChartCard>
  if (!data?.length) return <ChartCard title="Evolución anual" description="Comparación de tus movimientos mes a mes."><div className="grid h-[290px] place-items-center rounded-xl bg-white/[0.03] px-5 text-center text-sm text-[#858290]">No hay datos anuales disponibles.</div></ChartCard>

  const chartData = data.map((item) => ({ ...item, periodo: shortMonthName(item.mes) }))
  return <ChartCard title="Evolución anual" description="Comparación de tus movimientos mes a mes."><ChartContainer id="annual-evolution" config={annualConfig} className="h-[290px]"><LineChart data={chartData} margin={{ left: 2, right: 12, top: 8, bottom: 4 }}><CartesianGrid vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fill: '#858290', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Q${Math.round(value / 1000)}k`} tick={{ fill: '#858290', fontSize: 11 }} /><RechartsTooltip cursor={{ stroke: 'rgba(255,255,255,0.2)' }} content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} /><ChartLegendContent verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ color: '#aaa8b5', fontSize: 11 }} /><Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--color-ingresos)" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="egresos" name="Egresos" stroke="var(--color-egresos)" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="balance" name="Balance" stroke="var(--color-ingresos)" strokeWidth={2.5} dot={({ cx, cy, payload }) => payload.balance < 0 ? <circle cx={cx} cy={cy} r={4} fill="var(--chart-3)" stroke="#111116" strokeWidth={2} /> : null} activeDot={{ r: 5 }} /></LineChart></ChartContainer></ChartCard>
}
