const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const SESSION_KEY = 'saldo.session'

function readToken() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.token || null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? readToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return null

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(SESSION_KEY)
      window.dispatchEvent(new Event('saldo:unauthorized'))
    }

    const error = new Error(payload?.message || 'No se pudo completar la solicitud.')
    error.status = response.status
    error.errors = payload?.errors || {}
    throw error
  }

  return payload
}

export const api = {
  get: (path) => request(path),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export { SESSION_KEY }
