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
  home_score?: number | null
  away_score?: number | null
  match_number: number
  group_name?: string | null
  
  resolved_home_team?: string
  resolved_away_team?: string
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

  const [showUnfinished, setShowUnfinished] = useState(false)
  const [hidePredicted, setHidePredicted] = useState(false)
  const [activeTab, setActiveTab] = useState<'group' | 'knockout'>('group')

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id || null
      setUserId(uid)

      const { data: matchesData } = await supabase
        .from('resolved_matches')
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

  // GROUP STAGE
  const groupStageMatches = matches.filter((m) =>
    m.group_name?.startsWith('Group')
  )

  // KNOCKOUT
  const knockoutMatches = matches.filter(
    (m) =>
      m.group_name === 'Round of 16' ||
      m.group_name === 'Quarter Final' ||
      m.group_name === 'Semi Final' ||
      m.group_name === 'Final' ||
      m.group_name === 'Third Place'
  )

  const knockoutRounds = [
    'Round of 16',
    'Quarter Final',
    'Semi Final',
    'Third Place',
    'Final'
  ]

  const groupedKnockout = knockoutRounds.map((round) => ({
    round,
    matches: knockoutMatches
      .filter((m) => m.group_name === round)
      .sort((a, b) => a.match_number - b.match_number),
  }))

  const filteredGroupMatches = groupStageMatches
    .filter((m) => (showUnfinished ? m.status !== 'finished' : true))
    .filter((m) =>
      hidePredicted
        ? !predictions.some(
            (p) => p.match_id === m.id && p.user_id === userId
          )
        : true
    )

  return (
    <div className="max-w-6xl mx-auto py-4">

      {/* HEADER */}
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

      {/* TABS */}
      <div className="flex justify-center mb-4 gap-2">
        <button
          onClick={() => setActiveTab('group')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'group'
              ? 'bg-blue-800 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Group Stage
        </button>

        <button
          onClick={() => setActiveTab('knockout')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'knockout'
              ? 'bg-blue-800 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Knockout Stage
        </button>
      </div>

      {/* TOGGLE */}
      {activeTab === 'group' && (
        <div className="mb-4 flex items-center justify-center gap-4 text-sm">

          {/* Existing toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">
              Hide Completed Matches
            </span>

            <button
              onClick={() => setShowUnfinished((prev) => !prev)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                showUnfinished
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {showUnfinished ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* NEW toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">
              Hide Predicted Matches
            </span>

            <button
              onClick={() => setHidePredicted((prev) => !prev)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                hidePredicted
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {hidePredicted ? 'ON' : 'OFF'}
            </button>
          </div>

        </div>

      )}

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

        {activeTab === 'group' ? (

          filteredGroupMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={{
                ...match,
                home_team:
                  match.resolved_home_team || match.home_team,
                away_team:
                  match.resolved_away_team || match.away_team,
              }}
              prediction={predictions.find(
                (p) => p.match_id === match.id && p.user_id === userId
              )}
            />
          ))

        ) : (

          groupedKnockout.map((section) =>
            section.matches.length > 0 && (
              <div key={section.round} className="col-span-full mt-6">

                <h2 className="text-sm font-bold text-gray-700 mb-2 text-center">
                  {section.round}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {section.matches.filter((m) =>
                      hidePredicted
                        ? !predictions.some(
                            (p) => p.match_id === m.id && p.user_id === userId
                          )
                        : true
                    )
                    .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={{
                        ...match,
                        home_team:
                          match.resolved_home_team || match.home_team,
                        away_team:
                          match.resolved_away_team || match.away_team,
                      }}
                      prediction={predictions.find(
                        (p) => p.match_id === match.id && p.user_id === userId
                      )}
                    />
                  ))}
                </div>

              </div>
            )
          )

        )}

      </div>

      {/* FLOAT BUTTON */}
      <button
        onClick={() =>
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        className="
          fixed bottom-20 right-4
          z-[999]
          bg-blue-800 text-white
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