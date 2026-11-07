import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { AppLink } from '@/components/ui/AppLink'
import { formatDate, formatTime } from '@/lib/format'
import { useAttendanceList } from '../hooks/useAttendanceList'

export function AttendanceHistoryPage() {
  const { token } = useAuth()
  const [page, setPage] = useState(1)
  const { result, loading, error, refresh } = useAttendanceList(
    token!,
    'mine',
    new URLSearchParams({ page: String(page) }),
  )
  return (
    <div className="workspace-stack">
      <header className="page-heading">
        <p className="eyebrow">RIWAYAT PRIBADI</p>
        <h1>Riwayat absensi saya</h1>
        <p>Catatan terbaru tampil lebih dahulu.</p>
      </header>
      <section className="workspace-card">
        {loading ? (
          <p role="status">Memuat riwayat…</p>
        ) : error ? (
          <div className="alert error">
            <p>{error}</p>
            <button onClick={() => void refresh()}>Coba lagi</button>
          </div>
        ) : result?.data.length ? (
          <>
            <p>{result.meta.total} catatan ditemukan</p>
            <div className="record-list">
              {result.data.map((row) => (
                <article className="record-row" key={row.id}>
                  <div>
                    <strong>{formatDate(row.attendanceDate)}</strong>
                    <small>
                      {formatTime(row.checkInAt)} ·{' '}
                      {row.photoAvailable ? 'Foto tersedia' : 'Foto belum tersedia'}
                    </small>
                  </div>
                  <AppLink to={`/app/riwayat/${row.id}`}>Lihat detail</AppLink>
                </article>
              ))}
            </div>
            <div className="action-row">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Sebelumnya
              </button>
              <span>Halaman {page}</span>
              <button
                disabled={page * result.meta.pageSize >= result.meta.total}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>Riwayat masih kosong</strong>
            <p>Setelah Anda check-in, catatannya akan muncul di sini.</p>
            <AppLink to="/app">Kembali ke beranda</AppLink>
          </div>
        )}
      </section>
    </div>
  )
}
