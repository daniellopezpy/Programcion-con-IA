import { useId } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { FormField } from '@/components/FormField'
import { formatDate } from '@/lib/utils'
import './movement-details.css'

export function MovementDetails({ open, onToggle, values, errors, onChange, today, minDate, children }) {
  const panelId = useId()
  const dateLabel = !values.fecha
    ? 'Elige una fecha'
    : values.fecha === today
      ? `Hoy, ${formatDate(today)}`
      : formatDate(values.fecha)

  return (
    <div className="movement-details">
      <button
        type="button"
        className="movement-details-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <CalendarDays size={20} aria-hidden="true" />
        <span>
          <strong>Fecha y detalles</strong>
          <small>{dateLabel}</small>
        </span>
        <ChevronDown size={18} className="movement-details-chevron" aria-hidden="true" />
      </button>
      <div id={panelId} hidden={!open}>
        <div className="movement-details-fields">
          <FormField
            className="activity-form-field"
            id="fecha"
            name="fecha"
            label="Fecha"
            type="date"
            min={minDate}
            max={today}
            value={values.fecha}
            onChange={onChange}
            error={errors.fecha}
            disabled={!open}
            required
          />
          {children}
          <div className="grid min-w-0 gap-1.5">
            <label className="activity-form-label" htmlFor="notas">Notas <span>(opcional)</span></label>
            <textarea
              className="activity-form-control"
              id="notas"
              name="notas"
              rows={2}
              value={values.notas}
              onChange={onChange}
              aria-invalid={Boolean(errors.notas)}
              aria-describedby={errors.notas ? 'notas-error' : undefined}
              placeholder="Agrega un detalle"
            />
            {errors.notas && <p id="notas-error" role="alert" className="text-xs text-rose-700">{errors.notas}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
