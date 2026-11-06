import { useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../services/authApi'
import type { AuthUser } from '../types'
import { AuthContext } from './authContext'
import { clearRequestProofKey } from '@/lib/requestProof'

interface Session { token: string; user: AuthUser; expiresAt: number }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!session) return
    const timer = window.setTimeout(() => { setSession(null); clearRequestProofKey(); setExpired(true) }, Math.max(0, session.expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [session])

  useEffect(() => {
    const invalidate = () => { setSession(null); clearRequestProofKey(); setExpired(true) }
    window.addEventListener('absensi:session-invalid', invalidate)
    return () => window.removeEventListener('absensi:session-invalid', invalidate)
  }, [])

  async function login(email: string, password: string): Promise<AuthUser> {
    const result = await authApi.login(email, password)
    const user = await authApi.me(result.accessToken)
    if (user.id !== result.user.id || user.roleCode !== result.user.roleCode) {
      throw new Error('Identitas sesi tidak sesuai. Silakan coba lagi.')
    }
    setSession({ token: result.accessToken, user, expiresAt: Date.now() + result.expiresIn * 1000 })
    setExpired(false)
    return user
  }

  async function logout(): Promise<boolean> {
    const token = session?.token
    setSession(null)
    setExpired(false)
    let confirmed = true
    if (token) {
      try { await authApi.logout(token) } catch { confirmed = false }
    }
    clearRequestProofKey()
    return confirmed
  }

  return <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, expired, login, logout }}>
    {children}
  </AuthContext.Provider>
}
