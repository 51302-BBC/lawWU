import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { isApprover } from '../api/authApi'
import { LoginPage } from '../features/auth/LoginPage'
import { CalendarPage } from '../features/employee/CalendarPage'
import { DashboardPage } from '../features/employee/DashboardPage'
import { RecordsPage } from '../features/employee/RecordsPage'
import { ApprovalsPage } from '../features/manager/ApprovalsPage'
import { TeamPage } from '../features/manager/TeamPage'
import { ToastProvider } from '../ui/components'
import { SessionProvider, useSession } from './session'
import { Shell } from './Shell'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Shell>{children}</Shell>
}

function RequireApprover({ children }: { children: ReactNode }) {
  const { user } = useSession()
  if (user && !isApprover(user)) return <Navigate to="/" replace />
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/apply" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/records" element={<RequireAuth><RecordsPage /></RequireAuth>} />
      <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
      <Route
        path="/approvals"
        element={<RequireAuth><RequireApprover><ApprovalsPage /></RequireApprover></RequireAuth>}
      />
      <Route path="/team" element={<RequireAuth><RequireApprover><TeamPage /></RequireApprover></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </SessionProvider>
  )
}
