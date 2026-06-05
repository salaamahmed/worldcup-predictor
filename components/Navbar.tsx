'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import Link from 'next/link'

export default function Navbar() {
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

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div
      className="
      sticky top-0 z-50
      bg-white border-b
      px-3 py-2
      flex items-center justify-between
    "
    >
      {/* LEFT: LOGO + TITLE */}
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/FIFA26.png"
          alt="World Cup"
          width={24}
          height={24}
        />
        <span className="font-bold text-base sm:text-lg text-gray-900">
          FIFA WC 2026
        </span>
      </Link>

      {/* CENTER: NAV LINKS (hidden on very small screens if needed) */}
      <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-800">
        <Link href="/">Matches</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        {isAdmin && <Link href="/admin">Admin</Link>}
      </div>

      {/* RIGHT: USER + LOGOUT */}
      <div className="flex items-center gap-2">

        {/* Username + Admin badge */}
        <div className="flex items-center gap-1 text-sm font-medium text-gray-900 max-w-[110px] truncate">
          <span className="truncate">👤 {username}</span>

          {isAdmin && (
            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-[1px] rounded">
              ADMIN
            </span>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="
            text-sm font-semibold
            text-red-600
            bg-red-50
            px-3 py-1.5 rounded-lg
            active:scale-95 transition
          "
        >
          Logout
        </button>

      </div>
    </div>
  )
}