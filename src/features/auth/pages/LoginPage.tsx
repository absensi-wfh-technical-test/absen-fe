import { LoginForm } from '../components/LoginForm'
import { AppIcon } from '@/components/ui/AppIcon'
import { useAuth } from '../hooks/useAuth'
import { useLogin } from '../hooks/useLogin'
import styles from './login-page.module.css'
import type { AuthUser } from '../types'

export function LoginPage({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const { expired } = useAuth()
  const { submit, busy, error, clearError } = useLogin(onAuthenticated)
  return (
    <main className={styles.shell}>
      <section className={styles.story} aria-label="Tentang Absensi WFH">
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            W
          </span>
          <span>Absensi WFH</span>
        </div>
        <div className={styles.storyCopy}>
          <p className={styles.eyebrow}>RUANG KERJA DIGITAL</p>
          <p className={styles.storyTitle}>Kehadiran yang jelas, hari kerja yang tenang.</p>
          <p>Catat aktivitas WFH dengan bukti foto dan waktu resmi dalam satu tempat.</p>
          <div className={styles.visual} aria-hidden="true">
            <span className={styles.orbit} />
            <span className={styles.visualCard}>
              <AppIcon name="clock" size={44} />
              <small>WAKTU DARI SISTEM</small>
            </span>
            <span className={styles.visualDot} />
          </div>
        </div>
        <p className={styles.storyFooter}>Dirancang untuk karyawan dan tim HRD.</p>
      </section>

      <section className={styles.formArea}>
        <div className={styles.card}>
          <p className={styles.formEyebrow}>SELAMAT DATANG</p>
          <h1 id="login-title">Masuk ke akun Anda</h1>
          <p className={styles.intro}>
            Gunakan akun yang diberikan oleh HRD untuk mengakses area kerja.
          </p>
          {expired && (
            <p className={styles.notice} role="status">
              Sesi Anda berakhir. Silakan masuk kembali.
            </p>
          )}
          <LoginForm onSubmit={submit} onEdit={clearError} busy={busy} error={error} />
        </div>
        <p className={styles.footer}>Kehadiran WFH tercatat berdasarkan waktu sistem.</p>
      </section>
    </main>
  )
}
