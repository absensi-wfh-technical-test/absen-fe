import { useCallback, useEffect, useState } from 'react'
import { attendanceApi } from '../services/attendanceApi'
import type { AttendanceRecord, Page } from '../types'

export function useAttendanceList(token: string, mode: 'mine' | 'admin', query: URLSearchParams) {
  const [result, setResult] = useState<Page<AttendanceRecord> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const queryString = query.toString()
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setResult(
        mode === 'mine'
          ? await attendanceApi.mine(token, Number(query.get('page') ?? 1))
          : await attendanceApi.list(token, query),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Daftar belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
    // queryString represents the value of query; the object is reconstructed here to keep effects stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, mode, queryString])
  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [refresh])
  return { result, loading, error, refresh }
}
