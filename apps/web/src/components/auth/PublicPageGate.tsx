'use client'

import type { ReactNode } from 'react'

type PublicPageGateProps = {
  children: ReactNode
}

export function PublicPageGate({ children }: PublicPageGateProps) {
  return <>{children}</>
}
