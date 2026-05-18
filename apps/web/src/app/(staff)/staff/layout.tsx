import type { ReactNode } from 'react'
import { AuthGuard } from '../../../components/auth/AuthGuard'

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <AuthGuard allowedRoles={['ADMIN', 'STAFF']}>{children}</AuthGuard>
}
