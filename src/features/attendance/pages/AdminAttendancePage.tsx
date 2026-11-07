import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth'
import { AppLink } from '@/components/ui/AppLink'
import { businessToday, formatDate, formatTime } from '@/lib/format'
import { employeeApi, type Lookup } from '@/features/employees'
import { useAttendanceList } from '../hooks/useAttendanceList'

type Filter = { from: string; to: string; search: string; departmentId: string }
let retained: { ownerId: number; draft: Filter; applied: Filter; page: number } | null = null

export function AdminAttendancePage() {
  const { token, user } = useAuth()
  const previous = retained?.ownerId === user?.id ? retained : null
  const [from, setFrom] = useState(previous?.draft.from ?? businessToday())
  const [to, setTo] = useState(previous?.draft.to ?? businessToday())
  const [search, setSearch] = useState(previous?.draft.search ?? '')
  const [departmentId, setDepartmentId] = useState(previous?.draft.departmentId ?? '')
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [page, setPage] = useState(previous?.page ?? 1)
  const [applied, setApplied] = useState<Filter>(
    previous?.applied ?? {
      from: businessToday(),
      to: businessToday(),
      search: '',
      departmentId: '',
    },
  )
  useEffect(() => {
    if (user)
      retained = { ownerId: user.id, draft: { from, to, search, departmentId }, applied, page }
  }, [user, from, to, search, departmentId, applied, page])
  useEffect(() => {
    employeeApi
      .departments(token!)
      .then(setDepartments)
      .catch(() => {})
  }, [token])
  const query = new URLSearchParams({
    page: String(page),
    ...(applied.from ? { from: applied.from } : {}),
    ...(applied.to ? { to: applied.to } : {}),
    ...(applied.search ? { search: applied.search } : {}),
    ...(applied.departmentId ? { departmentId: applied.departmentId } : {}),
  })
  const { result, loading, error, refresh } = useAttendanceList(token!, 'admin', query)
  function apply(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setApplied({ from, to, search, departmentId })
  }
  function reset() {
    setFrom('')
    setTo('')
    setSearch('')
    setDepartmentId('')
    setPage(1)
    setApplied({ from: '', to: '', search: '', departmentId: '' })
  }
  return (
    <div className="workspace-stack">
      <header className="page-heading">
        <p className="eyebrow">AREA HRD</p>
        <h1>Monitoring absensi</h1>
        <p>Pantau bukti kehadiran WFH. Data absensi hanya dapat dibaca oleh HRD.</p>
      </header>
      <section className="summary-strip" aria-label="Ringkasan monitoring">
        <span className="summary-number">{loading || error ? '—' : (result?.meta.total ?? 0)}</span>
        <div>
          <strong>Catatan sesuai filter</strong>
          <p>Jumlah absensi yang tersedia untuk rentang dan karyawan pilihan Anda.</p>
        </div>
      </section>
      <section className="workspace-card">
        <h2>Filter absensi</h2>
        <form className="filter-grid" onSubmit={apply}>
          <label>
            Dari tanggal
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label>
            Sampai tanggal
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <label>
            Cari karyawan
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nama atau kode"
            />
          </label>
          <label>
            Departemen
            <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">Semua departemen</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <div className="action-row">
            <button type="submit" className="primary-button">
              Terapkan
            </button>
            <button type="button" onClick={reset}>
              Reset
            </button>
          </div>
        </form>
      </section>
      <section className="workspace-card">
        <h2>Daftar absensi</h2>
        {loading ? (
          <p role="status">Memuat absensi…</p>
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
                    <strong>
                      {row.employee.fullName} · {row.employee.employeeCode}
                    </strong>
                    <small>
                      {formatDate(row.attendanceDate)} · {formatTime(row.checkInAt)} ·{' '}
                      {row.employee.department.name}
                    </small>
                  </div>
                  <AppLink to={`/admin/absensi/${row.id}`}>Lihat detail</AppLink>
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
            <p>Tidak ada absensi untuk filter ini.</p>
            <button onClick={reset}>Reset filter</button>
          </div>
        )}
      </section>
    </div>
  )
}
