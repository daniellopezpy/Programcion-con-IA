import { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { categoryLabel } from '@/lib/category-label'

function csvText(value) {
  const text = String(value ?? '')
  // Excel can interpret cells beginning with these characters as formulas.
  const safe = /^[\t\r\n]|^\s*[=+\-@]/u.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function DownloadMovements({ query, filename }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)

  async function download() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')

    try {
      const [incomes, expenses] = await Promise.all([api.get(`/ingresos?${query}`), api.get(`/egresos?${query}`)])
      const rows = [
        ...incomes.map((item) => ({ ...item, tipo: item.egreso_devolucion_id ? 'Devolución' : 'Ingreso', concepto: item.fuente })),
        ...expenses.map((item) => ({ ...item, tipo: 'Gasto', concepto: item.descripcion })),
      ].sort((a, b) => a.fecha.localeCompare(b.fecha))
      const lines = ['Fecha,Tipo,Concepto,Categoría,Subcategoría,Monto (GTQ),Notas,Gasto vinculado']
      for (const row of rows) {
        lines.push([
          csvText(row.fecha.slice(0, 10)),
          csvText(row.tipo),
          csvText(row.concepto),
          csvText(categoryLabel(row.categoria?.nombre)),
          csvText(categoryLabel(row.subcategoria?.nombre)),
          Number(row.monto).toFixed(2),
          csvText(row.notas),
          row.egreso_devolucion_id ?? '',
        ].join(','))
      }
      const url = URL.createObjectURL(new Blob(['\uFEFF', lines.join('\r\n'), '\r\n'], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `saldo-${filename}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setError('No pudimos descargar los movimientos. Inténtalo de nuevo.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-1">
      <Button size="sm" variant="secondary" className="w-fit" onClick={download} disabled={busy}>
        <Download size={16} aria-hidden="true" /> {busy ? 'Preparando CSV…' : 'Descargar CSV'}
      </Button>
      {error && <p className="text-sm text-[var(--saldo-danger)]" role="alert">{error}</p>}
    </div>
  )
}
