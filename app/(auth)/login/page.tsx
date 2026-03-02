import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In',
}

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return <LoginForm />
}
