'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import MatchCard from '@/components/MatchCard'
import Image from 'next/image'

type Match = {
  id: string
  match_number: number
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
  home_score?: number | null
  away_score?: number | null
  group_name?: string | null
}

type Prediction = {
  match_id: string
  predicted_home: number
  predicted_away: number
  user_id: string
  points?: number
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // ✅ NEW
  const [showUnfinished, setShowUnfinished] = useState(false)

  // 🔥 INITIAL LOAD
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

  // 🔥 REALTIME UPDATES
  useEffect(() => {
    const channel = supabase
      .channel('matches-realtime')

      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const updatedMatch = payload.new as Match
          if (!updatedMatch) return

          setMatches((prev) =>
            prev.map((m) =>
              m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
            )
          )
        }
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
        },
        (payload) => {
          const newPrediction = payload.new as Prediction
          if (!newPrediction) return

          setPredictions((prev) => {
            const updated = [...prev]

            const index = updated.findIndex(
              (p) =>
                p.match_id === newPrediction.match_id &&
                p.user_id === newPrediction.user_id
            )

            if (index !== -1) {
              updated[index] = newPrediction
            } else {
              updated.push(newPrediction)
            }

            return updated
          })
        }
      )

      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ✅ NEW FILTER
  const filteredMatches = showUnfinished
    ? matches.filter((m) => m.status !== 'finished')
    : matches

  return (
    <div className="max-w-6xl mx-auto py-4">

      {/* 🔥 HEADER */}
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

      {/* ✅ TOGGLE (NEW) */}
      <div className="mb-4 flex items-center justify-center gap-2 text-sm">
        <span className="text-xs font-semibold">
            Hide Completed Matches
        </span>

        <button
          onClick={() => setShowUnfinished((prev) => !prev)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            showUnfinished
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {showUnfinished ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* 🔥 GRID */}
      <div className="
        grid 
        grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-3 
        gap-3 sm:gap-4
      ">
        {filteredMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictions.find(
              (p) => p.match_id === match.id && p.user_id === userId
            )}
          />
        ))}
      </div>

      {/* 🔥 FLOATING BUTTON */}
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