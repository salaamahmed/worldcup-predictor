'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const login = async () => {
    if (!identifier || !password) {
      alert('Fill all fields')
      return
    }

    setLoading(true)

    let emailToUse = identifier

    // username → email
    if (!identifier.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .maybeSingle()

      if (!profile) {
        alert('User not found')
        setLoading(false)
        return
      }

      emailToUse = profile.email
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">

      {/* 🔥 CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-5">

        {/* 🔥 HEADER / BRAND */}
        <div className="flex flex-col items-center gap-2">

          <Image
            src="/FIFA26.png"
            alt="World Cup"
            width={40}
            height={40}
          />

          <h1 className="text-xl font-semibold">
            FIFA WC 2026
          </h1>

          <p className="text-sm text-gray-500">
            Sign in to continue
          </p>
        </div>

        {/* 🔥 INPUTS */}
        <div className="space-y-3">

          <input
            className="
              w-full h-12 px-3
              border rounded-lg
              text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            placeholder="Email or Username"
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <input
            type="password"
            className="
              w-full h-12 px-3
              border rounded-lg
              text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* 🔥 LOGIN BUTTON */}
        <button
          onClick={login}
          disabled={loading}
          className="
            w-full h-12
            bg-blue-600 text-white
            rounded-lg font-medium
            active:scale-95 transition
            disabled:opacity-60
          "
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>

        {/* 🔥 LINKS */}
        <div className="text-sm text-center space-y-2">

          <p>
            Don’t have an account?{' '}
            <Link href="/register" className="text-blue-600 font-medium">
              Register
            </Link>
          </p>

          <Link
            href="/forgot-password"
            className="text-blue-600 block"
          >
            Forgot Password?
          </Link>

        </div>

      </div>
    </div>
  )
}