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

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-5">

        {/* HEADER */}
        <div className="flex flex-col items-center gap-2">

          <Image
            src="/FIFA26.png"
            alt="World Cup"
            width={40}
            height={40}
          />

          <h1 className="text-xl sm:text-lg font-semibold text-gray-900">
            FIFA WC 2026
          </h1>

          <p className="text-sm text-gray-600">
            Sign in to continue
          </p>
        </div>

        {/* INPUTS */}
        <div className="space-y-3">

          <input
            className="
              w-full h-12 px-3
              border border-gray-300
              rounded-lg
              text-base text-gray-900
              placeholder:text-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            placeholder="Email or Username"
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <input
            type="password"
            className="
              w-full h-12 px-3
              border border-gray-300
              rounded-lg
              text-base text-gray-900
              placeholder:text-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={login}
          disabled={loading}
          className="
            w-full h-12
            bg-blue-600 text-white
            rounded-lg font-medium text-base
            active:scale-95 transition
            disabled:opacity-60
          "
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>

        {/* LINKS */}
        <div className="text-sm text-center space-y-2 text-gray-700">

          <p>
            Don’t have an account?{' '}
            <Link href="/register" className="text-blue-600 font-semibold">
              Register
            </Link>
          </p>

          <Link
            href="/forgot-password"
            className="text-blue-600 block font-medium"
          >
            Forgot Password?
          </Link>

        </div>

      </div>
    </div>
  )
}