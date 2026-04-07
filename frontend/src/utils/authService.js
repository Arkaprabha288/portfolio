const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed.')
  localStorage.setItem('token', data.token)
  return data.user
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed.')
  localStorage.setItem('token', data.token)
  return data.user
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders(),
  })
  if (!res.ok) return null
  return res.json()
}

export async function logout() {
  await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: authHeaders() })
  localStorage.removeItem('token')
}

export async function uploadAvatar(file) {
  const form = new FormData()
  form.append('avatar', file)
  const res = await fetch(`${API_BASE}/api/auth/avatar`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Avatar upload failed.')
  return data.avatar
}

export function loginWithGoogle() {
  window.location.href = `${API_BASE}/api/auth/google`
}

export { authHeaders }
