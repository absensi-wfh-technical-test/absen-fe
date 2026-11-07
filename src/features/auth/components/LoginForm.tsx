import { useState, type FormEvent } from 'react'
import styles from './login-form.module.css'

interface Props {
  onSubmit: (email: string, password: string) => Promise<void>
  onEdit: () => void
  busy: boolean
  error: string
}

export function LoginForm({ onSubmit, onEdit, busy, error }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldError, setFieldError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setFieldError('Masukkan email yang valid dan kata sandi.')
      return
    }
    setFieldError('')
    void onSubmit(email.trim(), password)
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFieldError('')
            onEdit()
          }}
          disabled={busy}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? 'login-field-error' : undefined}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="login-password">Kata sandi</label>
        <div className={styles.passwordRow}>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setFieldError('')
              onEdit()
            }}
            disabled={busy}
            aria-invalid={!!fieldError}
            required
          />
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>
      </div>
      {fieldError && (
        <p id="login-field-error" className={styles.error} role="alert">
          {fieldError}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.submit} type="submit" disabled={busy}>
        {busy ? 'Memproses…' : 'Masuk'}
      </button>
    </form>
  )
}
