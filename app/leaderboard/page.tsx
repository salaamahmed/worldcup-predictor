'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = {
  user_id: string
  username: string | null
  total_points: number
  exact_scores: number
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
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

  return (
    <div className="max-w-xl mx-auto p-4">

      <h1 className="text-2xl font-bold mb-6">Leaderboard 🏆</h1>

      {loading ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
        <p>No data yet</p>
      ) : (
        rows.map((r, i) => (
          <div
            key={r.user_id}
            className="bg-white p-4 rounded shadow mb-3 flex justify-between"
          >
            <div>
              <div className="font-bold">
                #{i + 1} {r.username ?? 'Unknown'}
              </div>
              <div className="text-sm text-gray-500">
                Exact scores: {r.exact_scores}
              </div>
            </div>

            <div className="text-lg font-bold">
              {r.total_points} pts
            </div>
          </div>
        ))
      )}
    </div>
  )
}