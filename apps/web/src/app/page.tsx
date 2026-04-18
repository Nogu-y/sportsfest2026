import { appName } from '@sportsfest/shared'
import { webEnv } from '../env'

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>{appName}</h1>
      <p>Next.js / Hono / PostgreSQL / Drizzle のモノレポひな型です。</p>
      <p>API: {webEnv.NEXT_PUBLIC_API_BASE_URL}</p>
    </main>
  )
}
