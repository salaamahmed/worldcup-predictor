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

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('kickoff_time')

      setMatches(data || [])
    }

    load()
  }, [])

  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [userId, setUserId] = useState<string | null>(null)

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
    }

    load()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-1 whitespace-nowrap">
        <span>Matches</span>

        <Image
          src="/ball.png"
          alt="Match Ball"
          width={26}
          height={26}
          className="inline-block drop-shadow animate-pulse"
        />
      </h1>

      <div
        className="
        grid gap-5
        grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-3
      "
      >
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictions.find(p => p.match_id === match.id && p.user_id === userId)}
          />
        ))}
      </div>

    </div>
  )
}