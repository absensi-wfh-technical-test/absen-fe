import { apiRequest } from '@/lib/apiClient'
import type { AuthUser, LoginResponse } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) => apiRequest<AuthUser>('/auth/me', {}, token),
  logout: (token: string) => apiRequest<void>('/auth/logout', { method: 'POST' }, token),
}
