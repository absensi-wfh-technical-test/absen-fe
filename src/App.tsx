import { AuthProvider } from '@/features/auth'
import { AppRouter } from '@/routes/AppRouter'
import { NoticeToast } from '@/components/ui/NoticeToast'
import './assets/workspace.css'

export default function App() {
  return <AuthProvider><AppRouter /><NoticeToast /></AuthProvider>
}
