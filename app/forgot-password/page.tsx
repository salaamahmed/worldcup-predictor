'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')

  const sendReset = async () => {
    if (!email) {
      alert('Enter your email')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for reset link')
    }
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

          <p className="text-sm text-gray-600 text-center">
            Reset your password
          </p>
        </div>

        {/* INPUT */}
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
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={sendReset}
          className="
            w-full h-12
            bg-blue-800 text-white
            rounded-lg font-medium text-base
            active:scale-95 transition
            hover:bg-blue-700
          "
        >
          Send Reset Link
        </button>

        {/* BACK TO LOGIN */}
        <div className="text-sm text-center text-gray-700">

          <Link
            href="/login"
            className="text-blue-800 font-semibold"
          >
            ← Back to Login
          </Link>

        </div>

      </div>
    </div>
  )
}