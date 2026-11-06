import { useEffect, useState, useSyncExternalStore } from 'react'
import { clearNotice, getNotice, subscribeNotice } from '@/lib/notice'

export function NoticeToast() {
  const notice = useSyncExternalStore(subscribeNotice, getNotice)
  const [leaving, setLeaving] = useState(false)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (!notice || paused || notice.kind === 'error') return
    const leave = window.setTimeout(() => setLeaving(true), 3840)
    const clear = window.setTimeout(clearNotice, 4000)
    return () => { window.clearTimeout(leave); window.clearTimeout(clear); setLeaving(false) }
  }, [notice, paused])
  if (!notice) return null
  return <div className={`notice-toast ${notice.kind} ${leaving ? 'leaving' : ''}`} role={notice.kind === 'error' ? 'alert' : 'status'}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <span aria-hidden="true">{notice.kind === 'success' ? '✓' : 'i'}</span><span>{notice.message}</span>
    <button type="button" onClick={clearNotice} aria-label="Tutup notifikasi">×</button>
  </div>
}
