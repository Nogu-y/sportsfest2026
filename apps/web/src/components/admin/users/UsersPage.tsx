'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api/client'

type AdminUser = {
  id: number
  loginId: string
  displayName: string
  role: 'ADMIN' | 'STAFF'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type UserDraft = {
  loginId: string
  displayName: string
  role: 'ADMIN' | 'STAFF'
  isActive: boolean
  password: string
}

function createInitialDraft(): UserDraft {
  return {
    loginId: '',
    displayName: '',
    role: 'STAFF',
    isActive: true,
    password: '',
  }
}

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const payload = await response.json() as { message?: string }
    return payload.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function sortUsers(users: AdminUser[]) {
  return [...users].sort((a, b) => a.loginId.localeCompare(b.loginId))
}

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [createDraft, setCreateDraft] = useState<UserDraft>(createInitialDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<UserDraft>(createInitialDraft)

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingId) ?? null,
    [editingId, users],
  )

  async function loadUsers() {
    const response = await api.api.admin.users.$get()
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'ユーザー一覧の取得に失敗しました'))
    }

    const data = await response.json() as AdminUser[]
    setUsers(sortUsers(data))
  }

  useEffect(() => {
    loadUsers()
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : '初期化に失敗しました')
      })
      .finally(() => setIsLoading(false))
  }, [])

  function startEdit(user: AdminUser) {
    setEditingId(user.id)
    setEditDraft({
      loginId: user.loginId,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      password: '',
    })
    setErrorMessage(null)
    setInfoMessage(null)
  }

  async function handleCreate() {
    if (!createDraft.loginId || !createDraft.displayName || !createDraft.password) {
      setErrorMessage('loginId・表示名・パスワードは必須です')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      const response = await api.api.admin.users.$post({
        json: {
          loginId: createDraft.loginId,
          displayName: createDraft.displayName,
          role: createDraft.role,
          isActive: createDraft.isActive,
          password: createDraft.password,
        },
      })

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'ユーザー作成に失敗しました'))
      }

      const created = await response.json() as AdminUser
      setUsers((current) => sortUsers([...current, created]))
      setCreateDraft(createInitialDraft())
      setInfoMessage('ユーザーを作成しました')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ユーザー作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate() {
    if (!editingUser) return
    if (!editDraft.displayName) {
      setErrorMessage('表示名は必須です')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      const response = await api.api.admin.users[':id'].$put({
        param: { id: String(editingUser.id) },
        json: {
          displayName: editDraft.displayName,
          role: editDraft.role,
          isActive: editDraft.isActive,
          password: editDraft.password || undefined,
        },
      })

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'ユーザー更新に失敗しました'))
      }

      const updated = await response.json() as AdminUser
      setUsers((current) =>
        sortUsers(current.map((user) => (user.id === updated.id ? updated : user))),
      )
      setEditingId(null)
      setEditDraft(createInitialDraft())
      setInfoMessage('ユーザーを更新しました')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ユーザー更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm(`ID ${id} のユーザーを削除しますか？`)) return

    setIsSubmitting(true)
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      const response = await api.api.admin.users[':id'].$delete({
        param: { id: String(id) },
      })

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'ユーザー削除に失敗しました'))
      }

      setUsers((current) => current.filter((user) => user.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setEditDraft(createInitialDraft())
      }
      setInfoMessage('ユーザーを削除しました')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ユーザー削除に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">System Admin / Users</p>
          <h1 className="mt-2 text-2xl font-semibold">管理ユーザー管理</h1>
          <p className="mt-2 text-sm text-slate-600">
            管理ユーザーの一覧・作成・更新・削除を行います。
          </p>
        </section>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}
        {infoMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {infoMessage}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">ユーザー一覧</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-max border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {['ID', 'loginId', '表示名', 'ロール', '有効', '更新日時', '操作'].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border-b border-slate-100 px-3 py-3">{user.id}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{user.loginId}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{user.displayName}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{user.role}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{String(user.isActive)}</td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {new Date(user.updatedAt).toLocaleString('ja-JP')}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDelete(user.id)
                          }}
                          className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700"
                          disabled={isSubmitting}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                      ユーザーがまだありません
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">新規作成</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">loginId</span>
              <input
                value={createDraft.loginId}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, loginId: event.target.value }))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">表示名</span>
              <input
                value={createDraft.displayName}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, displayName: event.target.value }))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">ロール</span>
              <select
                value={createDraft.role}
                onChange={(event) =>
                  setCreateDraft((current) => ({
                    ...current,
                    role: event.target.value as UserDraft['role'],
                  }))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">有効</span>
              <select
                value={String(createDraft.isActive)}
                onChange={(event) =>
                  setCreateDraft((current) => ({
                    ...current,
                    isActive: event.target.value === 'true',
                  }))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
              <span className="font-medium">パスワード (8文字以上)</span>
              <input
                type="password"
                value={createDraft.password}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, password: event.target.value }))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                void handleCreate()
              }}
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              作成
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">個別更新</h2>
          {!editingUser ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              一覧の「編集」から対象を選択してください
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">ID</span>
                <input
                  value={String(editingUser.id)}
                  disabled
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">loginId</span>
                <input
                  value={editDraft.loginId}
                  disabled
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">表示名</span>
                <input
                  value={editDraft.displayName}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, displayName: event.target.value }))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">ロール</span>
                <select
                  value={editDraft.role}
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      role: event.target.value as UserDraft['role'],
                    }))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">有効</span>
                <select
                  value={String(editDraft.isActive)}
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      isActive: event.target.value === 'true',
                    }))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-medium">新しいパスワード (任意)</span>
                <input
                  type="password"
                  value={editDraft.password}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, password: event.target.value }))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>
            </div>
          )}

          {editingUser ? (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleUpdate()
                }}
                disabled={isSubmitting}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                更新
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setEditDraft(createInitialDraft())
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                キャンセル
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
