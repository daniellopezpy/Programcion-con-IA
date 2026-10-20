import { Button } from '@/components/ui/button'

export function PaginationControls({ pagination, onPageChange, label }) {
  if (!pagination || pagination.last_page <= 1) return null

  const from = pagination.from ?? 0
  const to = pagination.to ?? 0

  return (
    <nav className="flex flex-col gap-4 border-t border-[#e7e5e4] px-6 py-4 text-xs text-[#78716c] sm:flex-row sm:items-center sm:justify-between" aria-label={`Paginación de ${label}`}>
      <p>Mostrando {from}–{to} de {pagination.total}</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={pagination.current_page <= 1} onClick={() => onPageChange(pagination.current_page - 1)}>
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => onPageChange(pagination.current_page + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  )
}
