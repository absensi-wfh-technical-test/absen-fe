import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth'
import { AppLink } from '@/components/ui/AppLink'
import { AppIcon } from '@/components/ui/AppIcon'
import { PhotoPicker } from '../components/PhotoPicker'
import { handleDialogKeyboard, restoreDialogFocus } from '@/components/ui/dialogKeyboard'
import { businessToday, formatDate, formatTime } from '@/lib/format'
import { notify } from '@/lib/notice'
import { AttendancePhoto } from '../components/AttendancePhoto'
import { useTodayAttendance } from '../hooks/useTodayAttendance'

const validPhoto = (file: File) =>
  ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024

export function EmployeeHomePage({ name }: { name: string }) {
  const { token } = useAuth()
  const { record, loading, busy, error, refresh, checkIn, replacePhoto, deleteRecord } =
    useTodayAttendance(token!)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [fileError, setFileError] = useState('')
  const [replacing, setReplacing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [photoRevision, setPhotoRevision] = useState(0)
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )
  function choose(file: File | undefined) {
    setFileError('')
    if (!file) {
      setFile(null)
      setPreview('')
      return
    }
    if (!validPhoto(file)) {
      setFile(null)
      setPreview('')
      setFileError('Gunakan foto JPEG, PNG, atau WebP maksimal 5 MB.')
      return
    }
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setFileError('Pilih foto bukti terlebih dahulu.')
      return
    }
    const ok = replacing && record ? await replacePhoto(record.id, file) : await checkIn(file)
    if (ok) {
      notify(replacing ? 'Foto bukti berhasil diganti.' : 'Absensi berhasil dicatat.')
      setFile(null)
      setPreview('')
      setReplacing(false)
      setPhotoRevision((value) => value + 1)
    }
  }
  async function remove() {
    if (!record) return
    setConfirmDelete(false)
    if (await deleteRecord(record.id)) {
      notify('Absensi hari ini berhasil dihapus. Anda dapat check-in kembali.')
      setFile(null)
      setPreview('')
    }
  }
  function cancelDelete() {
    setConfirmDelete(false)
    restoreDialogFocus(deleteTriggerRef.current)
  }
  return (
    <div className="workspace-stack">
      <header className="page-heading">
        <p className="eyebrow">BERANDA KARYAWAN</p>
        <h1>Halo, {name}</h1>
        <p>Catat kehadiran WFH dengan bukti foto. Waktu resmi ditentukan sistem.</p>
      </header>
      <section className="workspace-card status-hero" aria-labelledby="today-title">
        <div>
          <p className="eyebrow">{formatDate(businessToday())} · WIB</p>
          <h2 id="today-title">Status absensi hari ini</h2>
        </div>
        {loading ? (
          <p role="status">Memuat status absensi…</p>
        ) : error && !record ? (
          <div className="alert error" role="alert">
            <p>{error}</p>
            <button onClick={() => void refresh()}>Coba lagi</button>
          </div>
        ) : record ? (
          <>
            {error && (
              <div className="alert error" role="alert">
                <p>{error}</p>
                <button onClick={() => void refresh()}>Periksa lagi</button>
              </div>
            )}
            <p className="status-pill success">Sudah absen</p>
            <p className="hero-time">{formatTime(record.checkInAt)}</p>
            <p>
              Tercatat pada {formatDate(record.attendanceDate)}. Waktu asli tetap saat foto diganti.
            </p>
            <AttendancePhoto
              key={`${record.id}-${photoRevision}`}
              token={token!}
              id={record.id}
              label={`Foto bukti absensi ${formatDate(record.attendanceDate)}`}
            />
            <div className="action-row">
              <AppLink to={`/app/riwayat/${record.id}`}>Lihat detail</AppLink>
              {record.attendanceDate === businessToday() && (
                <>
                  <button type="button" onClick={() => setReplacing(true)}>
                    Ganti foto
                  </button>
                  <button
                    type="button"
                    className="danger-text"
                    onClick={(event) => {
                      deleteTriggerRef.current = event.currentTarget
                      setConfirmDelete(true)
                    }}
                  >
                    Hapus absensi
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="status-pill neutral">Belum ada absensi hari ini</p>
            <p>Siapkan satu foto yang menunjukkan aktivitas WFH Anda, lalu kirim absensi.</p>
          </>
        )}
      </section>
      {(!record || replacing) && !loading && !(error && !record) && (
        <section className="workspace-card" aria-labelledby="photo-title">
          <h2 id="photo-title" className="section-title">
            <AppIcon name="camera" />
            {replacing ? 'Ganti foto bukti' : 'Kirim absensi WFH'}
          </h2>
          <p className="section-lead">
            Pilih foto aktivitas kerja Anda. Foto hanya dapat dibaca oleh Anda dan HRD.
          </p>
          <form onSubmit={(event) => void submit(event)} className="workspace-form">
            <PhotoPicker
              id="attendance-photo"
              label="Foto bukti (JPEG, PNG, atau WebP; maks. 5 MB)"
              file={file}
              onSelect={(selected) => choose(selected ?? undefined)}
              disabled={busy}
            />
            {preview && (
              <img className="evidence-photo" src={preview} alt="Pratinjau foto yang dipilih" />
            )}
            {file && <p>Ukuran foto: {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
            {fileError && (
              <p className="field-error" role="alert">
                {fileError}
              </p>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <div className="action-row">
              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? 'Mengirim absensi…' : replacing ? 'Simpan foto baru' : 'Kirim absensi'}
              </button>
              {replacing && (
                <button
                  type="button"
                  onClick={() => {
                    setReplacing(false)
                    setFile(null)
                    setPreview('')
                  }}
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </section>
      )}
      {confirmDelete && (
        <div className="dialog-backdrop">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onKeyDown={(event) => handleDialogKeyboard(event, cancelDelete)}
          >
            <h2 id="delete-title">Hapus absensi hari ini?</h2>
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
