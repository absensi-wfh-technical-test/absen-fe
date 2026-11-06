import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'
import { useLogin } from '../hooks/useLogin'
import styles from './login-page.module.css'
import type { AuthUser } from '../types'

export function LoginPage({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const { expired } = useAuth()
  const { submit, busy, error, clearError } = useLogin(onAuthenticated)
  return <main className={styles.shell}>
    <div className={styles.brand}><span className={styles.mark}>W</span><span>Absensi WFH</span></div>
    <section className={styles.card} aria-labelledby="login-title">
      <p className={styles.eyebrow}>PORTAL KARYAWAN</p>
      <h1 id="login-title">Masuk ke Absensi WFH</h1>
      <p className={styles.intro}>Gunakan akun yang diberikan oleh HRD untuk mengakses area kerja Anda.</p>
      {expired && <p className={styles.notice} role="status">Sesi Anda berakhir. Silakan masuk kembali.</p>}
      <LoginForm onSubmit={submit} onEdit={clearError} busy={busy} error={error} />
    </section>
    <p className={styles.footer}>Kehadiran WFH tercatat berdasarkan waktu sistem.</p>
  </main>
}
