'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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
    pathname === '/forgot-password' ||
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
  }, [pathname, router, isAuthPage])

  // 🔥 Better loading UX (prevents blank flash)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 🔝 TOP NAVBAR */}
      {!isAuthPage && user && <Navbar />}

      {/* 📄 PAGE CONTENT */}
      <main className="pb-20 px-3 sm:px-6">
        {children}
      </main>

      {/* 🔻 BOTTOM NAVIGATION (MOBILE APP FEEL) */}
      {!isAuthPage && user && (
        <BottomNav pathname={pathname} />
      )}
    </div>
  )
}






// 🔥 NEW COMPONENT: Bottom Navigation
function BottomNav({ pathname }: { pathname: string }) {

  const [username, setUsername] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, is_admin')
        .eq('id', userData.user.id)
        .single()

      setUsername(profile?.username ?? 'User')
      setIsAdmin(profile?.is_admin ?? false)
    }

    loadUser()
  }, [])
  
  return (
    <div className="
      fixed bottom-0 left-0 right-0
      bg-white border-t
      flex justify-around items-center
      py-2 z-50
    ">

      {/* HOME */}
      <Link
        href="/"
        className={`flex flex-col items-center text-xs ${
          pathname === '/'
            ? 'text-blue-600 font-semibold'
            : 'text-gray-500'
        }`}
      >
        <span className="text-lg">🏠</span>
        Home
      </Link>

      {/* LEADERBOARD */}
      <Link
        href="/leaderboard"
        className={`flex flex-col items-center text-xs ${
          pathname === '/leaderboard'
            ? 'text-blue-600 font-semibold'
            : 'text-gray-500'
        }`}
      >
        <span className="text-lg">🏆</span>
        Leaderboard
      </Link>

      {/* ADMIN */}
      {isAdmin && (
          <Link
            href="/admin"
            className={`flex flex-col items-center text-xs ${
              pathname === '/admin'
                ? 'text-blue-600 font-semibold'
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg">⚙️</span>
            Admin
          </Link>
         )}
      

    </div>
  )
}