import type { ReactNode } from 'react'
import { AppLink } from '@/components/ui/AppLink'
import styles from './app-layout.module.css'

interface Props {
  name: string
  email: string
  role: 'HRD' | 'Karyawan'
  links: { label: string; to: string }[]
  currentPath: string
  onLogout: () => void
  children: ReactNode
}

export function AppLayout({ name, email, role, links, currentPath, onLogout, children }: Props) {
  return <div className={styles.shell}>
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}><span className={styles.mark}>W</span><span>Absensi WFH</span></div>
        <nav aria-label="Navigasi utama" className={styles.nav}>
          {links.map(link => <AppLink key={link.to} to={link.to} className={currentPath === link.to ? styles.active : undefined}>{link.label}</AppLink>)}
        </nav>
        <div className={styles.account}><span><strong>{name}</strong><small>{role} · {email}</small></span><button type="button" onClick={onLogout}>Keluar</button></div>
      </div>
    </header>
    <main className={styles.main}>{children}</main>
  </div>
}
