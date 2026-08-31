import type { Metadata } from 'next'

import { LoginClient } from './login-client'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to the Telford Canoe Club members area.',
}

export default function LoginPage() {
  return <LoginClient />
}
