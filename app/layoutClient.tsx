'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabaseClient'

type User = {
  id: string
} | null

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User>(null)

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/reset-password'

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser()

      setUser(data.user)

      if (!data.user && !isAuthPage) {
        router.push('/login')
      }

      setLoading(false)
    }

    checkUser()
  }, [pathname, router, isAuthPage]) // ✅ FIXED dependencies

  if (loading) return null

  return (
    <>
      {!isAuthPage && user && <Navbar />}
      {children}
    </>
  )
}