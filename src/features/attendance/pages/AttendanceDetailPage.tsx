import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth'
import { AppLink } from '@/components/ui/AppLink'
import { handleDialogKeyboard, restoreDialogFocus } from '@/components/ui/dialogKeyboard'
import { ApiError } from '@/lib/apiClient'
import { businessToday, formatDate, formatTime } from '@/lib/format'
import { navigate } from '@/lib/navigation'
import { notify } from '@/lib/notice'
import { AttendancePhoto } from '../components/AttendancePhoto'
import { PhotoPicker } from '../components/PhotoPicker'
import { attendanceApi } from '../services/attendanceApi'
import type { AttendanceRecord } from '../types'

export function AttendanceDetailPage({ id, admin }: { id: number; admin: boolean }) {
  const { token } = useAuth()
  const [record, setRecord] = useState<AttendanceRecord | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [revision, setRevision] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)
  const back = admin ? '/admin/absensi' : '/app/riwayat'
  useEffect(() => {
    let active = true
    attendanceApi
      .detail(token!, id)
      .then((value) => {
        if (active) setRecord(value)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Data tidak ditemukan.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, id])
  async function replace() {
    if (!file || !record) return
    setBusy(true)
    setError('')
    try {
      const value = await attendanceApi.replacePhoto(token!, id, file)
      setRecord(value)
      setRevision((n) => n + 1)
      setFile(null)
      notify('Foto bukti berhasil diganti.')
    } catch (cause) {
      if (cause instanceof ApiError && (cause.status === 0 || cause.status === 503)) {
        try {
          setRecord(await attendanceApi.detail(token!, id))
          setRevision((n) => n + 1)
          setError(
            'Hasil penggantian belum pasti. Detail dan foto telah dimuat ulang; periksa sebelum mencoba lagi.',
          )
        } catch {
          setError(
            'Hasil penggantian belum pasti dan detail belum dapat diperiksa. Coba muat halaman lagi sebelum mengirim ulang.',
          )
        }
      } else setError(cause instanceof Error ? cause.message : 'Foto gagal diganti.')
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    setConfirmDelete(false)
    setBusy(true)
    setError('')
    try {
      await attendanceApi.delete(token!, id)
      notify('Absensi berhasil dihapus.')
      navigate('/app')
    } catch (cause) {
      if (cause instanceof ApiError && (cause.status === 0 || cause.status === 503)) {
        try {
          setRecord(await attendanceApi.detail(token!, id))
          setError(
            'Hasil penghapusan belum pasti. Catatan masih tersedia saat diperiksa; periksa status sebelum mencoba lagi.',
          )
        } catch (checkError) {
          if (checkError instanceof ApiError && checkError.status === 404) {
            notify(
              'Catatan tidak ditemukan setelah pemeriksaan. Periksa status hari ini sebelum check-in ulang.',
              'info',
            )
            navigate('/app')
          } else
            setError(
              'Hasil penghapusan belum pasti dan status belum dapat diperiksa. Coba muat halaman lagi sebelum mencoba lagi.',
            )
        }
      } else setError(cause instanceof Error ? cause.message : 'Absensi gagal dihapus.')
    } finally {
      setBusy(false)
    }
  }
  function cancelDelete() {
    setConfirmDelete(false)
    restoreDialogFocus(deleteTriggerRef.current)
  }
  return (
    <div className="workspace-stack">
      <AppLink to={back}>← Kembali ke daftar</AppLink>
      <header className="page-heading">
        <p className="eyebrow">BUKTI WFH</p>
        <h1>Detail absensi</h1>
      </header>
      <section className="workspace-card">
        {loading ? (
          <p role="status">Memuat detail…</p>
        ) : !record ? (
          <div className="alert error">
            <p>{error || 'Data tidak ditemukan.'}</p>
            <AppLink to={back}>Kembali</AppLink>
          </div>
        ) : (
          <>
            <div className="detail-grid">
              <div>
                <small>Tanggal</small>
                <strong>{formatDate(record.attendanceDate)}</strong>
              </div>
              <div>
                <small>Waktu check-in</small>
                <strong>{formatTime(record.checkInAt)}</strong>
              </div>
              <div>
                <small>Karyawan</small>
                <strong>
                  {record.employee.fullName} · {record.employee.employeeCode}
                </strong>
              </div>
              <div>
                <small>Departemen / jabatan terkini</small>
                <strong>
                  {record.employee.department.name} / {record.employee.position.name}
                </strong>
              </div>
            </div>
            <div className="evidence-heading">
              <h2>Foto bukti WFH</h2>
              <p>Dokumentasi kehadiran pada waktu yang tercatat di atas.</p>
            </div>
            <AttendancePhoto
              key={`${id}-${revision}`}
              token={token!}
              id={id}
              label={`Foto bukti WFH ${formatDate(record.attendanceDate)}`}
            />
            {!admin && record.attendanceDate === businessToday() && (
              <div className="workspace-form">
                <h2>Kelola absensi hari ini</h2>
                <p>
                  Ganti foto tanpa mengubah waktu check-in, atau hapus catatan agar dapat check-in
                  kembali.
                </p>
                <PhotoPicker
                  id="replacement-photo"
                  label="Foto pengganti (JPEG, PNG, atau WebP; maks. 5 MB)"
                  file={file}
                  onSelect={setFile}
                  disabled={busy}
                />
                <div className="action-row">
                  <button
                    className="primary-button"
                    disabled={!file || busy}
                    onClick={() => void replace()}
                  >
                    Simpan foto baru
                  </button>
                  <button
                    className="danger-button"
                    disabled={busy}
                    onClick={(event) => {
                      deleteTriggerRef.current = event.currentTarget
                      setConfirmDelete(true)
                    }}
                  >
                    Hapus absensi
                  </button>
                </div>
              </div>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </section>
      {confirmDelete && (
        <div className="dialog-backdrop">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-delete-title"
            onKeyDown={(event) => handleDialogKeyboard(event, cancelDelete)}
          >
            <h2 id="detail-delete-title">Hapus absensi hari ini?</h2>
            <p>Catatan dan foto bukti akan dihapus. Anda dapat check-in kembali hari ini.</p>
            <div className="action-row">
              <button type="button" autoFocus onClick={cancelDelete}>
                Batal
              </button>
              <button type="button" className="danger-button" onClick={() => void remove()}>
                Hapus absensi
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
