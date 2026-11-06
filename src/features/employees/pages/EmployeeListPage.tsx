import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth'
import { AppLink } from '@/components/ui/AppLink'
import { employeeApi } from '../services/employeeApi'
import { useEmployeeList } from '../hooks/useEmployeeList'
import type { Lookup } from '../types'

type Filter = { search: string; status: string; departmentId: string }
let retained: { ownerId: number; draft: Filter; applied: Filter; page: number } | null = null

export function EmployeeListPage() {
  const { token, user } = useAuth()
  const previous = retained?.ownerId === user?.id ? retained : null
  const [search, setSearch] = useState(previous?.draft.search ?? '')
  const [status, setStatus] = useState(previous?.draft.status ?? '')
  const [departmentId, setDepartmentId] = useState(previous?.draft.departmentId ?? '')
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [applied, setApplied] = useState<Filter>(previous?.applied ?? { search: '', status: '', departmentId: '' })
  const [page, setPage] = useState(previous?.page ?? 1)
  useEffect(() => { if (user) retained = { ownerId: user.id, draft: { search, status, departmentId }, applied, page } }, [user, search, status, departmentId, applied, page])
  useEffect(() => { employeeApi.departments(token!).then(setDepartments).catch(() => {}) }, [token])
  const query = new URLSearchParams({ page: String(page), ...(applied.search ? { search: applied.search } : {}), ...(applied.status ? { status: applied.status } : {}), ...(applied.departmentId ? { departmentId: applied.departmentId } : {}) })
  const { result, loading, error, refresh } = useEmployeeList(token!, query)
  function apply(event: FormEvent) { event.preventDefault(); setPage(1); setApplied({ search, status, departmentId }) }
  function reset() { setSearch(''); setStatus(''); setDepartmentId(''); setPage(1); setApplied({ search: '', status: '', departmentId: '' }) }
  const hasFilters = Boolean(applied.search || applied.status || applied.departmentId)
  return <div className="workspace-stack"><header className="page-heading heading-action"><div><p className="eyebrow">AREA HRD</p><h1>Karyawan</h1><p>Kelola akun dan profil tanpa menghapus riwayat absensi.</p></div><AppLink to="/admin/karyawan/baru" className="primary-button">Tambah karyawan</AppLink></header>
    <section className="workspace-card"><h2>Cari dan filter</h2><form className="filter-grid" onSubmit={apply}><label>Nama, kode, atau email<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari karyawan" /></label><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Semua status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></label><label>Departemen<select value={departmentId} onChange={event => setDepartmentId(event.target.value)}><option value="">Semua</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="primary-button" type="submit">Terapkan</button></form></section>
    <section className="workspace-card"><h2>Daftar karyawan</h2>{loading ? <p role="status">Memuat data karyawan…</p> : error ? <div className="alert error"><p>{error}</p><button onClick={() => void refresh()}>Coba lagi</button></div> : result?.data.length ? <><p>{result.meta.total} karyawan ditemukan</p><div className="record-list">{result.data.map(employee => <article className="record-row" key={employee.id}><div><strong>{employee.fullName} · {employee.employeeCode}</strong><small>{employee.email} · {employee.department.name} / {employee.position.name}</small></div><div className="action-row"><span className={`status-pill ${employee.isActive ? 'success' : 'neutral'}`}>{employee.isActive ? 'Aktif' : 'Nonaktif'}</span><AppLink to={`/admin/karyawan/${employee.id}`}>Lihat / ubah</AppLink></div></article>)}</div><div className="action-row"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span>Halaman {page}</span><button disabled={page * result.meta.pageSize >= result.meta.total} onClick={() => setPage(page + 1)}>Berikutnya</button></div></> : hasFilters ? <div className="empty-state"><p>Tidak ada karyawan sesuai filter.</p><button type="button" onClick={reset}>Reset filter</button></div> : <p>Belum ada karyawan. <AppLink to="/admin/karyawan/baru">Tambah karyawan</AppLink></p>}</section>
  </div>
}
