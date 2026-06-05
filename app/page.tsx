'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import MatchCard from '@/components/MatchCard'
import Image from 'next/image'

type Match = {
  id: string
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
}

type Prediction = {
  match_id: string
  predicted_home: number
  predicted_away: number
  user_id: string
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // 🔥 SINGLE CLEAN LOAD (removed duplicate useEffect)
  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id || null
      setUserId(uid)

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('kickoff_time')

      setMatches(matchesData || [])

      if (uid) {
        const { data: preds } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', uid)

        setPredictions(preds || [])
      }

      await supabase.rpc('update_match_status')
    }

    load()
  }, [])

  return (
    <div className="max-w-6xl mx-auto py-4">

      {/* 🔥 HEADER (MOBILE OPTIMIZED) */}
      <div className="mb-4 flex items-center justify-center gap-2">

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Matches
        </h1>

        <Image
          src="/ball.png"
          alt="Match Ball"
          width={22}
          height={22}
          className="drop-shadow animate-pulse"
        />
      </div>

      {/* 🔥 GRID (MOBILE-FIRST) */}
      <div className="
        grid 
        grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-3 
        gap-3 sm:gap-4
      ">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictions.find(
              (p) => p.match_id === match.id && p.user_id === userId
            )}
          />
        ))}
      </div>

      {/* 🔥 FLOATING ACTION BUTTON */}
      <button
        onClick={() =>
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        className="
          fixed bottom-20 right-4
          bg-blue-600 text-white
          w-12 h-12 rounded-full
          flex items-center justify-center
          text-xl
          shadow-lg
          active:scale-95 transition
        "
      >
        ↑
      </button>

    </div>
  )
}