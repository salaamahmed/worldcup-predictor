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
  home_penalties?: number | null
  away_penalties?: number | null
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
    Mexico: 'mx',
    Canada: 'ca',
    USA: 'us',
    Brazil: 'br',
    Argentina: 'ar',
    Uruguay: 'uy',
    Paraguay: 'py',
    Chile: 'cl',
    Colombia: 'co',
    Peru: 'pe',
    Haiti: 'ht',

    'South Africa': 'za',
    Morocco: 'ma',
    Tunisia: 'tn',
    Senegal: 'sn',
    Ghana: 'gh',
    Nigeria: 'ng',

    'Korea Republic': 'kr',
    Japan: 'jp',
    China: 'cn',
    Iran: 'ir',
    Qatar: 'qa',
    'Saudi Arabia': 'sa',
    Australia: 'au',

    Czechia: 'cz',
    Germany: 'de',
    France: 'fr',
    Spain: 'es',
    Italy: 'it',
    Netherlands: 'nl',
    Belgium: 'be',
    Portugal: 'pt',
    Switzerland: 'ch',
    Croatia: 'hr',
    'Bosnia and Herzegovina': 'ba',
    Scotland: 'gb-sct',
    Türkiye: 'tr',

    Curaçao: 'cw',
    "Côte d'Ivoire": 'ci',
    Ecuador: 'ec',
    Sweden: 'se',
    Egypt: 'eg',
    'Cabo Verde': 'cv',
    'IR Iran': 'ir',
    'New Zealand': 'nz',
    Iraq: 'iq',
    Norway: 'no',
    Algeria: 'dz',
    Austria: 'at',
    Jordan: 'jo',
    'Congo DR': 'cg',
    England: 'gb-eng',
    Panama: 'pa',
    Uzbekistan: 'uz',
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

  // 🔥 INITIAL LOAD (UNCHANGED)
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

  // 🔥 REALTIME (UNCHANGED)
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

  // 🔥 COUNTDOWN (UNCHANGED)
  useEffect(() => {
    if (!match?.kickoff_time) return

    const interval = setInterval(() => {
      const now = Date.now()
      const kickoff = new Date(match.kickoff_time).getTime()
      const diff = kickoff - now

      // 🔴 LIVE / FT
      if (diff <= 0) {
        if (match.status === 'finished') {
          setTimeLeft('FT')
        } else {
          setTimeLeft('🔴 Live')
        }
        clearInterval(interval)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)

      let timeString = ''

      if (days > 0) {
        timeString = `${days}d ${hours}h`
      } else {
        timeString = `${hours}h ${minutes}m`
      }

      setTimeLeft(`🟢 Starts in ${timeString}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [match])

  const existing = predictions.find((p) => p.user_id === userId)

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

    // 🔥 INSTANT UI UPDATE (UNCHANGED)
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

  const getTimeColor = () => {
    if (timeLeft.includes('Live')) return 'text-red-600'
    if (timeLeft.includes('Starts')) return 'text-green-700'
    if (timeLeft === 'FT') return 'text-gray-500'
    return 'text-gray-600'
  }

  const homeTeam = match?.resolved_home_team || match?.home_team
  const awayTeam = match?.resolved_away_team || match?.away_team

  const homeWin =
    match?.status === 'finished' &&
    (
      (match.home_score! > match.away_score!) ||

      (
        match.home_score === match.away_score &&
        match.home_penalties != null &&
        match.away_penalties != null &&
        match.home_penalties > match.away_penalties
      )
    )

  const awayWin =
    match?.status === 'finished' &&
    (
      (match.away_score! > match.home_score!) ||

      (
        match.home_score === match.away_score &&
        match.home_penalties != null &&
        match.away_penalties != null &&
        match.away_penalties > match.home_penalties
      )
    )

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">

      {/* MATCH */}
      {match && (
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center justify-between">

            <div className="flex flex-col items-center w-1/3">
              <Image src={getFlag(homeTeam!)} alt="" width={44} height={44} className="rounded-full" />
              <span 
                className={`"mt-2 text-xs sm:text-base font-semibold text-gray-900 text-center"
                ${homeWin ? 'text-green-700' : 'text-gray-900'}
                `}
                >
                {homeTeam}
              </span>
            </div>

            <div className="text-center">
              {match.status === 'finished' ? (
                <div className="text-3xl font-bold">
                  <span className={homeWin ? 'text-green-700' : 'text-gray-900'}>
                    {match.home_score}
                  </span>
                  {' - '}
                  <span className={awayWin ? 'text-green-700' : 'text-gray-900'}>
                    {match.away_score}
                  </span>
                  {match.home_penalties != null &&
                    match.away_penalties != null && (

                      <div className="mt-2 text-sm text-gray-600 font-medium">
                        Penalties
                        <div className="text-lg font-bold text-gray-900">
                          <span className={homeWin ? 'text-green-700' : 'text-gray-900'}>
                            {match.home_penalties} 
                          </span>
                          {' - '} 
                          <span className={awayWin ? 'text-green-700' : 'text-gray-900'}>
                            {match.away_penalties}
                          </span>
                        </div>
                      </div>

                    )}
                </div>
              ) : (
                <div className="text-gray-500 font-bold text-sm">VS</div>
              )}

              <div className={`text-sm font-semibold mt-1 ${getTimeColor()}`}>
                {timeLeft}
              </div>
            </div>

            <div className="flex flex-col items-center w-1/3">
              <Image src={getFlag(awayTeam!)} alt="" width={44} height={44} className="rounded-full" />
              <span 
                className={`"mt-2 text-xs sm:text-base font-semibold text-gray-900 text-center"
                ${awayWin ? 'text-green-700' : 'text-gray-900'}
                `}
                >
                {awayTeam}
              </span>
            </div>

          </div>

        </div>
      )}

      {/* LOCK */}
      {isLocked && (
        <div className="text-center text-sm font-semibold text-red-600">
          🔒 Predictions closed
        </div>
      )}

      {/* INPUT */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-4 text-center text-gray-900">
          {existing ? 'Update Prediction' : 'Make Prediction'}
        </h2>

        <div className="flex items-center justify-center gap-4 mb-5">
          <input
            disabled={isLocked}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            type="number"
            className="w-16 h-14 border rounded-xl text-center text-xl text-gray-900 font-semibold disabled:bg-gray-100"
          />
          <span className="font-bold text-lg">-</span>
          <input
            disabled={isLocked}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            type="number"
            className="w-16 h-14 border rounded-xl text-center text-xl text-gray-900 font-semibold disabled:bg-gray-100"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || isLocked}
          className={`w-full py-3 rounded-xl text-white font-semibold text-base transition
            ${isLocked ? 'bg-gray-400' : 'bg-blue-800 active:scale-95'}
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
        <h2 className="text-base font-semibold mb-3 text-gray-900">
          Predictions
        </h2>

        <div className="space-y-3">
          {predictions.map((p) => (
            <div
              key={p.id}
              className={`
                flex justify-between items-center p-3 rounded-xl border text-sm
                ${p.user_id === userId ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}
              `}
            >
              <div className="font-medium text-sm text-gray-900 flex items-center gap-1">
                {p.username}
                {p.user_id === userId && (
                  <span className="text-xs text-blue-800 font-semibold">
                    (You)
                  </span>
                )}
              </div>

              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {p.predicted_home} - {p.predicted_away}
                </div>

                {match?.status === 'finished' && (
                  <div className="text-xs text-blue-800 font-medium">
                    {p.points ?? 0} pts
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl text-sm shadow">
          {toast}
        </div>
      )}
    </div>
  )
}