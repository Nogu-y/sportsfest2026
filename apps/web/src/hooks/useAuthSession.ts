'use client'

import useSWR, { mutate } from 'swr'
import { api } from '../lib/api/client'
import type { AuthSession } from '../lib/auth/access'

const authSessionKey = 'api/auth/session'

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const payload = await response.json() as { message?: string }
    return payload.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

async function fetchAuthSession(): Promise<AuthSession | null> {
  const response = await api.api.auth.session.$get()

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, '認証状態の確認に失敗しました'))
  }

  return await response.json() as AuthSession
}

export async function loginWithPassword(loginId: string, password: string) {
  const response = await api.api.auth.login.$post({
    json: {
      loginId,
      password
    }
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'ログインに失敗しました'))
  }

  const session = await response.json() as AuthSession
  await mutate(authSessionKey, session, false)

  return session
}

export async function updateAuthSessionCache(session: AuthSession | null) {
  await mutate(authSessionKey, session, false)
}

export function useAuthSession() {
  const {
    data,
    error,
    isLoading,
    mutate: mutateSession
  } = useSWR<AuthSession | null>(authSessionKey, fetchAuthSession, {
    revalidateOnFocus: true,
    shouldRetryOnError: false
  })

  return {
    session: data ?? null,
    error,
    isLoading,
    mutateSession
  }
}
