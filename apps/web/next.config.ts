import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.join(currentDir, '../..')

const nextConfig: NextConfig = {
  transpilePackages: ['@sportsfest/shared'],
  turbopack: {
    root: workspaceRoot
  }
}

export default nextConfig
