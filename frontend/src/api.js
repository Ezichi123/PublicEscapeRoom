const BASE = import.meta.env.VITE_API_URL

export function getToken() {
  return localStorage.getItem('token')
}

export function saveToken(token) {
  localStorage.setItem('token', token)
}

export function saveRefreshToken(token) {
  localStorage.setItem('refreshToken', token)
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken')
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (data.access) saveToken(data.access)
  if (data.refresh) saveRefreshToken(data.refresh)
  return data
}

async function refreshToken() {
  const refresh = getRefreshToken()
  if (!refresh) return false
  const res = await fetch(`${BASE}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  })
  const data = await res.json()
  if (data.access) {
    saveToken(data.access)
    return true
  }
  return false
}

export async function apiFetch(endpoint, options = {}) {
  const makeRequest = () => fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers
    }
  })

  let res = await makeRequest()

  if (res.status === 401) {
    const refreshed = await refreshToken()
    if (!refreshed) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/'
      throw new Error('Session expired — please log in again')
    }
    res = await makeRequest()
  }

  return res
}