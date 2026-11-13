const cardExpensesEvent = 'saldo:card-expenses'

function storagePrefix(userId) {
  return `saldo.cardExpenses:${userId}:`
}

function validId(id) {
  return /^(?:[1-9]\d*)$/.test(String(id))
}

function validCardTag(tag) {
  return typeof tag === 'string' && /^[a-z0-9-]{1,60}$/.test(tag)
}

export function getCardExpenseIds(userId) {
  const ids = new Set()
  if (!validId(userId)) return ids

  try {
    const prefix = storagePrefix(userId)
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (key?.startsWith(prefix) && validCardTag(localStorage.getItem(key))) {
        ids.add(key.slice(prefix.length))
      }
    }
  } catch {
    ids.clear()
  }
  return ids
}

export function isCardExpense(userId, expenseId) {
  return Boolean(getExpenseCard(userId, expenseId))
}

export function getExpenseCard(userId, expenseId) {
  if (!validId(userId) || !validId(expenseId)) return ''

  try {
    const value = localStorage.getItem(storagePrefix(userId) + expenseId)
    return validCardTag(value) ? value : ''
  } catch {
    return ''
  }
}

export function setCardExpense(userId, expenseId, isCard, cardId = '') {
  if (!validId(userId) || !validId(expenseId)) return false

  try {
    const key = storagePrefix(userId) + expenseId
    if (isCard) localStorage.setItem(key, validCardTag(cardId) ? cardId : '1')
    else localStorage.removeItem(key)
  } catch {
    return false
  }

  window.dispatchEvent(new CustomEvent(cardExpensesEvent, { detail: String(userId) }))
  return true
}

export function subscribeToCardExpenses(userId, callback) {
  function onStorage(event) {
    if (event.key === null || event.key.startsWith(storagePrefix(userId))) callback()
  }

  function onCardExpenses(event) {
    if (event.detail === String(userId)) callback()
  }

  window.addEventListener('storage', onStorage)
  window.addEventListener(cardExpensesEvent, onCardExpenses)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(cardExpensesEvent, onCardExpenses)
  }
}
