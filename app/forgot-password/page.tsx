'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')

  const sendReset = async () => {
    if (!email) {
      alert('Enter your email')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password'
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for reset link')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-80">
        <h1 className="text-lg font-bold mb-4 text-center">
          Forgot Password
        </h1>

        <input
          className="w-full p-2 border rounded mb-3"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendReset}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Send Reset Link
        </button>
      </div>
    </div>
  )
}