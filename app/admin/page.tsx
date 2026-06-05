'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Match = {
  id: string
  match_number: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: string | null
  group_name?: string | null
}

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [toast, setToast] = useState('')

  const [scores, setScores] = useState<
    Record<string, { home: string; away: string }>
  >({})

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        window.location.href = '/login'
        return
      }

      // 🔒 ADMIN CHECK
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userData.user.id)
        .single()

      if (!profile?.is_admin) {
        window.location.href = '/'
        return
      }

      setIsAdmin(true)

      // 📥 LOAD MATCHES
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_number', { ascending: true })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setMatches(data || [])

      const initialScores: Record<string, { home: string; away: string }> = {}
      data?.forEach((m) => {
        initialScores[m.id] = {
          home: m.home_score?.toString() || '',
          away: m.away_score?.toString() || '',
        }
      })

      setScores(initialScores)
      setLoading(false)
    }

    init()
  }, [])

  function handleChange(id: string, type: 'home' | 'away', value: string) {
    setScores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [type]: value,
      },
    }))
  }

  async function saveMatch(match: Match) {
    const home = Number(scores[match.id]?.home)
    const away = Number(scores[match.id]?.away)

    if (isNaN(home) || isNaN(away)) {
      setToast('Invalid scores ❌')
      return
    }

    const { data, error } = await supabase
      .from('matches')
      .update({
        home_score: home,
        away_score: away,
        status: 'finished',
      })
      .eq('id', match.id)
      .select()

    // 🔥 CRITICAL FIX
    if (error || !data || data.length === 0) {
      setToast('Not authorized ❌')
      return
    }

    setToast('Saved ✅')

    setMatches((prev) =>
      prev.map((m) =>
        m.id === match.id
          ? { ...m, home_score: home, away_score: away, status: 'finished' }
          : m
      )
    )

    setTimeout(() => setToast(''), 2000)
  }

  if (loading) return null
  if (!isAdmin) return null

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">

      <h1 className="text-xl font-bold text-gray-900 text-center">
        Admin Panel ⚙️
      </h1>

      <div className="space-y-3">

        {matches.map((m) => (
          <div
            key={m.id}
            className="bg-white p-4 rounded-xl border shadow-sm"
          >
            {/* TEAMS */}
            <div className="flex justify-between font-bold text-gray-900 text-sm">
              <span>{m.home_team}</span>
              <span>{m.away_team}</span>
            </div>

            {/* INFO */}
            <div className="text-xs text-gray-500 mb-2">
              Match {m.match_number} {m.group_name && `• ${m.group_name}`}
            </div>

            {/* INPUTS */}
            <div className="flex items-center gap-2">

              <input
                type="number"
                value={scores[m.id]?.home || ''}
                onChange={(e) =>
                  handleChange(m.id, 'home', e.target.value)
                }
                className="w-14 h-10 border rounded-lg text-center"
              />

              <span className="font-bold">-</span>

              <input
                type="number"
                value={scores[m.id]?.away || ''}
                onChange={(e) =>
                  handleChange(m.id, 'away', e.target.value)
                }
                className="w-14 h-10 border rounded-lg text-center"
              />

              <button
                onClick={() => saveMatch(m)}
                className="ml-3 bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm active:scale-95"
              >
                Save
              </button>

              {m.status === 'finished' && (
                <span className="ml-2 text-green-600 text-xs font-semibold">
                  ✔
                </span>
              )}
            </div>
          </div>
        ))}

      </div>

      {/* 🔥 TOAST */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm shadow">
          {toast}
        </div>
      )}

    </div>
  )
}