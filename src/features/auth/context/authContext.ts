import { createContext } from 'react'
import type { AuthUser } from '../types'

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  expired: boolean
  status: 'checking' | 'ready' | 'offline'
  storageWarning: boolean
  retrySession: () => void
  forgetSession: () => Promise<void>
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
