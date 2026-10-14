import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { EntriesPage } from '@/pages/EntriesPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { ExpenseFormPage } from '@/pages/ExpenseFormPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="ingresos" element={<EntriesPage />} />
          <Route path="egresos" element={<ExpensesPage />} />
          <Route path="egresos/nuevo" element={<ExpenseFormPage />} />
          <Route path="egresos/:id/editar" element={<ExpenseFormPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
