'use client'

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
    <div className="
      sticky top-0 z-50
      bg-white border-b
      px-3 py-2
      flex items-center justify-between
    ">

      {/* LEFT: LOGO + TITLE */}
      <div className="flex items-center gap-2">
        <Image
          src="/FIFA26.png"
          alt="World Cup"
          width={24}
          height={24}
        />
        <span className="font-bold text-base sm:text-lg text-gray-900">
          FIFA WC 2026
        </span>
      </div>

      {/* RIGHT: USER + LOGOUT */}
      <div className="flex items-center gap-2">

        {/* Username (truncate to avoid overflow) */}
        <span className="text-sm font-medium text-gray-800 max-w-[100px] truncate">
          👤 {username}
        </span>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="
            text-sm font-medium
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