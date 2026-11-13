import { useEffect, useId, useRef, useState } from 'react'
import { CalendarDays, Check, CreditCard, Plus, Trash2 } from 'lucide-react'
import { FormField, FormMessage } from '@/components/FormField'
import { MoneyField } from '@/components/MoneyField'
import { Button } from '@/components/ui/button'
import { moneyAmount } from '@/lib/money-input'
import { getSaldoPreferences, saveSaldoPreferences } from '@/lib/saldo-preferences'
import './finance-setup.css'

const paymentCadences = {
  quincenal: 'Por quincena',
  mensual: 'Una vez al mes',
  semanal: 'Cada semana',
  variable: 'Varía',
}
const cardTypes = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', otra: 'Otra' }

function Choices({ id, title, options, value, onChange }) {
  return (
    <fieldset className="finance-choices">
      <legend>{title}</legend>
      <div className="finance-choice-list">
        {Object.entries(options).map(([key, label]) => (
          <label key={key}>
            <input type="radio" name={id} value={key} checked={value === key} onChange={() => onChange(key)} />
            <span>{label}</span><Check size={16} aria-hidden="true" />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function FinanceSetup({ userId, onSaved, onSkip }) {
  const id = useId()
  const heading = useRef(null)
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState(() => getSaldoPreferences(userId))
  const [error, setError] = useState('')
  const cardAnswer = draft.hasCards === null ? '' : draft.hasCards ? 'si' : 'no'

  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [step])

  function change(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  function updateCard(id, changes) {
    setDraft((current) => ({ ...current, cards: current.cards.map((card) => card.id === id ? { ...card, ...changes } : card) }))
    setError('')
  }

  function addCard(type) {
    const bytes = crypto.getRandomValues(new Uint8Array(12))
    const key = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    const next = { id: `card-${key}`, type, label: cardTypes[type] }
    change('cards', [...draft.cards, next])
  }

  function advance(event) {
    event.preventDefault()
    if (step === 1 && draft.hasCards && draft.cards.some(({ label }) => !label.trim() || /\d[\d\s-]{10,}\d/.test(label))) {
      setError('Pon un apodo corto a cada tarjeta. Evita escribir el número.')
      return
    }
    if (step < 3) { setStep(step + 1); return }
    if (draft.salary && !moneyAmount(draft.salary)) {
      setError('Escribe un monto mayor que cero o déjalo vacío.')
      return
    }
    if (!saveSaldoPreferences(userId, draft)) {
      setError('No pudimos guardar tus respuestas en este navegador.')
      return
    }
    onSaved()
  }

  return (
    <form className="finance-setup" onSubmit={advance}>
      <div className="finance-step-label">Paso {step} de 3</div>
      <h2 ref={heading} tabIndex={-1}>{['¿Usas tarjetas de crédito?', '¿Cada cuánto te pagan?', '¿Quieres dejar listo tu próximo ingreso?'][step - 1]}</h2>
      {step === 1 && (
        <>
          <Choices id={`${id}-uses-card`} title="Elige una opción" options={{ si: 'Sí', no: 'No' }} value={cardAnswer} onChange={(value) => change('hasCards', value === 'si')} />
          {draft.hasCards && (
            <div className="finance-card-list">
              <p><CreditCard size={17} aria-hidden="true" /> ¿Qué tarjetas quieres guardar?</p>
              <div className="finance-card-types">
                {Object.entries(cardTypes).map(([type, label]) => (
                  <Button key={type} variant="secondary" size="sm" disabled={draft.cards.length >= 6} onClick={() => addCard(type)}><Plus size={15} aria-hidden="true" /> {label}</Button>
                ))}
              </div>
              {draft.cards.map(({ id: cardId, label, type }, index) => (
                <div key={cardId} className="finance-card-row">
                  <FormField id={`${id}-${cardId}`} label={`Nombre para ${cardTypes[type]} ${index + 1}`} value={label} maxLength={32} placeholder={cardTypes[type]} onChange={(event) => updateCard(cardId, { label: event.target.value })} />
                  <Button variant="ghost" size="icon" aria-label={`Quitar tarjeta ${index + 1}`} onClick={() => change('cards', draft.cards.filter((card) => card.id !== cardId))}><Trash2 size={17} aria-hidden="true" /></Button>
                </div>
              ))}
              <small>Usa un apodo. No ingreses números de tarjeta.</small>
            </div>
          )}
        </>
      )}
      {step === 2 && (
        <Choices id={`${id}-cadence`} title="Elige la que más se parece a tu rutina" options={paymentCadences} value={draft.cadence} onChange={(value) => change('cadence', value)} />
      )}
      {step === 3 && (
        <>
          <div className="finance-last-fields">
            <MoneyField id={`${id}-salary`} name="salary" label="Monto que normalmente recibes (Q)" value={draft.salary} onValueChange={(value) => change('salary', value)} hint="Opcional. Aparecerá al elegir Usar Salario." />
            <FormField id={`${id}-payday`} name="payday" label="Próxima fecha de pago" type="date" min="2000-01-01" max="2100-12-31" value={draft.payday} onChange={(event) => change('payday', event.target.value)} hint="Opcional. Se sugerirá al abrir un presupuesto nuevo." />
          </div>
          <p className="finance-setup-note"><CalendarDays size={16} aria-hidden="true" /> Tus respuestas quedan en este navegador. Tú decides cuándo guardar un ingreso o presupuesto.</p>
        </>
      )}
      <FormMessage>{error}</FormMessage>
      <div className="finance-setup-actions">
        {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Atrás</Button>}
        <Button variant="ghost" onClick={onSkip}>Ahora no</Button>
        <Button type="submit">{step === 3 ? 'Guardar respuestas' : 'Continuar'}</Button>
      </div>
    </form>
  )
}
