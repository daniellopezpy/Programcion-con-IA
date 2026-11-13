import { FormField } from '@/components/FormField'
import { caretFromDraft, formatMoneyDraft, moneyDraft, moneyFromPaste } from '@/lib/money-input'

export function MoneyField({ name, value, onChange, onValueChange, onBlur, className = '', ...fieldProps }) {
  const draft = String(value ?? '')
  const display = formatMoneyDraft(draft)

  function apply(input, nextDraft, draftCaret, skipComma = false) {
    const nextDisplay = formatMoneyDraft(nextDraft)
    const caret = caretFromDraft(nextDisplay, draftCaret)
    if (input.value !== nextDisplay) input.value = nextDisplay
    const position = skipComma && nextDisplay[caret] === ',' ? caret + 1 : caret
    input.setSelectionRange(position, position)

    if (nextDraft !== draft) {
      onChange?.({ target: { name, value: nextDraft } })
      onValueChange?.(nextDraft)
    }
  }

  function change(event) {
    const input = event.currentTarget
    const caret = input.selectionStart ?? input.value.length
    const { data, inputType } = event.nativeEvent
    const text = input.value
    if (inputType === 'insertReplacementText' || data?.length > 1) {
      const next = moneyDraft(moneyFromPaste(text))
      apply(input, next ?? draft, (next ?? draft).length)
      return
    }

    let raw = text.replaceAll(',', '')
    let rawCaret = text.slice(0, caret).replaceAll(',', '').length
    if (data === ',' && text[caret - 1] === ',') {
      raw = raw.slice(0, rawCaret) + '.' + raw.slice(rawCaret)
      rawCaret++
    }
    const next = moneyDraft(raw)
    const removedLeading = raw.length - (next?.length ?? raw.length)
    const skipComma = inputType === 'deleteContentForward' && next === draft

    apply(input, next ?? draft, next === null ? rawCaret - 1 : rawCaret - removedLeading, skipComma)
  }

  function paste(event) {
    event.preventDefault()
    const input = event.currentTarget
    const start = input.selectionStart ?? display.length
    const end = input.selectionEnd ?? start
    const before = display.slice(0, start).replaceAll(',', '')
    const after = display.slice(end).replaceAll(',', '')
    const pasted = moneyFromPaste(event.clipboardData.getData('text'))
    if (!pasted) return
    const next = moneyDraft(before + pasted + after)
    if (next != null) apply(input, next, next.length - after.length)
  }

  function blur(event) {
    if (draft.endsWith('.')) apply(event.currentTarget, draft.slice(0, -1), draft.length - 1)
    onBlur?.(event)
  }

  return (
    <FormField
      {...fieldProps}
      className={className + ' min-w-0 [&_input]:text-base [&_input]:tabular-nums'}
      name={name}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={display}
      onChange={change}
      onPaste={paste}
      onBlur={blur}
    />
  )
}
