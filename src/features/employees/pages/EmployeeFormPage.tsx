import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth'
import { AppLink } from '@/components/ui/AppLink'
import { handleDialogKeyboard, restoreDialogFocus } from '@/components/ui/dialogKeyboard'
import { ApiError } from '@/lib/apiClient'
import { addNavigationBlocker, navigate } from '@/lib/navigation'
import { notify } from '@/lib/notice'
import { employeeApi } from '../services/employeeApi'
import type { Employee, EmployeePayload, Lookup } from '../types'

const empty: EmployeePayload = { employeeCode: '', fullName: '', email: '', departmentId: 0, positionId: 0, phoneNumber: null, hireDate: null, initialPassword: '' }

export function EmployeeFormPage({ id }: { id?: number }) {
  const { token } = useAuth()
  const [form, setForm] = useState<EmployeePayload>(empty)
  const [initialForm, setInitialForm] = useState<EmployeePayload>(empty)
  const dirtyRef = useRef(false)
  const savedRef = useRef(false)
  const allowLeaveRef = useRef(false)
  const statusTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [pendingLeave, setPendingLeave] = useState<{ proceed: () => void; restoreFocus: HTMLElement | null } | null>(null)
  const [existing, setExisting] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [positions, setPositions] = useState<Lookup[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ employeeCode?: string; email?: string }>({})
  const [confirmStatus, setConfirmStatus] = useState(false)
  useEffect(() => {
    let active = true
    savedRef.current = false
    allowLeaveRef.current = false
    Promise.all([employeeApi.departments(token!), employeeApi.positions(token!), id ? employeeApi.detail(token!, id) : Promise.resolve(null)])
      .then(([deps, pos, employee]) => { if (!active) return; setDepartments(deps); setPositions(pos); setExisting(employee); if (employee) { const loaded = { employeeCode: employee.employeeCode, fullName: employee.fullName, email: employee.email, departmentId: employee.department.id, positionId: employee.position.id, phoneNumber: employee.phoneNumber, hireDate: employee.hireDate }; setForm(loaded); setInitialForm(loaded) } })
      .catch(cause => { if (active) setLoadError(cause instanceof Error ? cause.message : 'Form belum dapat dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, id, reloadKey])
  useLayoutEffect(() => { dirtyRef.current = JSON.stringify(form) !== JSON.stringify(initialForm) }, [form, initialForm])
  useEffect(() => {
    const removeBlocker = addNavigationBlocker((_target, proceed) => {
      if (!dirtyRef.current || savedRef.current || allowLeaveRef.current) return true
      setPendingLeave({ proceed, restoreFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null })
      return false
    })
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || savedRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => { removeBlocker(); window.removeEventListener('beforeunload', beforeUnload) }
  }, [])
  function cancelLeave() { const opener = pendingLeave?.restoreFocus ?? null; setPendingLeave(null); restoreDialogFocus(opener) }
  function cancelStatus() { setConfirmStatus(false); restoreDialogFocus(statusTriggerRef.current) }
  function field<K extends keyof EmployeePayload>(name: K, value: EmployeePayload[K]) { setForm(current => ({ ...current, [name]: value })); setError(''); if (name === 'employeeCode' || name === 'email') setFieldErrors(current => ({ ...current, [name]: undefined })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setFieldErrors({})
    try {
      if (id) { const { initialPassword: _unused, ...update } = form; void _unused; await employeeApi.update(token!, id, update) }
      else await employeeApi.create(token!, form)
      savedRef.current = true
      notify('Data karyawan berhasil disimpan.'); navigate('/admin/karyawan')
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'DUPLICATE_EMAIL') { setFieldErrors({ email: 'Email sudah digunakan.' }); setError('Periksa email yang ditandai.') }
      else if (cause instanceof ApiError && cause.code === 'DUPLICATE_EMPLOYEE_CODE') { setFieldErrors({ employeeCode: 'Kode karyawan sudah digunakan.' }); setError('Periksa kode karyawan yang ditandai.') }
      else setError(cause instanceof Error ? cause.message : 'Data gagal disimpan.')
    }
    finally { setBusy(false) }
  }
  async function toggleStatus() {
    if (!existing) return
    setConfirmStatus(false)
    setBusy(true); setError('')
    try { const value = await employeeApi.setStatus(token!, existing.id, !existing.isActive); setExisting(value); notify(`Akun karyawan ${value.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Status gagal diubah.') }
    finally { setBusy(false) }
  }
  return <div className="workspace-stack"><AppLink to="/admin/karyawan">← Kembali ke daftar</AppLink><header className="page-heading"><p className="eyebrow">DATA MASTER</p><h1>{id ? 'Ubah karyawan' : 'Tambah karyawan'}</h1><p>{id ? 'Perbarui profil dan status akun.' : 'Buat akun dan profil karyawan dalam satu langkah.'}</p></header>
    <section className="workspace-card">{loading ? <p role="status">Memuat form…</p> : loadError ? <div className="alert error" role="alert"><p>{loadError}</p><button type="button" onClick={() => { setLoadError(''); setLoading(true); setReloadKey(value => value + 1) }}>Coba lagi</button></div> : <form className="workspace-form form-grid" onSubmit={event => void submit(event)}>
      <label>Kode karyawan<input required maxLength={30} value={form.employeeCode} aria-invalid={Boolean(fieldErrors.employeeCode)} aria-describedby={fieldErrors.employeeCode ? 'employee-code-error' : undefined} onChange={event => field('employeeCode', event.target.value)} />{fieldErrors.employeeCode && <span id="employee-code-error" className="field-error">{fieldErrors.employeeCode}</span>}</label>
      <label>Nama lengkap<input required maxLength={150} value={form.fullName} onChange={event => field('fullName', event.target.value)} /></label>
      <label>Email<input required type="email" value={form.email} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'employee-email-error' : undefined} onChange={event => field('email', event.target.value)} />{fieldErrors.email && <span id="employee-email-error" className="field-error">{fieldErrors.email}</span>}</label>
      {!id && <label>Kata sandi awal<input required type="password" minLength={8} value={form.initialPassword ?? ''} onChange={event => field('initialPassword', event.target.value)} autoComplete="new-password" /></label>}
      <label>Departemen<select required value={form.departmentId || ''} onChange={event => field('departmentId', Number(event.target.value))}><option value="">Pilih departemen</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Jabatan<select required value={form.positionId || ''} onChange={event => field('positionId', Number(event.target.value))}><option value="">Pilih jabatan</option>{positions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Nomor telepon (opsional)<input value={form.phoneNumber ?? ''} onChange={event => field('phoneNumber', event.target.value || null)} /></label>
      <label>Tanggal bergabung (opsional)<input type="date" value={form.hireDate ?? ''} onChange={event => field('hireDate', event.target.value || null)} /></label>
      {error && <p className="field-error full-span" role="alert">{error}</p>}
      <div className="action-row full-span"><button className="primary-button" disabled={busy} type="submit">{busy ? 'Menyimpan…' : 'Simpan karyawan'}</button><AppLink to="/admin/karyawan">Batal</AppLink></div>
    </form>}</section>
    {existing && <section className="workspace-card"><h2>Status akun</h2><p>Saat nonaktif, karyawan tidak dapat login atau check-in. Riwayatnya tetap tersimpan.</p><p className={`status-pill ${existing.isActive ? 'success' : 'neutral'}`}>{existing.isActive ? 'Aktif' : 'Nonaktif'}</p><div><button disabled={busy} className={existing.isActive ? 'danger-button' : 'primary-button'} onClick={event => { statusTriggerRef.current = event.currentTarget; setConfirmStatus(true) }}>{existing.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button></div></section>}
    {confirmStatus && existing && <div className="dialog-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="status-title" onKeyDown={event => handleDialogKeyboard(event, cancelStatus)}><h2 id="status-title">{existing.isActive ? 'Nonaktifkan' : 'Aktifkan'} akun?</h2><p>{existing.fullName} akan {existing.isActive ? 'kehilangan akses login dan check-in' : 'dapat login kembali'}. Riwayat absensi tetap tersimpan.</p><div className="action-row"><button type="button" autoFocus onClick={cancelStatus}>Batal</button><button type="button" className={existing.isActive ? 'danger-button' : 'primary-button'} onClick={() => void toggleStatus()}>{existing.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button></div></section></div>}
    {pendingLeave && <div className="dialog-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-title" onKeyDown={event => handleDialogKeyboard(event, cancelLeave)}><h2 id="leave-title">Tinggalkan form?</h2><p>Perubahan pada form karyawan belum disimpan dan akan hilang.</p><div className="action-row"><button type="button" autoFocus onClick={cancelLeave}>Tetap di form</button><button type="button" className="danger-button" onClick={() => { allowLeaveRef.current = true; pendingLeave.proceed(); setPendingLeave(null) }}>Tinggalkan halaman</button></div></section></div>}
  </div>
}
