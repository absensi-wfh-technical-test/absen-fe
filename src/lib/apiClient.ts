export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string
  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message)
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let response: Response
  const target = `/api${path}`
  const proofHeaders = await signRequest(options.method ?? 'GET', target, options.body)
  try {
    response = await fetch(target, {
      ...options,
      headers: {
        ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
        ...proofHeaders,
      },
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Koneksi gagal. Periksa jaringan lalu coba lagi.')
  }
  if (response.status === 204) return undefined as T
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const envelope = body as { error?: { code?: string; message?: string }; requestId?: string } | null
    if (token && response.status === 401 && envelope?.error?.code === 'UNAUTHENTICATED') window.dispatchEvent(new Event('absensi:session-invalid'))
    throw new ApiError(response.status, envelope?.error?.code ?? 'REQUEST_FAILED',
      envelope?.error?.message ?? 'Terjadi kendala. Coba lagi.', envelope?.requestId)
  }
  return body as T
}

export async function apiBlob(path: string, token: string): Promise<Blob> {
  const target = `/api${path}`
  const proofHeaders = await signRequest('GET', target)
  let response: Response
  try { response = await fetch(target, { headers: { Authorization: `Bearer ${token}`, ...proofHeaders } }) }
  catch { throw new ApiError(0, 'NETWORK_ERROR', 'Koneksi gagal. Periksa jaringan lalu coba lagi.') }
  if (!response.ok) {
    const envelope = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null
    if (response.status === 401 && envelope?.error?.code === 'UNAUTHENTICATED') window.dispatchEvent(new Event('absensi:session-invalid'))
    throw new ApiError(response.status, envelope?.error?.code ?? 'REQUEST_FAILED', envelope?.error?.message ?? 'Foto belum dapat dimuat.')
  }
  return response.blob()
}
import { signRequest } from './requestProof'

