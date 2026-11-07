export interface AuthUser {
  id: number
  email: string
  roleCode: 'ADMIN' | 'EMPLOYEE'
  employeeId?: number
  fullName?: string
}
export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}
