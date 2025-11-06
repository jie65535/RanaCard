import axios from 'axios'

// Prefer same-origin by default. If VITE_API_BASE is set (e.g., "http://backend" or "/"),
// normalize trailing slashes so that `${API_BASE}/api/...` doesn't double-slash.
const rawBase = (import.meta as any).env?.VITE_API_BASE as string | undefined
const API_BASE = rawBase && rawBase.trim() !== '' ? rawBase.replace(/\/+$/, '') : ''

export async function getData(kind: 'card' | 'pendant' | 'mapevent' | 'begineffect') {
  // Prefer new /data route; fallback to /baseline for compatibility
  try {
    const { data } = await axios.get(`${API_BASE}/api/data/${kind}`)
    return data
  } catch {
    const { data } = await axios.get(`${API_BASE}/api/baseline/${kind}`)
    return data
  }
}

export async function validate(kind: 'card' | 'pendant' | 'mapevent' | 'begineffect', payload: any): Promise<{ ok: boolean; errors: string[] }> {
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

// ---- Patch APIs ----
export async function patchDiff(kind: 'card' | 'pendant' | 'mapevent' | 'begineffect' | 'disaster', edited: any): Promise<any> {
  const { data } = await axios.post(`${API_BASE}/api/patch/diff`, edited, { params: { kind } })
  return data
}

export async function patchApply(kind: 'card' | 'pendant' | 'mapevent' | 'begineffect' | 'disaster', patch: any, target?: any): Promise<{ ok: boolean; result: any; stats: any; conflicts: any[] }> {
  const body: any = { patch }
  if (typeof target !== 'undefined') body.target = target
  const { data } = await axios.post(`${API_BASE}/api/patch/apply`, body, { params: { kind } })
  return data
}

// ---- Share APIs ----
export type ShareCreateResp = { id: string; url: string; manageToken: string }
export async function shareCreate(meta: { title: string; author?: string; description?: string; baseDataVersion?: string }, data: { cards?: any; pendants?: any; mapEvents?: any; beginEffects?: any }): Promise<ShareCreateResp> {
  const { data: resp } = await axios.post(`${API_BASE}/api/share`, { meta, data })
  return resp
}

export async function shareCreatePatch(meta: { title: string; author?: string; description?: string; baseDataVersion?: string }, patch: any): Promise<ShareCreateResp> {
  const { data: resp } = await axios.post(`${API_BASE}/api/share`, { meta, patch })
  return resp
}

export async function shareCreatePatches(meta: { title: string; author?: string; description?: string; baseDataVersion?: string }, patches: any[]): Promise<ShareCreateResp> {
  const { data: resp } = await axios.post(`${API_BASE}/api/share`, { meta, patches })
  return resp
}

export async function shareList(q?: string, limit = 30): Promise<{ items: Array<{ id: string; title: string; author?: string; createdAt: string; size: number; downloads: number; description?: string; baseDataVersion?: string }> }> {
  const { data } = await axios.get(`${API_BASE}/api/share`, { params: { q, limit } })
  return data
}

export async function shareGet(id: string): Promise<any> {
  const { data } = await axios.get(`${API_BASE}/api/share/${id}`)
  return data
}

export async function shareDelete(id: string, manageToken: string): Promise<{ ok: boolean }> {
  const { data } = await axios.delete(`${API_BASE}/api/share/${id}`, { params: { manageToken } })
  return data
}
