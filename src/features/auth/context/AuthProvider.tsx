import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/apiClient'
import { clearNotice } from '@/lib/notice'
import {
  clearRequestProofKey,
  currentRequestProofKey,
  restoreRequestProofKey,
} from '@/lib/requestProof'
import { authApi } from '../services/authApi'
import {
  clearSession,
  InvalidSessionError,
  loadSession,
  saveSession,
} from '../services/sessionStore'
import type { AuthUser } from '../types'
import { AuthContext } from './authContext'

interface Session {
  token: string
  user: AuthUser
  expiresAt: number
}

function tokenExpiresAt(token: string, expiresIn: number): number {
  const fallback = Date.now() + expiresIn * 1000
  try {
    const encoded = token.split('.')[1]
    const claims = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: unknown
    }
    return typeof claims.exp === 'number' && Number.isFinite(claims.exp)
      ? Math.min(fallback, claims.exp * 1000)
      : fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [expired, setExpired] = useState(false)
  const [status, setStatus] = useState<'checking' | 'ready' | 'offline'>('checking')
  const [storageWarning, setStorageWarning] = useState(false)
  const [restoreRevision, setRestoreRevision] = useState(0)
  const channel = useRef<BroadcastChannel | null>(null)
  const restoreEpoch = useRef(0)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const connection = new BroadcastChannel('absensi-wfh-auth')
    channel.current = connection
    connection.onmessage = (event: MessageEvent<'updated' | 'cleared'>) => {
      restoreEpoch.current += 1
      clearNotice()
      clearRequestProofKey()
      setSession(null)
      if (event.data === 'updated') {
        setStatus('checking')
        setRestoreRevision((value) => value + 1)
      } else if (event.data === 'cleared') {
        setExpired(false)
        setStatus('ready')
      }
    }
    return () => {
      channel.current = null
      connection.close()
    }
  }, [])

  useEffect(() => {
    let active = true
    const epoch = ++restoreEpoch.current
    const isCurrent = () => active && restoreEpoch.current === epoch
    async function restore() {
      setStatus('checking')
      try {
        const saved = await loadSession()
        if (!isCurrent()) return
        if (!saved) {
          clearRequestProofKey()
          setSession(null)
          setStatus('ready')
          return
        }
        if (saved.expiresAt <= Date.now()) {
          await clearSession()
          if (!isCurrent()) return
          clearRequestProofKey()
          setSession(null)
          setExpired(true)
          setStatus('ready')
          return
        }
        restoreRequestProofKey(saved)
        try {
          const user = await authApi.me(saved.token)
          if (!isCurrent()) return
          setSession({ token: saved.token, user, expiresAt: saved.expiresAt })
          setExpired(false)
          setStatus('ready')
        } catch (error) {
          if (!isCurrent()) return
          if (error instanceof ApiError && error.status === 401) {
            await clearSession().catch(() => setStorageWarning(true))
            clearRequestProofKey()
            setSession(null)
            setExpired(true)
            setStatus('ready')
            channel.current?.postMessage('cleared')
          } else {
            setStatus('offline')
          }
        }
      } catch (error) {
        if (!isCurrent()) return
        clearRequestProofKey()
        setSession(null)
        if (error instanceof InvalidSessionError) setExpired(true)
        else setStorageWarning(true)
        setStatus('ready')
      }
    }
    void restore()
    return () => {
      active = false
    }
  }, [restoreRevision])

  useEffect(() => {
    if (!session) return
    const timer = window.setTimeout(
      () => {
        restoreEpoch.current += 1
        setSession(null)
        clearRequestProofKey()
        setExpired(true)
        void clearSession().catch(() => setStorageWarning(true))
        channel.current?.postMessage('cleared')
      },
      Math.max(0, session.expiresAt - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [session])

  useEffect(() => {
    const invalidate = () => {
      restoreEpoch.current += 1
      setSession(null)
      clearRequestProofKey()
      setExpired(true)
      setStatus('ready')
      void clearSession().catch(() => setStorageWarning(true))
      channel.current?.postMessage('cleared')
    }
    window.addEventListener('absensi:session-invalid', invalidate)
    return () => window.removeEventListener('absensi:session-invalid', invalidate)
  }, [])

  async function login(email: string, password: string): Promise<AuthUser> {
    const result = await authApi.login(email, password)
    const user = await authApi.me(result.accessToken)
    if (user.id !== result.user.id || user.roleCode !== result.user.roleCode) {
      clearRequestProofKey()
      throw new Error('Identitas sesi tidak sesuai. Silakan coba lagi.')
    }
    const key = currentRequestProofKey()
    if (!key) throw new Error('Kunci sesi tidak tersedia. Silakan coba lagi.')
    const expiresAt = tokenExpiresAt(result.accessToken, result.expiresIn)
    try {
      await saveSession({ version: 1, token: result.accessToken, expiresAt, ...key })
      setStorageWarning(false)
    } catch {
      setStorageWarning(true)
    }
    setSession({ token: result.accessToken, user, expiresAt })
    setExpired(false)
    setStatus('ready')
    channel.current?.postMessage('updated')
    return user
  }

  async function logout(): Promise<boolean> {
    restoreEpoch.current += 1
    const token = session?.token
    setSession(null)
    setExpired(false)
    await clearSession().catch(() => setStorageWarning(true))
    channel.current?.postMessage('cleared')
    let confirmed = true
    if (token) {
      try {
        await authApi.logout(token)
      } catch {
        confirmed = false
      }
    }
    clearRequestProofKey()
    return confirmed
  }

  async function forgetSession(): Promise<void> {
    restoreEpoch.current += 1
    await clearSession().catch(() => setStorageWarning(true))
    clearRequestProofKey()
    setSession(null)
    setExpired(false)
    setStatus('ready')
    channel.current?.postMessage('cleared')
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        expired,
        status,
        storageWarning,
        retrySession: () => setRestoreRevision((value) => value + 1),
        forgetSession,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
