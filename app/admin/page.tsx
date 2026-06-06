'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import LeagueManagement from '@/components/admin/LeagueManagement' // ✅ NEW

type Match = {
  id: string
  match_number: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: string | null
  kickoff_time: string
  group_name?: string | null
}

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<
    Record<string, { home: string; away: string }>
  >({})
  const [activeTab, setActiveTab] = useState<'matches' | 'leagues'>('matches') // ✅ NEW

  const router = useRouter()

  // ✅ LOAD MATCHES
  async function loadMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true })

    if (error) {
      console.error('LOAD ERROR:', error)
      return
    }

    setMatches(data || [])

    const initial: Record<string, { home: string; away: string }> = {}
    data?.forEach((m) => {
      initial[m.id] = {
        home: m.home_score?.toString() || '',
        away: m.away_score?.toString() || '',
      }
    })

    setScores(initial)
    setLoading(false)
  }

  // 🔐 AUTH + ADMIN CHECK
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/')
        return
      }

      await loadMatches()
    }

    init()
  }, [router])

  function handleChange(id: string, type: 'home' | 'away', value: string) {
    setScores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [type]: value,
      },
    }))
  }

  // ✅ SAVE MATCH
  async function saveMatch(m: Match) {
    if (!m.id) {
      alert('Missing match ID')
      return
    }

    const home = parseInt(scores[m.id]?.home || '0', 10)
    const away = parseInt(scores[m.id]?.away || '0', 10)

    if (isNaN(home) || isNaN(away)) {
      alert('Enter valid scores')
      return
    }

    const { data, error } = await supabase
      .from('matches')
      .update({
        home_score: home,
        away_score: away,
        status: 'finished',
      })
      .eq('id', m.id)
      .select()

    if (error || !data || data.length === 0) {
      console.error('SAVE ERROR:', error)
      alert('Not authorized')
      return
    }

    alert('Saved')

    // ✅ instant UI update
    setMatches((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              home_score: home,
              away_score: away,
              status: 'finished',
            }
          : x
      )
    )
  }

  if (loading) return null

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Admin Panel ⚙️
        </h1>
        <span className="text-sm text-gray-500">
          Manage system
        </span>
      </div>

      {/* ✅ TAB SWITCHER (NEW) */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'matches'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          Match Management
        </button>

        <button
          onClick={() => setActiveTab('leagues')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'leagues'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          League Management
        </button>
      </div>

      {/* ✅ MATCHES TAB (UNCHANGED UI) */}
      {activeTab === 'matches' && (
        <>
          {matches.length === 0 ? (
            <p>Loading matches...</p>
          ) : (
            <div className="space-y-5">

              {matches.map((m) => {
                const date = new Date(m.kickoff_time)

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition"
                  >

                    {/* TOP */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-500">
                        Match {m.match_number}
                        {m.group_name && ` • ${m.group_name}`}
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          m.status === 'finished'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    {/* TIME */}
                    <div className="text-xs text-gray-400 mb-4">
                      {date.toLocaleDateString()} •{' '}
                      {date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>

                    {/* TEAMS */}
                    <div className="flex justify-between font-bold text-lg text-gray-900 mb-3">

                      <span className="w-1/3 font-semibold">
                        {m.home_team}
                      </span>

                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={scores[m.id]?.home || ''}
                          onChange={(e) =>
                            handleChange(m.id, 'home', e.target.value)
                          }
                          className="w-14 border rounded text-center p-1"
                        />

                        <span className="font-bold">-</span>

                        <input
                          type="number"
                          value={scores[m.id]?.away || ''}
                          onChange={(e) =>
                            handleChange(m.id, 'away', e.target.value)
                          }
                          className="w-14 border rounded text-center p-1"
                        />
                      </div>

                      <span className="w-1/3 text-right font-semibold">
                        {m.away_team}
                      </span>
                    </div>

                    {/* FINAL SCORE */}
                    {m.status === 'finished' && (
                      <div className="text-center text-sm text-green-600 font-semibold mb-3">
                        Final Score: {m.home_score} - {m.away_score}
                      </div>
                    )}

                    {/* ACTION */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => saveMatch(m)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Save Result
                      </button>
                    </div>

                  </div>
                )
              })}

            </div>
          )}
        </>
      )}

      {/* ✅ LEAGUES TAB (NEW) */}
      {activeTab === 'leagues' && (
        <LeagueManagement />
      )}
    </div>
  )
}