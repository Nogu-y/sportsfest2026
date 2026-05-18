'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuthSession } from '../../hooks/useAuthSession'
import {
  buildLoginPath,
  getDefaultPathForRole,
  type AuthRole
} from '../../lib/auth/access'

type AuthGuardProps = {
  allowedRoles: AuthRole[]
  children: ReactNode
}

function buildCurrentPath(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString()

  if (!query) {
    return pathname
  }

  return `${pathname}?${query}`
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { session, error, isLoading } = useAuthSession()

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!session) {
      router.replace(buildLoginPath(buildCurrentPath(pathname, searchParams)))
      return
    }

    if (!allowedRoles.includes(session.account.role)) {
      router.replace(getDefaultPathForRole(session.account.role))
    }
  }, [allowedRoles, isLoading, pathname, router, searchParams, session])

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm text-slate-300">Auth Guard</p>
          <h1 className="mt-3 text-2xl font-semibold">認証状態を確認できませんでした</h1>
          <p className="mt-3 text-sm text-slate-300">
            画面を再読み込みしてから、もう一度お試しください。
          </p>
        </div>
      </main>
    )
  }

  if (isLoading || !session) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm text-slate-300">Auth Guard</p>
          <h1 className="mt-3 text-2xl font-semibold">認証状態を確認しています</h1>
          <p className="mt-3 text-sm text-slate-300">
            セッションを確認中です。しばらくお待ちください。
          </p>
        </div>
      </main>
    )
  }

  if (!allowedRoles.includes(session.account.role)) {
    return null
  }

  return <>{children}</>
}
