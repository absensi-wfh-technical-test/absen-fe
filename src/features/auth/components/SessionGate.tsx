import styles from './session-gate.module.css'

interface Props {
  offline: boolean
  onRetry: () => void
  onSignInAgain: () => void
}

export function SessionGate({ offline, onRetry, onSignInAgain }: Props) {
  return (
    <main className={styles.shell} role="status">
      <div className={styles.mark} aria-hidden="true">
        W
      </div>
      <p className={styles.eyebrow}>ABSENSI WFH</p>
      <h1>{offline ? 'Sesi belum dapat diverifikasi' : 'Memeriksa sesi…'}</h1>
      <p>
        {offline
          ? 'Koneksi ke server belum tersedia. Sesi Anda tetap tersimpan dan dapat diperiksa kembali.'
          : 'Kami sedang memeriksa akses Anda sebelum membuka area kerja.'}
      </p>
      {offline && (
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onRetry}>
            Coba lagi
          </button>
          <button type="button" className={styles.secondary} onClick={onSignInAgain}>
            Masuk ulang
          </button>
        </div>
      )}
    </main>
  )
}
