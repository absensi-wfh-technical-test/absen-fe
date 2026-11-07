import { useState } from 'react'
import { ApiError } from '@/lib/apiClient'
import { useAuth } from './useAuth'
import type { AuthUser } from '../types'

export function useLogin(onAuthenticated: (user: AuthUser) => void) {
  const { login } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(email: string, password: string) {
    setError('')
    setBusy(true)
    try {
      const user = await login(email, password)
      onAuthenticated(user)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Terjadi kendala. Coba lagi.',
      )
    } finally {
      setBusy(false)
    }
  }
  return { submit, busy, error, clearError: () => setError('') }
}
