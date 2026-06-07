const base = '/api'

export async function getDashboard(token: string) {
  const res = await fetch(`${base}/d/${token}`)
  if (!res.ok) throw new Error('Dashboard not found')
  return res.json()
}

export async function setEmail(token: string, email: string) {
  const res = await fetch(`${base}/d/${token}/email`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Failed to save email')
  return res.json()
}

export async function addCar(token: string, data: Record<string, unknown>) {
  const res = await fetch(`${base}/d/${token}/cars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add car')
  return res.json()
}

export async function updateCar(token: string, carId: string, data: Record<string, unknown>) {
  const res = await fetch(`${base}/d/${token}/cars/${carId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update car')
  return res.json()
}

export async function markServiceDone(token: string, carId: string) {
  const res = await fetch(`${base}/d/${token}/cars/${carId}/service-done`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to mark service done')
  return res.json()
}

export async function markTestDone(token: string, carId: string) {
  const res = await fetch(`${base}/d/${token}/cars/${carId}/test-done`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to mark test done')
  return res.json()
}

export async function deleteCar(token: string, carId: string) {
  const res = await fetch(`${base}/d/${token}/cars/${carId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete car')
  return res.json()
}

export async function startByEmail(email: string) {
  const res = await fetch(`${base}/d/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Failed to start')
  return res.json() as Promise<{ token: string }>
}

export async function createDashboard(adminSecret: string) {
  const res = await fetch(`${base}/admin/dashboards`, {
    method: 'POST',
    headers: { 'x-admin-secret': adminSecret },
  })
  if (!res.ok) throw new Error('Failed to create dashboard')
  return res.json()
}
