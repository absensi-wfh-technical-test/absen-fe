import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/apiClient'
import { attendanceApi } from '../services/attendanceApi'
import type { AttendanceRecord } from '../types'

export function useTodayAttendance(token: string) {
  const [record, setRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try { setRecord(await attendanceApi.today(token)); return true }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Status belum dapat dimuat.'); return false }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { void Promise.resolve().then(refresh) }, [refresh])

  const mutate = async (operation: () => Promise<AttendanceRecord | void>, action: string) => {
    setBusy(true); setError('')
    try { const result = await operation(); setRecord(result ?? null); return true }
    catch (cause) {
      const checked = await refresh()
      const uncertain = cause instanceof ApiError && (cause.status === 0 || cause.status === 503)
      setError(uncertain ? checked
        ? `Hasil ${action} belum pasti. Status hari ini sudah dimuat ulang; periksa catatan dan foto sebelum mencoba lagi.`
        : `Hasil ${action} belum pasti dan status belum dapat diperiksa. Coba muat status lagi sebelum mencoba lagi.`
        : cause instanceof Error ? cause.message : 'Terjadi kendala. Periksa status sebelum mencoba lagi.')
      return false
    } finally { setBusy(false) }
  }
  return { record, loading, busy, error, refresh,
    checkIn: (file: File) => mutate(() => attendanceApi.checkIn(token, file), 'pengiriman absensi'),
    replacePhoto: (id: number, file: File) => mutate(() => attendanceApi.replacePhoto(token, id, file), 'penggantian foto'),
    deleteRecord: (id: number) => mutate(() => attendanceApi.delete(token, id), 'penghapusan absensi'),
  }
}
