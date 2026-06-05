'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  const register = async () => {
    if (!username || !email || !password || !confirmPassword) {
      alert('Fill all fields')
      return
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    // 🔍 Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      alert('Username already taken')
      return
    }

    // 🔐 Create user (✅ FIX: include username in metadata)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user
    if (!user) return

    // ❌ REMOVED: retry/update logic (no longer needed)

    alert('Account created!')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h1 className="text-xl font-bold mb-4 text-center">Register</h1>

        <input
          className="w-full p-2 border rounded mb-3"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="w-full p-2 border rounded mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 border rounded mb-3"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={register}
          className="w-full bg-green-600 text-white py-2 rounded mb-3 hover:bg-green-700"
        >
          Register
        </button>

        <p className="text-sm text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}