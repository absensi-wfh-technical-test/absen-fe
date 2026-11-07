export interface Lookup {
  id: number
  code: string
  name: string
}
export interface Employee {
  id: number
  employeeCode: string
  fullName: string
  email: string
  isActive: boolean
  user: { id: number; isActive: boolean }
  department: Lookup
  position: Lookup
  phoneNumber: string | null
  hireDate: string | null
}
export interface EmployeePayload {
  employeeCode: string
  fullName: string
  email: string
  departmentId: number
  positionId: number
  phoneNumber: string | null
  hireDate: string | null
  initialPassword?: string
}
export interface Page<T> {
  data: T[]
  meta: { page: number; pageSize: number; total: number }
}
