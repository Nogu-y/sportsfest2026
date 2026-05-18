import { stderr, stdout } from 'node:process'
import { client } from '../../db/client'
import {
  createAuthAccount,
  findAuthAccountByLoginId,
  type AuthAccountRole
} from '../../repositories/auth/accountAdmin'
import { ask, askPasswordWithConfirmation, askRole } from './prompts'

const PASSWORD_MIN_LENGTH = 12
const passwordPolicyPattern =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/

const printError = (message: string) => {
  stdout.write(`error: ${message}\n`)
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

const ensurePasswordPolicy = (password: string) => {
  if (!passwordPolicyPattern.test(password)) {
    throw new Error(
      `パスワードは ${PASSWORD_MIN_LENGTH} 文字以上で、英字・数字・記号を含めてください`
    )
  }
}

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

const resolveRole = (value?: string): AuthAccountRole | null => {
  if (!value) {
    return null
  }

  const normalized = value.toUpperCase()
  if (normalized === 'ADMIN' || normalized === 'STAFF') {
    return normalized
  }

  return null
}

const run = async () => {
  const argLoginId = process.argv[2]
  const argDisplayName = process.argv[3]
  const argRole = resolveRole(process.argv[4])

  const loginId = argLoginId ?? await askRequired('loginId')
  const displayName = argDisplayName ?? await askRequired('displayName')
  const role = argRole ?? await askRole('STAFF')

  const existing = await findAuthAccountByLoginId(loginId)
  if (existing) {
    throw new Error(`loginId=${loginId} はすでに使用されています`)
  }

  const password = await askValidPassword()
  const created = await createAuthAccount({
    loginId,
    displayName,
    role,
    password
  })

  stdout.write('ユーザーを作成しました\n')
  stdout.write(
    `loginId=${created.loginId} displayName=${created.displayName} role=${created.role} active=${created.isActive}\n`
  )
}

run()
  .catch((error) => {
    stderr.write(`${error instanceof Error ? error.message : '不明なエラーが発生しました'}\n`)
    process.exitCode = 1
  })
  .finally(async () => {
    await client.end({ timeout: 5 })
  })
