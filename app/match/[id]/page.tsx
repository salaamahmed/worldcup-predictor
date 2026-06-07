'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import Image from 'next/image'

type Match = {
  id: string
  match_number: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: string | null
  kickoff_time: string
  resolved_home_team?: string
  resolved_away_team?: string
}

type Prediction = {
  id: string
  predicted_home: number
  predicted_away: number
  username: string | null
  points?: number
  user_id?: string
}

function getFlag(team: string) {
  const map: Record<string, string> = {
    Mexico: 'mx', Canada: 'ca', USA: 'us', Brazil: 'br', Argentina: 'ar',
    Uruguay: 'uy', Paraguay: 'py', Chile: 'cl', Colombia: 'co', Peru: 'pe',
    Haiti: 'ht', 'South Africa': 'za', Morocco: 'ma', Tunisia: 'tn',
    Senegal: 'sn', Ghana: 'gh', Nigeria: 'ng', 'Korea Republic': 'kr',
    Japan: 'jp', China: 'cn', Iran: 'ir', Qatar: 'qa', 'Saudi Arabia': 'sa',
    Australia: 'au', Czechia: 'cz', Germany: 'de', France: 'fr', Spain: 'es',
    Italy: 'it', Netherlands: 'nl', Belgium: 'be', Portugal: 'pt',
    Switzerland: 'ch', Croatia: 'hr', 'Bosnia and Herzegovina': 'ba',
    Scotland: 'gb-sct', Türkiye: 'tr', Curaçao: 'cw',
    "Côte d'Ivoire": 'ci', Ecuador: 'ec', Sweden: 'se', Egypt: 'eg',
    'Cabo Verde': 'cv', 'IR Iran': 'ir', 'New Zealand': 'nz',
    Iraq: 'iq', Norway: 'no', Algeria: 'dz', Austria: 'at',
    Jordan: 'jo', 'Congo DR': 'cg', England: 'gb-eng',
    Panama: 'pa', Uzbekistan: 'uz',
  }

  return `https://flagcdn.com/w40/${map[team] || 'un'}.png`
}

export default function MatchDetails() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [match, setMatch] = useState<Match | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [timeLeft, setTimeLeft] = useState('')

  // 🔥 INITIAL LOAD
  useEffect(() => {
    if (!id) return

    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData?.user?.id || null
      setUserId(uid)

      const { data: matchData } = await supabase
        .from('resolved_matches')
        .select('*')
        .eq('id', id)
        .single()

      setMatch(matchData)

      const { data: preds } = await supabase
        .from('predictions_with_users')
        .select('*')
        .eq('match_id', id)

      const sorted = (preds || []).sort(
        (a, b) => (b.points ?? 0) - (a.points ?? 0)
      )

      setPredictions(sorted)

      const myPred = sorted.find((p) => p.user_id === uid)
      if (myPred) {
        setHome(String(myPred.predicted_home))
        setAway(String(myPred.predicted_away))
      }
    }

    load()
  }, [id])

  // 🔥 REALTIME
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel('match-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${id}`,
        },
        async () => {
          const { data } = await supabase
            .from('resolved_matches')
            .select('*')
            .eq('id', id)
            .single()

          setMatch(data)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
          filter: `match_id=eq.${id}`,
        },
        async () => {
          const { data } = await supabase
            .from('predictions_with_users')
            .select('*')
            .eq('match_id', id)

          setPredictions(
            (data || []).sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  // 🔥 COUNTDOWN
  useEffect(() => {
    if (!match?.kickoff_time) return

    const interval = setInterval(() => {
      const diff = new Date(match.kickoff_time).getTime() - Date.now()

      if (diff <= 0) {
        setTimeLeft('🔒 Locked')
        clearInterval(interval)
        return
      }

      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff / (1000 * 60)) % 60)

      setTimeLeft(`${h}h ${m}m`)
    }, 1000)

    return () => clearInterval(interval)
  }, [match])

  const existing = predictions.find((p) => p.user_id === userId)

  // 🔥 LOCK LOGIC
  const isLocked =
    match
      ? new Date(match.kickoff_time) <= new Date() ||
        match.status === 'live' ||
        match.status === 'finished'
      : false

  async function handleSubmit() {
    if (!home || !away || !userId) return

    const { data: latestMatch } = await supabase
      .from('matches')
      .select('kickoff_time')
      .eq('id', id)
      .single()

    if (!latestMatch || new Date(latestMatch.kickoff_time) <= new Date()) {
      alert('Match is locked')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('predictions')
      .upsert(
        {
          match_id: id,
          user_id: userId,
          predicted_home: Number(home),
          predicted_away: Number(away),
        },
        { onConflict: 'user_id,match_id' }
      )

    if (error) {
      console.error(error)
      setSaving(false)
      return
    }

    // ✅ INSTANT UI UPDATE (NEW)
    setPredictions((prev) => {
      const updated = prev.filter((p) => p.user_id !== userId)

      return [
        {
          id: existing?.id || crypto.randomUUID(),
          user_id: userId,
          username:
            existing?.username ||
            predictions.find((p) => p.user_id === userId)?.username ||
            'You',
          predicted_home: Number(home),
          predicted_away: Number(away),
          points: existing?.points ?? 0,
        },
        ...updated,
      ]
    })

    setToast(existing ? 'Updated ✅' : 'Submitted ✅')
    setSaving(false)
    setTimeout(() => setToast(''), 2000)
  }

  const homeTeam = match?.resolved_home_team || match?.home_team
  const awayTeam = match?.resolved_away_team || match?.away_team

  return (
    <div className="max-w-md mx-auto px-3 py-4 space-y-4">

      {match && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">

            <div className="flex flex-col items-center w-1/3">
              <Image src={getFlag(homeTeam!)} alt="" width={40} height={40} className="rounded-full" />
              <span className="mt-1 text-sm font-semibold text-gray-900 text-center truncate">
                {homeTeam}
              </span>
            </div>

            <div className="text-center">
              {match.status === 'finished' ? (
                <div className="text-2xl font-bold text-gray-900">
                  {match.home_score} - {match.away_score}
                </div>
              ) : (
                <div className="text-gray-400 font-bold text-sm">VS</div>
              )}

              <div className="text-sm font-medium text-orange-600">
                {timeLeft}
              </div>
            </div>

            <div className="flex flex-col items-center w-1/3">
              <Image src={getFlag(awayTeam!)} alt="" width={40} height={40} className="rounded-full" />
              <span className="mt-1 text-sm font-semibold text-gray-900 text-center truncate">
                {awayTeam}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* LOCK BANNER */}
      {isLocked && (
        <div className="text-center text-xs text-red-500 font-medium">
          🔒 Predictions closed
        </div>
      )}

      {/* INPUT */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3 text-center">
          {existing ? 'Update Prediction' : 'Make Prediction'}
        </h2>

        <div className="flex items-center justify-center gap-3 mb-4">
          <input
            disabled={isLocked}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            type="number"
            className="w-14 h-12 border rounded-lg text-center text-lg disabled:bg-gray-100"
          />
          <span className="font-bold">-</span>
          <input
            disabled={isLocked}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            type="number"
            className="w-14 h-12 border rounded-lg text-center text-lg disabled:bg-gray-100"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || isLocked}
          className={`w-full py-3 rounded-lg text-white font-medium transition
            ${isLocked ? 'bg-gray-400' : 'bg-blue-700 hover:bg-blue-800'}
          `}
        >
          {isLocked
            ? 'Prediction locked'
            : saving
            ? 'Saving...'
            : existing
            ? 'Update'
            : 'Submit'}
        </button>
      </div>

      {/* PREDICTIONS */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Predictions</h2>

        <div className="space-y-2">
          {predictions.map((p) => (
            <div
              key={p.id}
              className={`
                flex justify-between items-center p-3 rounded-lg border text-sm
                ${p.user_id === userId ? 'bg-blue-50 border-blue-400' : 'bg-white'}
              `}
            >
              <div className="font-medium text-xs flex items-center gap-1">
                {p.username}
                {p.user_id === userId && (
                  <span className="text-[10px] text-blue-600 font-semibold">
                    (You)
                  </span>
                )}
              </div>

              <div className="text-right">
                <div className="font-semibold">
                  {p.predicted_home} - {p.predicted_away}
                </div>

                {match?.status === 'finished' && (
                  <div className="text-[10px] text-blue-600 font-medium">
                    {p.points ?? 0} pts
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm shadow">
          {toast}
        </div>
      )}
    </div>
  )
}