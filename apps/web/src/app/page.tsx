"use client"
import { appName } from '@sportsfest/shared'
import { webEnv } from '../env'
import { useEffect, useState } from 'react'
import { api } from 'src/lib/api/client'


export default function HomePage() {
  const [health, setHealth] = useState("")
  useEffect(()=>{
    (async ()=>{
      const data = (await (await api.health.$get()).json()).status
      setHealth(data)
    })()
  },[])
  return (
    <main style={{ padding: 24 }}>
      <h1>{appName}</h1>
      <p>Next.js / Hono / PostgreSQL / Drizzle のモノレポひな型です。</p>
      <p>API: {webEnv.NEXT_PUBLIC_API_BASE_URL}</p>
      <p>API.health: {health}</p>
    </main>
  )
}
