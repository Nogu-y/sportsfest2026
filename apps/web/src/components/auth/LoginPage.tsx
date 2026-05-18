'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginWithPassword, useAuthSession } from '../../hooks/useAuthSession'
import {
  normalizeReturnTo,
  resolveAuthorizedPath
} from '../../lib/auth/access'

export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, isLoading } = useAuthSession()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const returnTo = normalizeReturnTo(searchParams.get('returnTo'))

  useEffect(() => {
    if (isLoading || !session) {
      return
    }

    router.replace(resolveAuthorizedPath(session.account.role, returnTo))
  }, [isLoading, returnTo, router, session])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!loginId || !password) {
      setErrorMessage('ログインID とパスワードを入力してください')
      return
    }

    setErrorMessage(null)

    try {
      const nextSession = await loginWithPassword(loginId, password)

      startTransition(() => {
        router.replace(resolveAuthorizedPath(nextSession.account.role, returnTo))
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ログインに失敗しました')
    }
  }

  if (isLoading || session) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_60%)] px-6 py-16 text-white">
        <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm tracking-[0.2em] text-cyan-200">SPORTSFEST AUTH</p>
          <h1 className="mt-4 text-3xl font-semibold">セッションを確認しています</h1>
          <p className="mt-3 text-sm text-slate-300">
            ログイン状態に応じて移動先を決定しています。
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_60%)] px-6 py-12 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row">
        <section className="flex-1 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm tracking-[0.2em] text-cyan-200">SPORTSFEST AUTH</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            運営画面へ入るための
            <br />
            ログイン
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            `/system/admin/*` と `/staff/*` は、ログイン済みユーザーだけが利用できます。
            `/system/create/*` は現状公開のままです。
          </p>
        </section>

        <section className="w-full max-w-xl rounded-[2rem] border border-cyan-400/20 bg-slate-950/80 p-8 shadow-2xl">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="loginId" className="mb-2 block text-sm font-medium text-slate-200">
                ログインID
              </label>
              <input
                id="loginId"
                value={loginId}
                autoComplete="username"
                onChange={(event) => setLoginId(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? '移動しています...' : 'ログイン'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
