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

    const { data } = await supabase
      .from('leaderboard_by_league')
      .select('*')
      .eq('league_id', leagueId)

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
        const { data } = await supabase
          .from('leagues')
          .select('id, name')
          .eq('id', id)
          .single()

        if (data) leaguesData.push(data)
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
    <div className="max-w-md mx-auto px-4 py-4">

      {/* HEADER */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
        Leaderboard 🏆
      </h1>

      {/* LEAGUE SELECT */}
      {leagues.length > 0 && (
        <div className="relative mb-4">

        <select
          value={selectedLeague}
          onChange={(e) => handleLeagueChange(e.target.value)}
          className="
            w-full h-12 px-4 pr-10
            rounded-xl
            text-sm sm:text-base text-gray-900
            bg-gray-50
            border border-gray-200
            shadow-sm

            appearance-none
            cursor-pointer

            focus:outline-none
            focus:ring-2 focus:ring-blue-500
            focus:border-blue-500
            focus:bg-white

            transition
          "
        >
          {leagues.map((l) => (
            <option key={l.league_id} value={l.league_id}>
              {l.league_name}
            </option>
          ))}
        </select>

        {/* Custom Arrow */}
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
          ▼
        </div>

      </div>
      )}

      {/* STATES */}
      {loading ? (
        <p className="text-center text-gray-500 text-sm">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-500 text-sm">No data yet</p>
      ) : (
        <div className="space-y-3">

          {rows.map((r, i) => {
            const isTop3 = i < 3
            const isMe = r.user_id === userId

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
                  p-3 sm:p-4
                  rounded-xl border border-gray-200
                  bg-white shadow-sm
                  transition
                  ${isTop3 ? 'bg-yellow-50 border-yellow-300' : ''}
                  ${isMe ? 'ring-2 ring-blue-500' : ''}
                `}
              >

                {/* LEFT */}
                <div className="flex items-center gap-3">

                  <div className="text-base sm:text-lg font-bold w-6 text-center text-gray-900">
                    {getMedal(i)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-semibold text-sm sm:text-base text-gray-900">
                      {r.username}
                      <span className={`text-xs ${movementData.color}`}>
                        {movementData.text}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600">
                      {r.exact_scores} exact
                    </div>
                  </div>

                </div>

                {/* RIGHT */}
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900">
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