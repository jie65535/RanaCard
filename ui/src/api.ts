import axios from 'axios'

// Prefer same-origin by default. If VITE_API_BASE is set (e.g., "http://backend" or "/"),
// normalize trailing slashes so that `${API_BASE}/api/...` doesn't double-slash.
const rawBase = (import.meta as any).env?.VITE_API_BASE as string | undefined
const API_BASE = rawBase && rawBase.trim() !== '' ? rawBase.replace(/\/+$/, '') : ''

export async function getData(kind: 'card' | 'pendant' | 'mapevent') {
  // Prefer new /data route; fallback to /baseline for compatibility
  try {
    const { data } = await axios.get(`${API_BASE}/api/data/${kind}`)
    return data
  } catch {
    const { data } = await axios.get(`${API_BASE}/api/baseline/${kind}`)
    return data
  }
}

export async function validate(kind: 'card' | 'pendant' | 'mapevent', payload: any): Promise<{ ok: boolean; errors: string[] }> {
  const { data } = await axios.post(`${API_BASE}/api/validate`, payload, { params: { kind } })
  return data
}

export async function decodeEncrypted(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await axios.post(`${API_BASE}/api/decode`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function encodeEncrypted(payload: any): Promise<string> {
  const { data } = await axios.post(`${API_BASE}/api/encode`, { payload }, { responseType: 'text' })
  return data
}
