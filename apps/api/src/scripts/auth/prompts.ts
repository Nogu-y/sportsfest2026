import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import type { AuthAccountRole } from '../../repositories/auth/accountAdmin'

const createReadline = () =>
  createInterface({
    input,
    output
  })

// 通常入力用。loginId や displayName などを受け取る。
export const ask = async (label: string) => {
  const rl = createReadline()

  try {
    return (await rl.question(`${label}: `)).trim()
  } finally {
    rl.close()
  }
}

export const confirm = async (message: string) => {
  const answer = (await ask(`${message} [y/N]`)).toLowerCase()
  return answer === 'y' || answer === 'yes'
}

// パスワードを画面に出さずに受け取る。
export const askHidden = async (label: string) => {
  if (!input.isTTY || !output.isTTY) {
    throw new Error('パスワード入力には TTY が必要です')
  }

  return await new Promise<string>((resolve, reject) => {
    const previousRawMode = input.isRaw
    let value = ''

    const cleanup = () => {
      input.setRawMode(previousRawMode ?? false)
      input.pause()
      input.removeListener('data', onData)
      output.write('\n')
    }

    const onData = (chunk: Buffer) => {
      const key = chunk.toString('utf8')

      if (key === '\u0003') {
        cleanup()
        reject(new Error('キャンセルしました'))
        return
      }

      if (key === '\r' || key === '\n') {
        cleanup()
        resolve(value.trim())
        return
      }

      if (key === '\u007f') {
        if (value.length > 0) {
          value = value.slice(0, -1)
        }
        return
      }

      if (key >= ' ' && key !== '\u001b') {
        value += key
      }
    }

    output.write(`${label}: `)
    input.resume()
    input.setRawMode(true)
    input.on('data', onData)
  })
}

// 入力ミス防止のため、パスワードは常に再入力確認を行う。
export const askPasswordWithConfirmation = async () => {
  const password = await askHidden('password')
  const confirmation = await askHidden('confirm password')

  if (password !== confirmation) {
    throw new Error('パスワードが一致しません')
  }

  return password
}

// role は自由入力にせず、ADMIN/STAFF のみ受け付ける。
export const askRole = async (defaultRole: AuthAccountRole = 'STAFF') => {
  while (true) {
    const answer = (await ask(`role (ADMIN/STAFF) [${defaultRole}]`)).toUpperCase()

    if (answer === '') {
      return defaultRole
    }

    if (answer === 'ADMIN' || answer === 'STAFF') {
      return answer
    }

    output.write('role は ADMIN または STAFF を指定してください\n')
  }
}
