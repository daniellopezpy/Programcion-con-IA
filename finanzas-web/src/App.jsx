import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { PasswordRecoveryPage } from '@/pages/PasswordRecoveryPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { EntriesPage } from '@/pages/EntriesPage'
import { IncomeFormPage } from '@/pages/IncomeFormPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { ExpenseFormPage } from '@/pages/ExpenseFormPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { PreferencesPage } from '@/pages/PreferencesPage'
import { SavingsGoalsPage } from '@/pages/SavingsGoalsPage'

const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })))
const ReceivablesPage = lazy(() => import('@/pages/ReceivablesPage').then((module) => ({ default: module.ReceivablesPage })))
const RecurringPaymentsPage = lazy(() => import('@/pages/RecurringPaymentsPage').then((module) => ({ default: module.RecurringPaymentsPage })))

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<PasswordRecoveryPage key="request" />} />
        <Route path="/restablecer-contrasena" element={<PasswordRecoveryPage key="reset" reset />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="ingresos" element={<EntriesPage />} />
          <Route path="ingresos/nuevo" element={<IncomeFormPage />} />
          <Route path="ingresos/:id/editar" element={<IncomeFormPage />} />
          <Route path="egresos" element={<ExpensesPage />} />
          <Route path="egresos/nuevo" element={<ExpenseFormPage />} />
          <Route path="egresos/:id/editar" element={<ExpenseFormPage />} />
          <Route path="analisis" element={<Suspense fallback={<p role="status">Cargando análisis…</p>}><AnalyticsPage /></Suspense>} />
          <Route path="por-cobrar" element={<Suspense fallback={<p role="status">Cargando cobros…</p>}><ReceivablesPage /></Suspense>} />
          <Route path="pagos-recurrentes" element={<Suspense fallback={<p role="status">Cargando pagos…</p>}><RecurringPaymentsPage /></Suspense>} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="perfil/personalizar" element={<PreferencesPage />} />
          <Route path="perfil/metas" element={<SavingsGoalsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
