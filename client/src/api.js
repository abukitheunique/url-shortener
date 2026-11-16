const BASE = import.meta.env.VITE_API_URL || ''

const uid = () => {
  let id = localStorage.getItem('uid')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('uid', id)
  }
  return id
}

async function call(path = '', method = 'GET', body) {
  const res = await fetch(`${BASE}/api/links${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-user-id': uid() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const getLinks = () => call()
export const createLink = (url, alias) => call('', 'POST', { url, alias })
export const deleteLink = (code) => call(`/${code}`, 'DELETE')
