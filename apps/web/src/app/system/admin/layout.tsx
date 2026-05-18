import type { ReactNode } from 'react'
import { AuthGuard } from '../../../components/auth/AuthGuard'

export default function SystemAdminLayout({ children }: { children: ReactNode }) {
  return <AuthGuard allowedRoles={['ADMIN']}>{children}</AuthGuard>
}
