import { apiBlob, apiRequest } from '@/lib/apiClient'
import type { AttendanceRecord, Page } from '../types'

const photoForm = (photo: File) => {
  const form = new FormData()
  form.append('photo', photo)
  return form
}
export const attendanceApi = {
  today: (token: string) => apiRequest<AttendanceRecord | null>('/attendances/me/today', {}, token),
  mine: (token: string, page = 1) =>
    apiRequest<Page<AttendanceRecord>>(`/attendances/me?page=${page}`, {}, token),
  list: (token: string, query: URLSearchParams) =>
    apiRequest<Page<AttendanceRecord>>(`/attendances?${query.toString()}`, {}, token),
  detail: (token: string, id: number) =>
    apiRequest<AttendanceRecord>(`/attendances/${id}`, {}, token),
  photo: (token: string, id: number) => apiBlob(`/attendances/${id}/photo`, token),
  checkIn: (token: string, photo: File) =>
    apiRequest<AttendanceRecord>('/attendances', { method: 'POST', body: photoForm(photo) }, token),
  replacePhoto: (token: string, id: number, photo: File) =>
    apiRequest<AttendanceRecord>(
      `/attendances/${id}/photo`,
      { method: 'PATCH', body: photoForm(photo) },
      token,
    ),
  delete: (token: string, id: number) =>
    apiRequest<void>(`/attendances/${id}`, { method: 'DELETE' }, token),
}
