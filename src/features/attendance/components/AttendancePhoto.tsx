import { useEffect, useState } from 'react'
import { attendanceApi } from '../services/attendanceApi'

export function AttendancePhoto({ token, id, label }: { token: string; id: number; label: string }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true; let objectUrl = ''
    attendanceApi.photo(token, id).then(blob => { if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) } })
      .catch(() => { if (active) setError('Foto belum dapat dimuat.') })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [token, id])
  if (error) return <p role="status">{error}</p>
  if (!url) return <p role="status">Memuat foto…</p>
  return <img className="evidence-photo" src={url} alt={label} />
}
