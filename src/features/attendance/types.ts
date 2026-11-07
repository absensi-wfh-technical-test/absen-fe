export interface AttendanceRecord {
  id: number
  employeeId: number
  attendanceDate: string
  checkInAt: string
  photoAvailable: boolean
  employee: {
    employeeCode: string
    fullName: string
    department: { id: number; name: string }
    position: { id: number; name: string }
  }
}
export interface Page<T> {
  data: T[]
  meta: { page: number; pageSize: number; total: number }
}
