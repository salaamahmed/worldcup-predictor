'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = {
  user_id: string
  username: string | null
  total_points: number
  exact_scores: number
  last_rank: number | null
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      setUserId(userData.user?.id || null)

      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')

      if (error) {
        console.error(error)
        return
      }

      setRows(data || [])
      setLoading(false)
    }

    load()
  }, [])

  function getMedal(i: number) {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `#${i + 1}`
  }

  return (
    <div className="max-w-md mx-auto px-3 py-4">

      {/* 🔥 HEADER */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
        Leaderboard 🏆
      </h1>

      {/* 🔥 CONTENT */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-500">No data yet</p>
      ) : (
        <div className="space-y-2">

          {rows.map((r, i) => {
            const isTop3 = i < 3
            const isMe = r.user_id === userId

            const movement =
              r.last_rank === null
                ? ''
                : i + 1 < r.last_rank
                ? '↑'
                : i + 1 > r.last_rank
                ? '↓'
                : ''

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

                {/* LEFT */}
                <div className="flex items-center gap-3">

                  {/* RANK */}
                  <div className="text-base font-bold w-6 text-center">
                    {getMedal(i)}
                  </div>

                  {/* USER */}
                  <div>
                    <div className="flex items-center gap-1 font-semibold text-sm text-gray-900">
                      {r.username}
                      {movement && (
                        <span
                          className={`text-xs ${
                            movement === '↑' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {movement}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-500">
                      {r.exact_scores} exact
                    </div>
                  </div>
                </div>

                {/* RIGHT (POINTS) */}
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