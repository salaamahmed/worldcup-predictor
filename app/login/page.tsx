'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const login = async () => {
    if (!identifier || !password) {
      alert('Fill all fields')
      return
    }

    let emailToUse = identifier

    // 🔍 If username entered → convert to email
    if (!identifier.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .maybeSingle()

      if (!profile) {
        alert('User not found')
        return
      }

      emailToUse = profile.email
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h1 className="text-xl font-bold mb-4 text-center">Login</h1>

        <input
          className="w-full p-2 border rounded mb-3"
          placeholder="Email or Username"
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 text-white py-2 rounded mb-3 hover:bg-blue-700"
        >
          Login
        </button>

        <p className="text-sm text-center">
          Don’t have an account?{' '}
          <Link href="/register" className="text-blue-600">
            Register
          </Link>
        </p>

        <p className="text-sm text-center mt-2">
          <Link href="/forgot-password" className="text-blue-600">
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  )
}