import { apiRequest } from '@/lib/apiClient'
import type { Employee, EmployeePayload, Lookup, Page } from '../types'

export const employeeApi = {
  departments: (token: string) => apiRequest<Lookup[]>('/departments', {}, token),
  positions: (token: string) => apiRequest<Lookup[]>('/positions', {}, token),
  list: (token: string, query: URLSearchParams) => apiRequest<Page<Employee>>(`/employees?${query.toString()}`, {}, token),
  detail: (token: string, id: number) => apiRequest<Employee>(`/employees/${id}`, {}, token),
  create: (token: string, body: EmployeePayload) => apiRequest<Employee>('/employees', { method: 'POST', body: JSON.stringify(body) }, token),
  update: (token: string, id: number, body: Omit<EmployeePayload, 'initialPassword'>) => apiRequest<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  setStatus: (token: string, id: number, isActive: boolean) => apiRequest<Employee>(`/employees/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token),
}
