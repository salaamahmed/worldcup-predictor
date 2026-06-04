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
        <span className="font-semibold text-sm sm:text-base">
          FIFA WC 2026
        </span>
      </div>

      {/* RIGHT: USER + LOGOUT */}
      <div className="flex items-center gap-2">

        {/* Username (truncate to avoid overflow) */}
        <span className="text-xs sm:text-sm text-gray-600 max-w-[80px] truncate">
          👤 {username}
        </span>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="
            text-xs sm:text-sm
            text-red-500
            px-2 py-1 rounded
            active:scale-95 transition
          "
        >
          Logout
        </button>

      </div>
    </div>
  )
}