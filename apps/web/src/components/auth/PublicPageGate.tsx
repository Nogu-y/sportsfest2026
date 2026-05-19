'use client'

import type { ReactNode } from 'react'
import { useAuthSession } from '../../hooks/useAuthSession'
import { ComingSoon } from '../layouts/messagePage/ComingSoon'

type PublicPageGateProps = {
  children: ReactNode
}

export function PublicPageGate({ children }: PublicPageGateProps) {
  const { session, isLoading } = useAuthSession()

  if (isLoading) {
    return <ComingSoon />
  }

  if (!session) {
    return <ComingSoon />
  }

  return <>{children}</>
}

