import type { ReactNode } from 'react'
import { AppIcon, type IconName } from '@/components/ui/AppIcon'
import { AppLink } from '@/components/ui/AppLink'
import styles from './app-layout.module.css'

interface Props {
  name: string
  email: string
  role: 'HRD' | 'Karyawan'
  links: { label: string; to: string; icon: IconName }[]
  currentPath: string
  onLogout: () => void
  children: ReactNode
}

export function AppLayout({ name, email, role, links, currentPath, onLogout, children }: Props) {
  const initials = name.trim().slice(0, 1).toUpperCase() || 'W'

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Area aplikasi">
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            W
          </span>
          <span>
            <strong>Absensi WFH</strong>
            <small>WORKSPACE</small>
          </span>
        </div>

        <div className={styles.navGroup}>
          <p className={styles.navCaption}>MENU {role.toUpperCase()}</p>
          <nav aria-label="Navigasi utama" className={styles.nav}>
            {links.map((link) => {
              const active =
                currentPath === link.to ||
                (link.to !== '/app' && currentPath.startsWith(`${link.to}/`))
              return (
                <AppLink
                  key={link.to}
                  to={link.to}
                  className={active ? styles.active : undefined}
                  ariaCurrent={active ? 'page' : undefined}
                >
                  <AppIcon name={link.icon} />
                  <span>{link.label}</span>
                </AppLink>
              )
            })}
          </nav>
        </div>

        <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden="true">
            {initials}
          </span>
          <span className={styles.identity}>
            <strong>{name}</strong>
            <small>
              {role} · {email}
            </small>
          </span>
          <button type="button" onClick={onLogout}>
            Keluar
          </button>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <span className={styles.crumb}>
            AREA KERJA <span aria-hidden="true">/</span> {role.toUpperCase()}
          </span>
          <span className={styles.timeNote}>
            <AppIcon name="clock" size={17} /> Waktu kehadiran dicatat oleh sistem
          </span>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
