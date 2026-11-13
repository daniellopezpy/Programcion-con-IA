import { useId, useRef } from 'react'
import { Check, ChevronDown, Tag, X } from 'lucide-react'
import { categoryLabel } from '@/lib/category-label'
import './movement-category.css'

export function MovementCategoryField({ label, name, value, items, onChange, error, optional = false }) {
  const id = useId()
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const selected = items.find((item) => String(item.id) === value)
  const placeholder = optional ? 'Sin subcategoría' : 'Elige una categoría'
  const options = optional ? [{ id: '', nombre: placeholder }, ...items] : items

  function open() {
    const dialog = dialogRef.current
    if (dialog.open) return
    dialog.showModal()
    const activeOption = dialog.querySelector('[aria-pressed="true"]') ?? dialog.querySelector('.movement-category-options button')
    activeOption?.focus()
  }

  function select(nextValue) {
    if (nextValue !== value) onChange({ target: { name, value: nextValue } })
    dialogRef.current.close()
  }

  return (
    <div className="movement-category">
      <span className="activity-form-label" id={`${id}-label`}>
        {label}{optional && <span> (opcional)</span>}
      </span>
      <button
        ref={triggerRef}
        name={name}
        type="button"
        className="movement-category-trigger"
        data-chosen={Boolean(selected)}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="dialog"
        aria-controls={`${id}-dialog`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={options.length === 0}
        onClick={open}
      >
        <span className="movement-category-icon"><Tag size={17} aria-hidden="true" /></span>
        <span id={`${id}-value`}>{selected ? categoryLabel(selected.nombre) : placeholder}</span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-rose-700">{error}</p>}
      <dialog
        id={`${id}-dialog`}
        ref={dialogRef}
        className="movement-category-dialog"
        aria-labelledby={`${id}-title`}
        onClose={() => triggerRef.current?.focus({ preventScroll: true })}
      >
        <header>
          <h2 id={`${id}-title`}>{optional ? 'Elige una subcategoría' : 'Elige una categoría'}</h2>
          <button type="button" className="movement-category-close" aria-label="Cerrar" onClick={() => dialogRef.current.close()}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <ul className="movement-category-options" role="list">
          {options.map((item) => {
            const optionValue = String(item.id)
            const checked = value === optionValue
            return (
              <li key={item.id}>
                <button type="button" aria-pressed={checked} onClick={() => select(optionValue)}>
                  <span>{categoryLabel(item.nombre)}</span>
                  {checked && <Check size={19} aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      </dialog>
    </div>
  )
}
