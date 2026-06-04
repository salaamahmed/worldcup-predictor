'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userData.user.id)
        .single()

      setUsername(profile?.username ?? 'User')
    }

    loadUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex justify-between items-center px-6 py-3 border-b bg-white">
      <div className="
        sticky top-0 z-50
        flex items-center justify-between
        px-3 py-2
        bg-white border-b
      ">
        <Image
          src="/FIFA26.png"
          alt="World Cup"
          width={28}
          height={28}
        />
        <span className="font-bold text-lg sm:text-xl">
          FIFA WC 2026
        </span>
      </div>

      <div className="
        sticky top-0 z-50
        flex items-center justify-between
        px-3 py-2
        bg-white border-b
      ">
        <Link href="/">Matches</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/admin">Admin</Link>

        <span className="text-sm text-gray-600">
          👤 {username}
        </span>

        <button
          onClick={handleLogout}
          className="text-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  )
}