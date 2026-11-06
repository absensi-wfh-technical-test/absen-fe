import { useEffect } from 'react'
import { AdminAttendancePage, EmployeeHomePage, AttendanceHistoryPage, AttendanceDetailPage } from '@/features/attendance'
import { LoginPage, useAuth, type AuthUser } from '@/features/auth'
import { EmployeeListPage, EmployeeFormPage } from '@/features/employees'
import { AppLayout } from '@/layouts/AppLayout'
import { navigate, requestGuardedAction, usePathname } from '@/lib/navigation'
import { AppLink } from '@/components/ui/AppLink'
import { notify } from '@/lib/notice'

function StatePage({ title, message, to, link }: { title: string; message: string; to: string; link: string }) {
  return <section role="status"><h1>{title}</h1><p>{message}</p><AppLink to={to}>{link}</AppLink></section>
}

export function AppRouter() {
  const { user, logout } = useAuth()
  const path = usePathname()
  const home = user?.roleCode === 'ADMIN' ? '/admin/absensi' : '/app'

  useEffect(() => {
    if (!user && path !== '/login') navigate('/login', { sessionRedirect: true })
    if (user && (path === '/' || path === '/login')) navigate(home)
  }, [user, path, home])

  function authenticated(nextUser: AuthUser) {
    navigate(nextUser.roleCode === 'ADMIN' ? '/admin/absensi' : '/app')
    notify(`Berhasil masuk. Selamat datang, ${nextUser.fullName ?? nextUser.email}.`)
  }

  if (!user) return <LoginPage onAuthenticated={authenticated} />

  const isAdmin = user.roleCode === 'ADMIN'
  const links = isAdmin
    ? [{ label: 'Absensi', to: '/admin/absensi' }, { label: 'Karyawan', to: '/admin/karyawan' }]
    : [{ label: 'Beranda', to: '/app' }, { label: 'Riwayat', to: '/app/riwayat' }]

  let content
  if (path === '/app' && !isAdmin) content = <EmployeeHomePage name={user.fullName ?? user.email} />
  else if (path === '/app/riwayat' && !isAdmin) content = <AttendanceHistoryPage />
  else if (/^\/app\/riwayat\/\d+$/.test(path) && !isAdmin) content = <AttendanceDetailPage id={Number(path.split('/').at(-1))} admin={false} />
  else if (path === '/admin/absensi' && isAdmin) content = <AdminAttendancePage />
  else if (/^\/admin\/absensi\/\d+$/.test(path) && isAdmin) content = <AttendanceDetailPage id={Number(path.split('/').at(-1))} admin />
  else if (path === '/admin/karyawan' && isAdmin) content = <EmployeeListPage />
  else if (path === '/admin/karyawan/baru' && isAdmin) content = <EmployeeFormPage />
  else if (/^\/admin\/karyawan\/\d+$/.test(path) && isAdmin) content = <EmployeeFormPage id={Number(path.split('/').at(-1))} />
  else if ((path.startsWith('/admin/') && !isAdmin) || (path.startsWith('/app') && isAdmin)) {
    content = <StatePage title="Akses ditolak" message="Anda tidak memiliki akses ke halaman ini." to={home} link="Kembali ke beranda" />
  } else content = <StatePage title="Halaman tidak ditemukan" message="Data tidak ditemukan." to={home} link="Kembali ke beranda" />

  return <AppLayout name={user.fullName ?? user.email} email={user.email} role={isAdmin ? 'HRD' : 'Karyawan'}
    links={links} currentPath={path} onLogout={() => { requestGuardedAction('/login', () => { void logout().then(confirmed => { navigate('/login'); notify(confirmed ? 'Berhasil keluar dari aplikasi ini.' : 'Anda sudah keluar dari aplikasi ini. Koneksi ke server sempat terganggu.', confirmed ? 'success' : 'info') }) }) }}>
    {content}
  </AppLayout>
}
