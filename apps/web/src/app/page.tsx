import { appName } from '@sportsfest/shared'

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>{appName}</h1>
      <p>Next.js / Hono / PostgreSQL / Drizzle のモノレポひな型です。</p>
    </main>
  )
}
