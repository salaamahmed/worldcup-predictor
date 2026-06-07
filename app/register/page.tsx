'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      alert('Username already taken')
      return
    }

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

    alert('Account created!')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">

      {/* CARD */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-5">

        {/* HEADER / BRAND */}
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
            Create your account
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
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="
              w-full h-12 px-3
              border border-gray-300
              rounded-lg
              text-base text-gray-900
              placeholder:text-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
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
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={register}
          className="
            w-full h-12
            bg-green-800 text-white
            rounded-lg font-medium text-base
            active:scale-95 transition
            hover:bg-green-700
          "
        >
          Register
        </button>

        {/* LINKS */}
        <div className="text-sm text-center space-y-2 text-gray-700">

          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-800 font-semibold">
              Login
            </Link>
          </p>

        </div>

      </div>
    </div>
  )
}