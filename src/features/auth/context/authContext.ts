import { createContext } from 'react'
import type { AuthUser } from '../types'

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  expired: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
