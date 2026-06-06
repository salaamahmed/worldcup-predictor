'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = {
  user_id: string
  username: string | null
  total_points: number
  exact_scores: number
  last_rank: number | null
  rank: number
}

type League = {
  league_id: string
  league_name: string
}

type LeagueRow = {
  id: string
  name: string
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeague, setSelectedLeague] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  async function loadLeaderboard(leagueId: string) {
    if (!leagueId) return

    const { data, error } = await supabase
      .from('leaderboard_by_league')
      .select('*')
      .eq('league_id', leagueId)

    if (error) {
      console.error(error)
      setRows([])
      return
    }

    setRows((data as Row[]) || [])
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id || null
      setUserId(uid)

      if (!uid) {
        setLoading(false)
        return
      }

      const { data: memberData } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', uid)

      const leagueIds = memberData?.map((m) => m.league_id) || []

      if (leagueIds.length === 0) {
        setLoading(false)
        return
      }

      const leaguesData: LeagueRow[] = []

      for (const id of leagueIds) {
        const { data, error } = await supabase
          .from('leagues')
          .select('id, name')
          .eq('id', id)
          .single()

        if (!error && data) {
          leaguesData.push(data)
        }
      }

      const formatted: League[] = leaguesData.map((l) => ({
        league_id: l.id,
        league_name: l.name,
      }))

      setLeagues(formatted)

      if (formatted.length > 0) {
        const firstLeague = formatted[0].league_id
        setSelectedLeague(firstLeague)
        await loadLeaderboard(firstLeague)
      }

      setLoading(false)
    }

    init()
  }, [])

  async function handleLeagueChange(leagueId: string) {
    if (!leagueId) return

    setSelectedLeague(leagueId)
    setLoading(true)

    await loadLeaderboard(leagueId)

    setLoading(false)
  }

  function getMedal(i: number) {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `#${i + 1}`
  }

  return (
    <div className="max-w-md mx-auto px-3 py-4">

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center">
        Leaderboard 🏆
      </h1>

      {leagues.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedLeague}
            onChange={(e) => handleLeagueChange(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          >
            {leagues.map((l) => (
              <option key={l.league_id} value={l.league_id}>
                {l.league_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-500">No data yet</p>
      ) : (
        <div className="space-y-2">

          {rows.map((r, i) => {
            const isTop3 = i < 3
            const isMe = r.user_id === userId

            // ✅ FIXED MOVEMENT LOGIC
            const movementData = (() => {
              if (r.last_rank == null || r.rank == null) {
                return { text: '—', color: 'text-gray-400' }
              }

              if (r.rank < r.last_rank) {
                return {
                  text: `↑ ${r.last_rank - r.rank}`,
                  color: 'text-green-600',
                }
              }

              if (r.rank > r.last_rank) {
                return {
                  text: `↓ ${r.rank - r.last_rank}`,
                  color: 'text-red-600',
                }
              }

              return { text: '—', color: 'text-gray-400' }
            })()

            return (
              <div
                key={r.user_id}
                className={`
                  flex items-center justify-between
                  p-3 rounded-xl border
                  bg-white shadow-sm text-sm
                  transition
                  ${isTop3 ? 'bg-yellow-50 border-yellow-300' : ''}
                  ${isMe ? 'ring-2 ring-blue-500' : ''}
                `}
              >

                <div className="flex items-center gap-3">
                  <div className="text-base font-bold w-6 text-center">
                    {getMedal(i)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                      {r.username}
                      <span className={`text-xs ${movementData.color}`}>
                        {movementData.text}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-500">
                      {r.exact_scores} exact
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-base text-gray-900">
                    {r.total_points}
                  </div>
                  <div className="text-xs text-gray-600">
                    pts
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}