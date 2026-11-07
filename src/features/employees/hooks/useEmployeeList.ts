import { useCallback, useEffect, useState } from 'react'
import { employeeApi } from '../services/employeeApi'
import type { Employee, Page } from '../types'

export function useEmployeeList(token: string, query: URLSearchParams) {
  const [result, setResult] = useState<Page<Employee> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const queryString = query.toString()
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setResult(await employeeApi.list(token, new URLSearchParams(queryString)))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Data karyawan belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [token, queryString])
  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [refresh])
  return { result, loading, error, refresh }
}
