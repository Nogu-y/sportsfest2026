import { stderr, stdout } from 'node:process'
import { client } from '../../db/client'
import {
  type AccountSummary,
  authenticateAdminAccount,
  createAuthAccount,
  deleteAuthAccount,
  findAuthAccountByLoginId,
  hasActiveAdminAccount,
  listAuthAccounts,
  updateAuthAccountActiveState,
  updateAuthAccountPassword,
  updateAuthAccountRole
} from '../../repositories/auth/accountAdmin'
import type { AuthAccountRole } from '../../repositories/auth/accountAdmin'
import {
  ask,
  askHidden,
  askPasswordWithConfirmation,
  askRole,
  confirm
} from './prompts'

const PASSWORD_MIN_LENGTH = 12
const passwordPolicyPattern =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/

const usage = `Usage:
  pnpm --filter @sportsfest/api auth:bootstrap-admin
  pnpm --filter @sportsfest/api auth:account
  pnpm --filter @sportsfest/api auth:account <list|create|passwd|role|activate|deactivate|delete>`

const interactiveHelp = `Commands:
  list        アカウント一覧を表示
  create      アカウントを作成
  passwd      パスワードを変更
  role        ロールを変更
  activate    アカウントを有効化
  deactivate  アカウントを無効化
  delete      アカウントを削除
  help        この一覧を表示
  exit        対話モードを終了`

const executableCommands = new Set([
  'list',
  'create',
  'passwd',
  'role',
  'activate',
  'deactivate',
  'delete'
])

// 仕様書の運用ルールに合わせて 12 文字以上かつ英字・数字・記号を要求する。
const ensurePasswordPolicy = (password: string) => {
  if (!passwordPolicyPattern.test(password)) {
    throw new Error(
      `パスワードは ${PASSWORD_MIN_LENGTH} 文字以上で、英字・数字・記号を含めてください`
    )
  }
}

const printError = (message: string) => {
  stdout.write(`error: ${message}\n`)
}

// 成功時の出力は最小限に絞り、パスワード関連情報は出さない。
const printAccount = (account: {
  loginId: string
  displayName: string
  role: AuthAccountRole
  isActive: boolean
}) => {
  stdout.write(
    `loginId=${account.loginId} displayName=${account.displayName} role=${account.role} active=${account.isActive}\n`
  )
}

const ensureExistingAccount = async (loginId: string) => {
  const account = await findAuthAccountByLoginId(loginId)

  if (!account) {
    throw new Error(`loginId=${loginId} のアカウントが見つかりません`)
  }

  return account
}

const askRequired = async (label: string) => {
  while (true) {
    const value = await ask(label)

    if (value) {
      return value
    }

    printError(`${label} は必須です`)
  }
}

// パスワード入力中のミスでは CLI 全体を落とさず、その場で再入力へ戻す。
const askValidPassword = async () => {
  while (true) {
    try {
      const password = await askPasswordWithConfirmation()
      ensurePasswordPolicy(password)
      return password
    } catch (error) {
      printError(error instanceof Error ? error.message : 'パスワード入力に失敗しました')
    }
  }
}

// ADMIN 付与は影響が大きいため、追加確認を挟む。
const confirmAdminChange = async (role: AuthAccountRole, message: string) => {
  if (role !== 'ADMIN') {
    return
  }

  const accepted = await confirm(message)

  if (!accepted) {
    throw new Error('キャンセルしました')
  }
}

const runList = async () => {
  const accounts = await listAuthAccounts()

  if (accounts.length === 0) {
    stdout.write('アカウントは登録されていません\n')
    return
  }

  console.table(
    accounts.map((account) => ({
      id: account.id,
      loginId: account.loginId,
      displayName: account.displayName,
      role: account.role,
      active: account.isActive,
      createdAt: account.createdAt
    }))
  )
}

const runCreate = async () => {
  // 新規作成時は重複 loginId を先に弾いてからパスワード入力へ進む。
  const loginId = await askRequired('loginId')
  const displayName = await askRequired('displayName')
  const role = await askRole('STAFF')

  if (await findAuthAccountByLoginId(loginId)) {
    throw new Error(`loginId=${loginId} はすでに使用されています`)
  }

  await confirmAdminChange(role, 'ADMIN アカウントを作成します。続行しますか？')

  const password = await askValidPassword()

  const created = await createAuthAccount({
    loginId,
    displayName,
    role,
    password
  })

  stdout.write('アカウントを作成しました\n')
  printAccount(created)
}

const runBootstrapAdmin = async () => {
  const hasAdmin = await hasActiveAdminAccount()

  if (hasAdmin) {
    throw new Error('有効な ADMIN がすでに存在するため bootstrap-admin は実行できません')
  }

  stdout.write('初期 ADMIN アカウントを作成します\n')

  const loginId = await askRequired('loginId')
  const displayName = await askRequired('displayName')

  if (await findAuthAccountByLoginId(loginId)) {
    throw new Error(`loginId=${loginId} はすでに使用されています`)
  }

  const accepted = await confirm(
    `${loginId} を初期 ADMIN として作成しますか？`
  )

  if (!accepted) {
    throw new Error('キャンセルしました')
  }

  const password = await askValidPassword()

  const created = await createAuthAccount({
    loginId,
    displayName,
    role: 'ADMIN',
    password
  })

  stdout.write('初期 ADMIN アカウントを作成しました\n')
  printAccount(created)
}

const runPasswordUpdate = async () => {
  const loginId = await askRequired('loginId')
  const account = await ensureExistingAccount(loginId)
  const password = await askValidPassword()

  await updateAuthAccountPassword(account.loginId, password)
  stdout.write(`パスワードを更新しました: ${account.loginId}\n`)
}

const runRoleUpdate = async () => {
  const loginId = await askRequired('loginId')
  const account = await ensureExistingAccount(loginId)
  const nextRole = await askRole(account.role)

  if (nextRole === account.role) {
    stdout.write('ロール変更はありません\n')
    return
  }

  await confirmAdminChange(
    nextRole,
    `${account.loginId} を ADMIN に変更します。続行しますか？`
  )

  const accepted = await confirm(
    `${account.loginId} の role を ${account.role} から ${nextRole} へ変更しますか？`
  )

  if (!accepted) {
    throw new Error('キャンセルしました')
  }

  const result = await updateAuthAccountRole(account.loginId, nextRole)

  if ('error' in result) {
    if (result.error === 'last_active_admin') {
      throw new Error('最後の有効な ADMIN を外すことはできません')
    }
    throw new Error('アカウントが見つかりません')
  }

  stdout.write('ロールを更新しました\n')
  printAccount(result.account)
}

const runActivationUpdate = async (isActive: boolean) => {
  const loginId = await askRequired('loginId')
  const account = await ensureExistingAccount(loginId)
  const actionLabel = isActive ? '有効化' : '無効化'

  if (account.isActive === isActive) {
    stdout.write(`すでに${actionLabel}済みです: ${account.loginId}\n`)
    return
  }

  const accepted = await confirm(`${account.loginId} を${actionLabel}しますか？`)

  if (!accepted) {
    throw new Error('キャンセルしました')
  }

  const result = await updateAuthAccountActiveState(account.loginId, isActive)

  if ('error' in result) {
    if (result.error === 'last_active_admin') {
      throw new Error('最後の有効な ADMIN を無効化することはできません')
    }
    throw new Error('アカウントが見つかりません')
  }

  stdout.write(`アカウントを${actionLabel}しました\n`)
  printAccount(result.account)
}

const runDelete = async () => {
  // 完全削除は影響が大きいため、loginId の再入力を要求する。
  const loginId = await askRequired('loginId')
  const account = await ensureExistingAccount(loginId)

  stdout.write('削除すると関連セッションも失われます\n')

  const typed = await ask(`削除を続行するには ${account.loginId} を再入力してください`)

  if (typed !== account.loginId) {
    throw new Error('確認用の loginId が一致しません')
  }

  const accepted = await confirm(`${account.loginId} を完全削除しますか？`)

  if (!accepted) {
    throw new Error('キャンセルしました')
  }

  const result = await deleteAuthAccount(account.loginId)

  if ('error' in result) {
    if (result.error === 'last_active_admin') {
      throw new Error('最後の有効な ADMIN を削除することはできません')
    }
    throw new Error('アカウントが見つかりません')
  }

  stdout.write('アカウントを削除しました\n')
  printAccount(result.account)
}

// 通常操作は DB 上の有効な ADMIN アカウントで認証する。
const verifyAdminOperator = async () => {
  while (true) {
    const loginId = await askRequired('admin loginId')
    const password = await askHidden('admin password')
    const account = await authenticateAdminAccount(loginId, password)

    if (!account) {
      printError('有効な ADMIN として認証できませんでした')
      continue
    }

    stdout.write(`authenticated as ${account.loginId}\n`)
    return account
  }
}

const runCommand = async (command: string) => {
  switch (command) {
    case 'list':
      await runList()
      return
    case 'create':
      await runCreate()
      return
    case 'passwd':
      await runPasswordUpdate()
      return
    case 'role':
      await runRoleUpdate()
      return
    case 'activate':
      await runActivationUpdate(true)
      return
    case 'deactivate':
      await runActivationUpdate(false)
      return
    case 'delete':
      await runDelete()
      return
    default:
      throw new Error(`不明なコマンドです: ${command}`)
  }
}

const runInteractiveSession = async (operator: AccountSummary) => {
  stdout.write(`${interactiveHelp}\n`)

  while (true) {
    const command = (await ask(`${operator.loginId}>`)).trim().toLowerCase()

    if (!command) {
      continue
    }

    if (command === 'exit' || command === 'quit') {
      stdout.write('認証セッションを終了します\n')
      return
    }

    if (command === 'help') {
      stdout.write(`${interactiveHelp}\n`)
      continue
    }

    if (!executableCommands.has(command)) {
      printError(`不明なコマンドです: ${command}`)
      continue
    }

    try {
      await runCommand(command)
    } catch (error) {
      printError(error instanceof Error ? error.message : '操作に失敗しました')
    }
  }
}

const run = async () => {
  // 引数なしは対話モード、引数ありは 1 回だけ実行する。
  const command = process.argv[2]

  if (command === 'bootstrap-admin') {
    await runBootstrapAdmin()
    return
  }

  const operator = await verifyAdminOperator()

  if (!command) {
    await runInteractiveSession(operator)
    return
  }

  if (!executableCommands.has(command)) {
    stdout.write(`${usage}\n`)
    process.exitCode = 1
    return
  }

  await runCommand(command)
}

run()
  .catch((error) => {
    stderr.write(`${error instanceof Error ? error.message : '不明なエラーが発生しました'}\n`)
    process.exitCode = 1
  })
  .finally(async () => {
    await client.end({ timeout: 5 })
  })
