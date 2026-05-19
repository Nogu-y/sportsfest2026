import { LoginPage } from '../../../components/auth/LoginPage'

type LoginPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[]
  }>
}

export default async function Page({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : null

  return <LoginPage initialReturnTo={returnTo} />
}
